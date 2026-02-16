"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSession, createSessionForUser } from "@/lib/auth/session";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function signupAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!email || !password || password.length < 8) {
    redirect("/signup?error=invalid_input");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    redirect("/signup?error=email_exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
    select: { id: true },
  });

  await createSessionForUser(user.id);
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=invalid_credentials");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirect("/login?error=invalid_credentials");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    redirect("/login?error=invalid_credentials");
  }

  await createSessionForUser(user.id);
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}


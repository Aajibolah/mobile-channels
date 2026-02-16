import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasRequiredRole } from "@/lib/auth/rbac";

const SESSION_COOKIE = "sourcetrace_session";
const SESSION_TTL_DAYS = 30;

type SessionContext = {
  user: {
    id: string;
    email: string;
  };
};

export type ActiveMembership = {
  workspaceId: string;
  workspaceName: string;
  role: Role;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionForUser(userId: string): Promise<void> {
  const token = randomBytes(48).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  const headerStore = await headers();
  const cookieStore = await cookies();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      userAgent: headerStore.get("user-agent") ?? undefined,
      ipAddress:
        headerStore.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
        undefined,
    },
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    user: session.user,
  };
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function getActiveMembership(
  userId: string
): Promise<ActiveMembership | null> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) return null;

  return {
    workspaceId: membership.workspace.id,
    workspaceName: membership.workspace.name,
    role: membership.role,
  };
}

export async function requireActiveMembership(requiredRole: Role = "VIEWER") {
  const session = await requireSession();
  const membership = await getActiveMembership(session.user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  if (!hasRequiredRole(membership.role, requiredRole)) {
    redirect("/app?error=forbidden");
  }

  return {
    session,
    membership,
  };
}


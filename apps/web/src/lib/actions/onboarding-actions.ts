"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { setupWorkspaceForUser } from "@/lib/onboarding";

export async function completeOnboardingAction(formData: FormData) {
  const session = await requireSession();

  const workspaceName = String(formData.get("workspace_name") ?? "").trim();
  const appName = String(formData.get("app_name") ?? "").trim();
  const iosBundleId = String(formData.get("ios_bundle_id") ?? "").trim();
  const androidPackageName = String(
    formData.get("android_package_name") ?? ""
  ).trim();
  const appStoreId = String(formData.get("app_store_id") ?? "").trim();
  const playStoreId = String(formData.get("play_store_id") ?? "").trim();

  if (!workspaceName || !appName) {
    redirect("/onboarding?error=missing_required");
  }

  await setupWorkspaceForUser({
    userId: session.user.id,
    workspaceName,
    appName,
    iosBundleId,
    androidPackageName,
    appStoreId,
    playStoreId,
  });

  redirect("/app");
}


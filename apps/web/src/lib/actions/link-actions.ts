"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createWorkspaceLink } from "@/lib/links";

export async function createLinkAction(formData: FormData) {
  const { session, membership } = await requireActiveMembership("ANALYST");

  const appId = String(formData.get("app_id") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const campaign = String(formData.get("campaign") ?? "").trim();
  const adset = String(formData.get("adset") ?? "").trim();
  const creative = String(formData.get("creative") ?? "").trim();
  const influencerId = String(formData.get("influencer_id") ?? "").trim();
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();

  if (!appId || !source || !channel || !campaign) {
    redirect("/app/links?error=missing_required");
  }

  await createWorkspaceLink({
    workspaceId: membership.workspaceId,
    appId,
    actorUserId: session.user.id,
    actorRole: membership.role,
    source,
    channel,
    campaign,
    adset,
    creative,
    influencerId,
    destinationUrl,
  });

  revalidatePath("/app");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/links");
  redirect("/app/links");
}


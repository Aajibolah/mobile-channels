import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildLinkSlug } from "@/lib/slug";
import { hasRequiredRole } from "@/lib/auth/rbac";

export async function getWorkspaceApps(workspaceId: string) {
  return prisma.mobileApp.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      iosBundleId: true,
      androidPackageName: true,
      appStoreId: true,
      playStoreId: true,
    },
  });
}

export async function getWorkspaceLinks(workspaceId: string) {
  return prisma.trackingLink.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      app: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          clicks: true,
          installs: true,
        },
      },
    },
  });
}

type CreateWorkspaceLinkInput = {
  workspaceId: string;
  appId: string;
  actorUserId: string;
  actorRole: Role;
  source: string;
  channel: string;
  campaign: string;
  adset?: string;
  creative?: string;
  influencerId?: string;
  destinationUrl?: string;
};

export async function createWorkspaceLink(input: CreateWorkspaceLinkInput) {
  if (!hasRequiredRole(input.actorRole, "ANALYST")) {
    throw new Error("Insufficient role to create links.");
  }

  const app = await prisma.mobileApp.findFirst({
    where: {
      id: input.appId,
      workspaceId: input.workspaceId,
    },
    select: { id: true },
  });

  if (!app) {
    throw new Error("App not found in active workspace.");
  }

  const slug = buildLinkSlug(input.source, input.campaign);

  return prisma.trackingLink.create({
    data: {
      workspaceId: input.workspaceId,
      appId: input.appId,
      createdByUserId: input.actorUserId,
      slug,
      source: input.source.toLowerCase().trim(),
      channel: input.channel.toLowerCase().trim(),
      campaign: input.campaign.trim(),
      adset: input.adset?.trim() || null,
      creative: input.creative?.trim() || null,
      influencerId: input.influencerId?.trim() || null,
      destinationUrl: input.destinationUrl?.trim() || null,
    },
  });
}


import { Prisma, type Role } from "@prisma/client";
import { hasRequiredRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";

export type CostEntryInput = {
  workspaceId: string;
  actorRole: Role;
  appId?: string;
  source: string;
  channel: string;
  campaign?: string;
  adset?: string;
  creative?: string;
  date: string;
  costUsd: number;
  clicks?: number;
  impressions?: number;
  installs?: number;
  metadata?: Record<string, unknown>;
};

function parseDateValue(date: string): Date {
  const normalized = date.includes("T") ? date : `${date}T00:00:00.000Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${date}`);
  }
  return parsed;
}

export async function createCostEntry(input: CostEntryInput) {
  if (!hasRequiredRole(input.actorRole, "ANALYST")) {
    throw new Error("ANALYST or higher role required.");
  }

  if (input.appId) {
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
  }

  return prisma.adCostEntry.create({
    data: {
      workspaceId: input.workspaceId,
      appId: input.appId ?? null,
      source: input.source.toLowerCase().trim(),
      channel: input.channel.toLowerCase().trim(),
      campaign: input.campaign?.trim() || null,
      adset: input.adset?.trim() || null,
      creative: input.creative?.trim() || null,
      date: parseDateValue(input.date),
      costUsd: input.costUsd,
      clicks:
        typeof input.clicks === "number" ? Math.round(input.clicks) : null,
      impressions:
        typeof input.impressions === "number"
          ? Math.round(input.impressions)
          : null,
      installs:
        typeof input.installs === "number" ? Math.round(input.installs) : null,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createBulkCostEntries(
  workspaceId: string,
  actorRole: Role,
  entries: Omit<CostEntryInput, "workspaceId" | "actorRole">[]
) {
  if (!hasRequiredRole(actorRole, "ANALYST")) {
    throw new Error("ANALYST or higher role required.");
  }

  const created = [];
  for (const entry of entries) {
    const row = await createCostEntry({
      ...entry,
      workspaceId,
      actorRole,
    });
    created.push(row);
  }
  return created;
}

export async function listWorkspaceCostEntries(workspaceId: string) {
  return prisma.adCostEntry.findMany({
    where: { workspaceId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      date: true,
      source: true,
      channel: true,
      campaign: true,
      adset: true,
      creative: true,
      costUsd: true,
      clicks: true,
      impressions: true,
      installs: true,
      app: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
  });
}

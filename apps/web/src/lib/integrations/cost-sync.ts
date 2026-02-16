import type { Role } from "@prisma/client";
import { createBulkCostEntries } from "@/lib/costs";
import { fetchMetaCostRows } from "@/lib/integrations/meta";
import { fetchTikTokCostRows } from "@/lib/integrations/tiktok";
import type { CostSyncRequest } from "@/lib/integrations/types";

export async function syncProviderCostData(input: {
  workspaceId: string;
  actorRole: Role;
  appId?: string;
  provider: CostSyncRequest["provider"];
  startDate: string;
  endDate: string;
}) {
  let rows;
  if (input.provider === "meta") {
    rows = await fetchMetaCostRows(input.startDate, input.endDate);
  } else {
    rows = await fetchTikTokCostRows(input.startDate, input.endDate);
  }

  const created = await createBulkCostEntries(
    input.workspaceId,
    input.actorRole,
    rows.map((row) => ({
      appId: input.appId,
      source: row.source,
      channel: row.channel,
      campaign: row.campaign,
      adset: row.adset,
      creative: row.creative,
      date: row.date,
      costUsd: row.costUsd,
      clicks: row.clicks,
      impressions: row.impressions,
      installs: row.installs,
      metadata: row.metadata,
    }))
  );

  return created;
}


import { NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth/api";
import {
  createBulkCostEntries,
  createCostEntry,
  listWorkspaceCostEntries,
} from "@/lib/costs";

type CostPayload = {
  app_id?: string;
  source: string;
  channel: string;
  campaign?: string;
  adset?: string;
  creative?: string;
  date: string;
  cost_usd: number;
  clicks?: number;
  impressions?: number;
  installs?: number;
  metadata?: Record<string, unknown>;
};

export async function GET() {
  const auth = await getApiAuthContext("VIEWER");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listWorkspaceCostEntries(auth.membership.workspaceId);
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const auth = await getApiAuthContext("ANALYST");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CostPayload | CostPayload[];

  try {
    if (Array.isArray(body)) {
      for (const row of body) {
        if (
          !row.source ||
          !row.channel ||
          !row.date ||
          typeof row.cost_usd !== "number"
        ) {
          return NextResponse.json(
            {
              error:
                "Each row requires source, channel, date, and numeric cost_usd.",
            },
            { status: 400 }
          );
        }
      }

      const entries = await createBulkCostEntries(
        auth.membership.workspaceId,
        auth.membership.role,
        body.map((row) => ({
          appId: row.app_id,
          source: row.source,
          channel: row.channel,
          campaign: row.campaign,
          adset: row.adset,
          creative: row.creative,
          date: row.date,
          costUsd: row.cost_usd,
          clicks: row.clicks,
          impressions: row.impressions,
          installs: row.installs,
          metadata: row.metadata,
        }))
      );
      return NextResponse.json({ count: entries.length }, { status: 201 });
    }

    if (
      !body.source ||
      !body.channel ||
      !body.date ||
      typeof body.cost_usd !== "number"
    ) {
      return NextResponse.json(
        { error: "source, channel, date, and numeric cost_usd are required." },
        { status: 400 }
      );
    }

    const row = await createCostEntry({
      workspaceId: auth.membership.workspaceId,
      actorRole: auth.membership.role,
      appId: body.app_id,
      source: body.source,
      channel: body.channel,
      campaign: body.campaign,
      adset: body.adset,
      creative: body.creative,
      date: body.date,
      costUsd: body.cost_usd,
      clicks: body.clicks,
      impressions: body.impressions,
      installs: body.installs,
      metadata: body.metadata,
    });

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add cost row." },
      { status: 400 }
    );
  }
}

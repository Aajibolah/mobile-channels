import type { ExternalCostRow } from "@/lib/integrations/types";

type MetaInsightRow = {
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  spend?: string;
  clicks?: string;
  impressions?: string;
  date_start?: string;
  account_currency?: string;
};

type MetaInsightsResponse = {
  data?: MetaInsightRow[];
  paging?: {
    next?: string;
  };
};

function parseNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function fetchMetaPage(url: string): Promise<MetaInsightsResponse> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Meta API error ${response.status}: ${body}`);
  }

  return (await response.json()) as MetaInsightsResponse;
}

export async function fetchMetaCostRows(
  startDate: string,
  endDate: string
): Promise<ExternalCostRow[]> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    throw new Error(
      "Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID environment variables."
    );
  }

  const timeRange = encodeURIComponent(
    JSON.stringify({ since: startDate, until: endDate })
  );

  let nextUrl =
    `https://graph.facebook.com/v22.0/act_${adAccountId}/insights` +
    `?level=ad&time_increment=1` +
    `&fields=date_start,campaign_name,adset_name,ad_name,spend,clicks,impressions,account_currency` +
    `&time_range=${timeRange}` +
    `&limit=200` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const output: ExternalCostRow[] = [];

  while (nextUrl) {
    const page = await fetchMetaPage(nextUrl);
    const rows = page.data ?? [];

    for (const row of rows) {
      const costUsd = parseNumber(row.spend) ?? 0;
      output.push({
        date: row.date_start ?? startDate,
        source: "meta",
        channel: "paid_social",
        campaign: row.campaign_name ?? undefined,
        adset: row.adset_name ?? undefined,
        creative: row.ad_name ?? undefined,
        costUsd,
        clicks: parseNumber(row.clicks),
        impressions: parseNumber(row.impressions),
        metadata: {
          currency: row.account_currency ?? "USD",
        },
      });
    }

    nextUrl = page.paging?.next ?? "";
  }

  return output;
}


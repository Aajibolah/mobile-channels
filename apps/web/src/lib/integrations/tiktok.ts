import type { ExternalCostRow } from "@/lib/integrations/types";

type TikTokReportRow = {
  stat_time_day?: string;
  campaign_name?: string;
  adgroup_name?: string;
  ad_name?: string;
  spend?: string;
  clicks?: string;
  impressions?: string;
};

type TikTokResponse = {
  code?: number;
  message?: string;
  data?: {
    list?: TikTokReportRow[];
    page_info?: {
      page?: number;
      total_page?: number;
    };
  };
};

function parseNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function fetchTikTokPage(
  accessToken: string,
  advertiserId: string,
  startDate: string,
  endDate: string,
  page: number
) {
  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/",
    {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        data_level: "AUCTION_AD",
        dimensions: [
          "stat_time_day",
          "campaign_name",
          "adgroup_name",
          "ad_name",
        ],
        metrics: ["spend", "clicks", "impressions"],
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: 200,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TikTok API error ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as TikTokResponse;
  if (payload.code && payload.code !== 0) {
    throw new Error(`TikTok API error ${payload.code}: ${payload.message}`);
  }

  return payload;
}

export async function fetchTikTokCostRows(
  startDate: string,
  endDate: string
): Promise<ExternalCostRow[]> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;

  if (!accessToken || !advertiserId) {
    throw new Error(
      "Missing TIKTOK_ACCESS_TOKEN or TIKTOK_ADVERTISER_ID environment variables."
    );
  }

  const output: ExternalCostRow[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const payload = await fetchTikTokPage(
      accessToken,
      advertiserId,
      startDate,
      endDate,
      page
    );
    const rows = payload.data?.list ?? [];
    totalPages = payload.data?.page_info?.total_page ?? 1;

    for (const row of rows) {
      output.push({
        date: row.stat_time_day ?? startDate,
        source: "tiktok",
        channel: "paid_social",
        campaign: row.campaign_name ?? undefined,
        adset: row.adgroup_name ?? undefined,
        creative: row.ad_name ?? undefined,
        costUsd: parseNumber(row.spend) ?? 0,
        clicks: parseNumber(row.clicks),
        impressions: parseNumber(row.impressions),
      });
    }

    page += 1;
  }

  return output;
}


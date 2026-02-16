export type ExternalCostRow = {
  date: string;
  source: string;
  channel: string;
  campaign?: string;
  adset?: string;
  creative?: string;
  costUsd: number;
  clicks?: number;
  impressions?: number;
  installs?: number;
  metadata?: Record<string, unknown>;
};

export type CostSyncRequest = {
  provider: "meta" | "tiktok";
  startDate: string;
  endDate: string;
};


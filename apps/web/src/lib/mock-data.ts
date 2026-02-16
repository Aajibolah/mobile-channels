export type MetricCard = {
  id: string;
  label: string;
  value: string;
  trend: string;
};

export type ChannelRow = {
  source: string;
  channel: string;
  installs: number;
  signups: number;
  revenueUsd: number;
  cpaUsd: number;
  roas: string;
};

export type LinkRow = {
  id: string;
  source: string;
  channel: string;
  campaign: string;
  influencerId: string | null;
  clicks: number;
  installs: number;
  createdAt: string;
};

export const metricCards: MetricCard[] = [
  { id: "installs", label: "Attributed Installs", value: "12,640", trend: "+12.4%" },
  { id: "cpa", label: "Blended CPA", value: "$9.71", trend: "-8.1%" },
  { id: "revenue", label: "Attributed Revenue", value: "$198,420", trend: "+17.9%" },
  { id: "roas", label: "7-Day ROAS", value: "2.34x", trend: "+0.21x" },
];

export const channelRows: ChannelRow[] = [
  {
    source: "TikTok",
    channel: "paid_social",
    installs: 5120,
    signups: 1978,
    revenueUsd: 76840,
    cpaUsd: 8.93,
    roas: "2.52x",
  },
  {
    source: "Instagram Influencer",
    channel: "influencer",
    installs: 2748,
    signups: 1021,
    revenueUsd: 39220,
    cpaUsd: 7.54,
    roas: "2.88x",
  },
  {
    source: "Meta Ads",
    channel: "paid_social",
    installs: 3772,
    signups: 1482,
    revenueUsd: 82360,
    cpaUsd: 11.34,
    roas: "1.96x",
  },
  {
    source: "Organic Social",
    channel: "organic_social",
    installs: 1000,
    signups: 420,
    revenueUsd: 0,
    cpaUsd: 0,
    roas: "n/a",
  },
];

export const linkRows: LinkRow[] = [
  {
    id: "lnk_01JXAA42K2",
    source: "TikTok",
    channel: "paid_social",
    campaign: "us_q1_acq_launch",
    influencerId: null,
    clicks: 13490,
    installs: 3850,
    createdAt: "2026-02-01",
  },
  {
    id: "lnk_01JXAB81MS",
    source: "Instagram",
    channel: "influencer",
    campaign: "creator_jan_wave",
    influencerId: "mila_fit_102",
    clicks: 5012,
    installs: 1240,
    createdAt: "2026-01-25",
  },
  {
    id: "lnk_01JXABM9Q8",
    source: "Meta",
    channel: "paid_social",
    campaign: "retargeting_ios_t1",
    influencerId: null,
    clicks: 9480,
    installs: 2110,
    createdAt: "2026-02-05",
  },
];


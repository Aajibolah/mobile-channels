import { EventName } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  trend: string;
};

export type ChannelPerformanceRow = {
  source: string;
  channel: string;
  installs: number;
  signups: number;
  revenueUsd: number;
  spendUsd: number;
  cacUsd: number;
  roas: string;
};

type DateRange = {
  start: Date;
  end: Date;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function percentChange(current: number, previous: number): string {
  if (previous <= 0 && current > 0) return "+100%";
  if (previous <= 0 && current <= 0) return "0%";

  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

function makeDateRange(days: number): DateRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days);
  return { start, end };
}

export async function getWorkspaceDashboardMetrics(workspaceId: string) {
  const currentRange = makeDateRange(7);
  const previousRange: DateRange = {
    start: new Date(currentRange.start.getTime() - 7 * 24 * 60 * 60 * 1000),
    end: currentRange.start,
  };

  const [
    installsCurrent,
    installsPrevious,
    signupsCurrent,
    signupsPrevious,
    spendCurrentAgg,
    spendPreviousAgg,
    revenueCurrentAgg,
    revenuePreviousAgg,
  ] = await Promise.all([
    prisma.install.count({
      where: {
        workspaceId,
        installedAt: {
          gte: currentRange.start,
          lt: currentRange.end,
        },
      },
    }),
    prisma.install.count({
      where: {
        workspaceId,
        installedAt: {
          gte: previousRange.start,
          lt: previousRange.end,
        },
      },
    }),
    prisma.event.count({
      where: {
        workspaceId,
        eventName: EventName.SIGNUP,
        occurredAt: {
          gte: currentRange.start,
          lt: currentRange.end,
        },
      },
    }),
    prisma.event.count({
      where: {
        workspaceId,
        eventName: EventName.SIGNUP,
        occurredAt: {
          gte: previousRange.start,
          lt: previousRange.end,
        },
      },
    }),
    prisma.adCostEntry.aggregate({
      where: {
        workspaceId,
        date: {
          gte: currentRange.start,
          lt: currentRange.end,
        },
      },
      _sum: { costUsd: true },
    }),
    prisma.adCostEntry.aggregate({
      where: {
        workspaceId,
        date: {
          gte: previousRange.start,
          lt: previousRange.end,
        },
      },
      _sum: { costUsd: true },
    }),
    prisma.event.aggregate({
      where: {
        workspaceId,
        eventName: {
          in: [
            EventName.PURCHASE,
            EventName.SUBSCRIPTION_START,
            EventName.SUBSCRIPTION_RENEWAL,
          ],
        },
        occurredAt: {
          gte: currentRange.start,
          lt: currentRange.end,
        },
      },
      _sum: { eventValue: true },
    }),
    prisma.event.aggregate({
      where: {
        workspaceId,
        eventName: {
          in: [
            EventName.PURCHASE,
            EventName.SUBSCRIPTION_START,
            EventName.SUBSCRIPTION_RENEWAL,
          ],
        },
        occurredAt: {
          gte: previousRange.start,
          lt: previousRange.end,
        },
      },
      _sum: { eventValue: true },
    }),
  ]);

  const spendCurrent = spendCurrentAgg._sum.costUsd ?? 0;
  const spendPrevious = spendPreviousAgg._sum.costUsd ?? 0;
  const revenueCurrent = revenueCurrentAgg._sum.eventValue ?? 0;
  const revenuePrevious = revenuePreviousAgg._sum.eventValue ?? 0;

  const cacCurrent = signupsCurrent > 0 ? spendCurrent / signupsCurrent : 0;
  const cacPrevious = signupsPrevious > 0 ? spendPrevious / signupsPrevious : 0;
  const roasCurrent = spendCurrent > 0 ? revenueCurrent / spendCurrent : 0;
  const roasPrevious = spendPrevious > 0 ? revenuePrevious / spendPrevious : 0;

  const metrics: DashboardMetric[] = [
    {
      id: "installs",
      label: "Attributed Installs",
      value: formatCompactNumber(installsCurrent),
      trend: percentChange(installsCurrent, installsPrevious),
    },
    {
      id: "spend",
      label: "Ad Spend",
      value: formatCurrency(spendCurrent),
      trend: percentChange(spendCurrent, spendPrevious),
    },
    {
      id: "cac",
      label: "CAC",
      value: formatCurrency(cacCurrent),
      trend: percentChange(cacCurrent, cacPrevious),
    },
    {
      id: "roas",
      label: "ROAS",
      value: `${roasCurrent.toFixed(2)}x`,
      trend: percentChange(roasCurrent, roasPrevious),
    },
    {
      id: "revenue",
      label: "Attributed Revenue",
      value: formatCurrency(revenueCurrent),
      trend: percentChange(revenueCurrent, revenuePrevious),
    },
  ];

  return metrics;
}

export async function getWorkspaceChannelPerformance(
  workspaceId: string
): Promise<ChannelPerformanceRow[]> {
  const startDate = makeDateRange(30).start;

  const [installGroups, signupGroups, revenueGroups, spendGroups] = await Promise.all([
    prisma.install.groupBy({
      by: ["attributedSource", "attributedChannel"],
      where: {
        workspaceId,
        installedAt: {
          gte: startDate,
        },
      },
      _count: { _all: true },
    }),
    prisma.event.groupBy({
      by: ["attributionSource", "attributionChannel"],
      where: {
        workspaceId,
        eventName: EventName.SIGNUP,
        occurredAt: {
          gte: startDate,
        },
      },
      _count: { _all: true },
    }),
    prisma.event.groupBy({
      by: ["attributionSource", "attributionChannel"],
      where: {
        workspaceId,
        eventName: {
          in: [
            EventName.PURCHASE,
            EventName.SUBSCRIPTION_START,
            EventName.SUBSCRIPTION_RENEWAL,
          ],
        },
        occurredAt: {
          gte: startDate,
        },
      },
      _sum: {
        eventValue: true,
      },
    }),
    prisma.adCostEntry.groupBy({
      by: ["source", "channel"],
      where: {
        workspaceId,
        date: {
          gte: startDate,
        },
      },
      _sum: {
        costUsd: true,
      },
    }),
  ]);

  const rowsByKey = new Map<string, ChannelPerformanceRow>();
  const normalizeKey = (source: string, channel: string) =>
    `${source}::${channel}`;

  for (const install of installGroups) {
    const source = install.attributedSource ?? "organic";
    const channel = install.attributedChannel ?? "organic";
    const key = normalizeKey(source, channel);
    rowsByKey.set(key, {
      source,
      channel,
      installs: install._count._all,
      signups: 0,
      revenueUsd: 0,
      spendUsd: 0,
      cacUsd: 0,
      roas: "n/a",
    });
  }

  for (const signup of signupGroups) {
    const source = signup.attributionSource ?? "organic";
    const channel = signup.attributionChannel ?? "organic";
    const key = normalizeKey(source, channel);
    const row = rowsByKey.get(key) ?? {
      source,
      channel,
      installs: 0,
      signups: 0,
      revenueUsd: 0,
      spendUsd: 0,
      cacUsd: 0,
      roas: "n/a",
    };
    row.signups = signup._count._all;
    rowsByKey.set(key, row);
  }

  for (const revenue of revenueGroups) {
    const source = revenue.attributionSource ?? "organic";
    const channel = revenue.attributionChannel ?? "organic";
    const key = normalizeKey(source, channel);
    const row = rowsByKey.get(key) ?? {
      source,
      channel,
      installs: 0,
      signups: 0,
      revenueUsd: 0,
      spendUsd: 0,
      cacUsd: 0,
      roas: "n/a",
    };
    row.revenueUsd = revenue._sum.eventValue ?? 0;
    rowsByKey.set(key, row);
  }

  for (const spend of spendGroups) {
    const source = spend.source;
    const channel = spend.channel;
    const key = normalizeKey(source, channel);
    const row = rowsByKey.get(key) ?? {
      source,
      channel,
      installs: 0,
      signups: 0,
      revenueUsd: 0,
      spendUsd: 0,
      cacUsd: 0,
      roas: "n/a",
    };
    row.spendUsd = spend._sum.costUsd ?? 0;
    rowsByKey.set(key, row);
  }

  for (const row of rowsByKey.values()) {
    row.cacUsd = row.signups > 0 ? row.spendUsd / row.signups : 0;
    row.roas = row.spendUsd > 0 ? `${(row.revenueUsd / row.spendUsd).toFixed(2)}x` : "n/a";
  }

  return Array.from(rowsByKey.values()).sort((a, b) => b.installs - a.installs);
}

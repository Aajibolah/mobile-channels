import { Platform, type Click, type TrackingLink } from "@prisma/client";

type ReferrerValues = {
  clickId?: string;
  linkSlug?: string;
};

export function parseInstallReferrer(referrer?: string | null): ReferrerValues {
  if (!referrer) return {};

  const params = new URLSearchParams(referrer);
  return {
    clickId: params.get("st_click_id") ?? undefined,
    linkSlug: params.get("st_link_slug") ?? undefined,
  };
}

export function detectPlatformFromUserAgent(
  userAgent?: string | null
): Platform | undefined {
  if (!userAgent) return undefined;
  const ua = userAgent.toLowerCase();
  if (ua.includes("android")) return "ANDROID";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) {
    return "IOS";
  }
  return undefined;
}

export type AttributionResult = {
  status: "ATTRIBUTED" | "ORGANIC";
  source: string | null;
  channel: string | null;
  campaign: string | null;
  link: TrackingLink | null;
  click: Click | null;
};

export function buildAttributionResult(
  link: TrackingLink | null,
  click: Click | null
): AttributionResult {
  if (!link) {
    return {
      status: "ORGANIC",
      source: null,
      channel: null,
      campaign: null,
      link: null,
      click: null,
    };
  }

  return {
    status: "ATTRIBUTED",
    source: link.source,
    channel: link.channel,
    campaign: link.campaign,
    link,
    click,
  };
}


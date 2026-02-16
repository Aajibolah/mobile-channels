import { EventName, Platform } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseInstallReferrer } from "@/lib/attribution";
import { authenticateIngestionRequest } from "@/lib/ingestion-keys";
import { prisma } from "@/lib/prisma";

type InstallPayload = {
  app_id: string;
  platform: "ios" | "android";
  installed_at?: string;
  device_id?: string;
  external_user_id?: string;
  install_referrer?: string;
  app_store_campaign_token?: string;
  click_id?: string;
  link_slug?: string;
  skan_campaign_id?: string;
};

function toPlatform(platform: InstallPayload["platform"]): Platform {
  return platform === "ios" ? "IOS" : "ANDROID";
}

function parseIsoDate(value?: string): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function parseAppStoreCampaignToken(token?: string | null): {
  clickId?: string;
  linkSlug?: string;
} {
  if (!token) return {};
  const [linkSlug, clickId] = token.split(".");
  return {
    linkSlug: linkSlug || undefined,
    clickId: clickId || undefined,
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<InstallPayload>;
  if (!payload.app_id || !payload.platform) {
    return NextResponse.json(
      { error: "Missing required fields. Expected app_id and platform." },
      { status: 400 }
    );
  }

  if (payload.platform !== "ios" && payload.platform !== "android") {
    return NextResponse.json(
      { error: "platform must be ios or android." },
      { status: 400 }
    );
  }

  const ingestionAuth = await authenticateIngestionRequest(
    request,
    "mobile:install:write",
    payload.app_id
  );
  if (!ingestionAuth) {
    return NextResponse.json({ error: "Unauthorized ingestion key." }, { status: 401 });
  }

  const app = await prisma.mobileApp.findUnique({
    where: { id: payload.app_id },
    select: {
      id: true,
      workspaceId: true,
    },
  });
  if (!app) {
    return NextResponse.json({ error: "Unknown app_id." }, { status: 404 });
  }

  if (app.workspaceId !== ingestionAuth.workspaceId) {
    return NextResponse.json(
      { error: "App does not belong to ingestion key workspace." },
      { status: 403 }
    );
  }

  const referrerValues = parseInstallReferrer(payload.install_referrer);
  const campaignTokenValues = parseAppStoreCampaignToken(
    payload.app_store_campaign_token
  );
  const clickId =
    payload.click_id ??
    referrerValues.clickId ??
    campaignTokenValues.clickId;
  const linkSlug =
    payload.link_slug ??
    referrerValues.linkSlug ??
    campaignTokenValues.linkSlug;

  let matchedClick: {
    id: string;
    clickId: string;
    link: {
      id: string;
      appId: string;
      source: string;
      channel: string;
      campaign: string;
    };
  } | null = null;
  let matchedLink: {
    id: string;
    appId: string;
    source: string;
    channel: string;
    campaign: string;
  } | null = null;

  if (clickId) {
    matchedClick = await prisma.click.findUnique({
      where: { clickId },
      include: {
        link: {
          select: {
            id: true,
            appId: true,
            source: true,
            channel: true,
            campaign: true,
          },
        },
      },
    });
  }

  if (matchedClick?.link?.appId === app.id) {
    matchedLink = matchedClick.link;
  } else {
    matchedClick = null;
  }

  if (!matchedLink && linkSlug) {
    matchedLink = await prisma.trackingLink.findFirst({
      where: {
        slug: linkSlug,
        appId: app.id,
      },
      select: {
        id: true,
        appId: true,
        source: true,
        channel: true,
        campaign: true,
      },
    });
  }

  const attributionStatus = matchedLink ? "ATTRIBUTED" : "ORGANIC";
  const attributedSource = matchedLink?.source ?? null;
  const attributedChannel = matchedLink?.channel ?? null;
  const attributedCampaign = matchedLink?.campaign ?? null;

  const installedAt = parseIsoDate(payload.installed_at);
  const platform = toPlatform(payload.platform);

  const install = await prisma.install.create({
    data: {
      workspaceId: app.workspaceId,
      appId: app.id,
      linkId: matchedLink?.id ?? null,
      clickInternalId: matchedClick?.id ?? null,
      platform,
      deviceId: payload.device_id ?? null,
      externalUserId: payload.external_user_id ?? null,
      installReferrer: payload.install_referrer ?? null,
      skanCampaignId: payload.skan_campaign_id ?? null,
      installedAt,
      attributionStatus,
      attributedSource,
      attributedChannel,
      attributedCampaign,
    },
  });

  await prisma.event.create({
    data: {
      workspaceId: app.workspaceId,
      appId: app.id,
      installId: install.id,
      eventName: EventName.INSTALL,
      occurredAt: installedAt,
      platform,
      deviceId: payload.device_id ?? null,
      externalUserId: payload.external_user_id ?? null,
      attributionStatus,
      attributionSource: attributedSource,
      attributionChannel: attributedChannel,
      attributionCampaign: attributedCampaign,
      metadata: {
        referrer_click_id: clickId ?? null,
        referrer_link_slug: linkSlug ?? null,
        app_store_campaign_token: payload.app_store_campaign_token ?? null,
      },
    },
  });

  return NextResponse.json(
    {
      data: {
        install_id: install.id,
        attribution: {
          status: attributionStatus,
          source: attributedSource ?? "organic",
          channel: attributedChannel ?? "organic",
          campaign: attributedCampaign ?? "organic",
          matched_click_id: matchedClick?.clickId ?? null,
          matched_link_id: matchedLink?.id ?? null,
        },
      },
    },
    { status: 201 }
  );
}

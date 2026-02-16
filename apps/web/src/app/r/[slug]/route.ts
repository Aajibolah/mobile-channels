import { NextResponse } from "next/server";
import { Platform, type MobileApp, type TrackingLink } from "@prisma/client";
import { detectPlatformFromUserAgent } from "@/lib/attribution";
import { prisma } from "@/lib/prisma";

const defaultFallbackUrl = "https://sourcetrace.app";

function buildFallbackUrl(request: Request): URL {
  const configured =
    process.env.NEXT_PUBLIC_APP_FALLBACK_URL ?? defaultFallbackUrl;
  return new URL(configured, request.url);
}

function buildPlayStoreUrl(
  app: MobileApp,
  link: TrackingLink,
  clickId: string,
  request: Request
): URL {
  const packageId = app.playStoreId ?? app.androidPackageName;
  if (!packageId) return buildFallbackUrl(request);

  const referrer = new URLSearchParams({
    st_click_id: clickId,
    st_link_slug: link.slug,
    source: link.source,
    channel: link.channel,
    campaign: link.campaign,
  });

  return new URL(
    `https://play.google.com/store/apps/details?id=${encodeURIComponent(
      packageId
    )}&referrer=${encodeURIComponent(referrer.toString())}`
  );
}

function buildAppStoreUrl(
  app: MobileApp,
  link: TrackingLink,
  clickId: string,
  request: Request
): URL {
  if (app.appStoreId) {
    return new URL(
      `https://apps.apple.com/app/id${app.appStoreId}?ct=${encodeURIComponent(
        `${link.slug}.${clickId}`
      )}`
    );
  }

  if (link.destinationUrl) {
    return new URL(link.destinationUrl, request.url);
  }

  return buildFallbackUrl(request);
}

function chooseDestination(
  platform: Platform,
  app: MobileApp,
  link: TrackingLink,
  clickId: string,
  request: Request
): URL {
  if (platform === "ANDROID") {
    return buildPlayStoreUrl(app, link, clickId, request);
  }

  if (platform === "IOS") {
    return buildAppStoreUrl(app, link, clickId, request);
  }

  return link.destinationUrl
    ? new URL(link.destinationUrl, request.url)
    : buildFallbackUrl(request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const link = await prisma.trackingLink.findUnique({
    where: { slug },
    include: {
      app: true,
    },
  });

  if (!link) {
    return NextResponse.redirect(buildFallbackUrl(request), { status: 302 });
  }

  const requestUrl = new URL(request.url);
  const userAgent = request.headers.get("user-agent");
  const platformHint = detectPlatformFromUserAgent(userAgent);
  const requestedPlatform = requestUrl.searchParams.get("platform");

  const platform: Platform =
    requestedPlatform === "ios"
      ? "IOS"
      : requestedPlatform === "android"
      ? "ANDROID"
      : platformHint ??
        (link.app.androidPackageName || link.app.playStoreId ? "ANDROID" : "IOS");

  const clickId = `clk_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

  await prisma.click.create({
    data: {
      linkId: link.id,
      clickId,
      userAgent: userAgent ?? undefined,
      referrer: request.headers.get("referer") ?? undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
        undefined,
      locale: request.headers.get("accept-language") ?? undefined,
      platformHint,
      query: Object.fromEntries(requestUrl.searchParams.entries()),
    },
  });

  const destination = chooseDestination(platform, link.app, link, clickId, request);
  return NextResponse.redirect(destination, { status: 302 });
}


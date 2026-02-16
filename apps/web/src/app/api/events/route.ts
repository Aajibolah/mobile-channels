import { EventName, Platform, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth/api";
import { authenticateIngestionRequest } from "@/lib/ingestion-keys";
import { prisma } from "@/lib/prisma";

type EventPayload = {
  event_name: string;
  event_timestamp: string;
  app_id: string;
  platform: "ios" | "android";
  install_id?: string;
  device_id?: string;
  user_id?: string;
  event_value?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

const eventMap: Record<string, EventName> = {
  install: EventName.INSTALL,
  signup: EventName.SIGNUP,
  trial_start: EventName.TRIAL_START,
  purchase: EventName.PURCHASE,
  subscription_start: EventName.SUBSCRIPTION_START,
  subscription_renewal: EventName.SUBSCRIPTION_RENEWAL,
};

function toPlatform(value: EventPayload["platform"]): Platform {
  return value === "ios" ? "IOS" : "ANDROID";
}

function parseTimestamp(timestamp: string): Date {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

export async function GET() {
  const auth = await getApiAuthContext("VIEWER");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: {
      workspaceId: auth.membership.workspaceId,
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: 100,
    select: {
      id: true,
      eventName: true,
      occurredAt: true,
      appId: true,
      installId: true,
      eventValue: true,
      attributionSource: true,
      attributionChannel: true,
      attributionCampaign: true,
      attributionStatus: true,
    },
  });

  return NextResponse.json({ count: events.length, data: events });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<EventPayload>;

  if (
    !payload.event_name ||
    !payload.event_timestamp ||
    !payload.app_id ||
    !payload.platform
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields. Expected event_name, event_timestamp, app_id, platform.",
      },
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
    "mobile:event:write",
    payload.app_id
  );
  if (!ingestionAuth) {
    return NextResponse.json({ error: "Unauthorized ingestion key." }, { status: 401 });
  }

  const app = await prisma.mobileApp.findUnique({
    where: { id: payload.app_id },
    select: { id: true, workspaceId: true },
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

  const canonicalEvent = eventMap[payload.event_name] ?? EventName.CUSTOM;
  const occurredAt = parseTimestamp(payload.event_timestamp);
  const platform = toPlatform(payload.platform);

  let install = null;
  if (payload.install_id) {
    install = await prisma.install.findFirst({
      where: {
        id: payload.install_id,
        workspaceId: app.workspaceId,
        appId: app.id,
      },
      select: {
        id: true,
        attributedSource: true,
        attributedChannel: true,
        attributedCampaign: true,
        attributionStatus: true,
      },
    });
  } else if (payload.device_id) {
    install = await prisma.install.findFirst({
      where: {
        workspaceId: app.workspaceId,
        appId: app.id,
        deviceId: payload.device_id,
      },
      orderBy: {
        installedAt: "desc",
      },
      select: {
        id: true,
        attributedSource: true,
        attributedChannel: true,
        attributedCampaign: true,
        attributionStatus: true,
      },
    });
  }

  const event = await prisma.event.create({
    data: {
      workspaceId: app.workspaceId,
      appId: app.id,
      installId: install?.id ?? null,
      eventName: canonicalEvent,
      eventNameRaw: canonicalEvent === EventName.CUSTOM ? payload.event_name : null,
      occurredAt,
      platform,
      deviceId: payload.device_id ?? null,
      externalUserId: payload.user_id ?? null,
      eventValue:
        typeof payload.event_value === "number" ? payload.event_value : null,
      currency: payload.currency ?? null,
      metadata: payload.metadata as Prisma.InputJsonValue | undefined,
      attributionStatus: install?.attributionStatus ?? "ORGANIC",
      attributionSource: install?.attributedSource ?? null,
      attributionChannel: install?.attributedChannel ?? null,
      attributionCampaign: install?.attributedCampaign ?? null,
    },
    select: {
      id: true,
      eventName: true,
      installId: true,
      attributionSource: true,
      attributionChannel: true,
      attributionCampaign: true,
      attributionStatus: true,
    },
  });

  if (payload.user_id && install?.id) {
    await prisma.install.update({
      where: { id: install.id },
      data: { externalUserId: payload.user_id },
    });
  }

  return NextResponse.json(
    {
      accepted: true,
      data: {
        event_id: event.id,
        event_name: event.eventName,
        install_id: event.installId,
        attribution: {
          status: event.attributionStatus,
          source: event.attributionSource ?? "organic",
          channel: event.attributionChannel ?? "organic",
          campaign: event.attributionCampaign ?? "organic",
        },
      },
    },
    { status: 202 }
  );
}

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { authenticateIngestionRequest } from "@/lib/ingestion-keys";
import { prisma } from "@/lib/prisma";

type SkanPayload = {
  app_id: string;
  campaign_id?: string;
  conversion_value?: number;
  source_app_id?: string;
  fidelity_type?: string;
  is_redownload?: boolean;
  postback_at?: string;
  raw_payload: Record<string, unknown>;
};

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<SkanPayload>;

  if (!payload.app_id || !payload.raw_payload) {
    return NextResponse.json(
      { error: "app_id and raw_payload are required." },
      { status: 400 }
    );
  }

  const ingestionAuth = await authenticateIngestionRequest(
    request,
    "mobile:skan:write",
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

  const postback = await prisma.skanPostback.create({
    data: {
      workspaceId: app.workspaceId,
      appId: app.id,
      campaignId: payload.campaign_id ?? null,
      conversionValue:
        typeof payload.conversion_value === "number"
          ? Math.round(payload.conversion_value)
          : null,
      sourceAppId: payload.source_app_id ?? null,
      fidelityType: payload.fidelity_type ?? null,
      isRedownload:
        typeof payload.is_redownload === "boolean"
          ? payload.is_redownload
          : null,
      postbackAt: parseDate(payload.postback_at),
      rawPayload: payload.raw_payload as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      appId: true,
      campaignId: true,
      conversionValue: true,
      postbackAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: postback }, { status: 201 });
}

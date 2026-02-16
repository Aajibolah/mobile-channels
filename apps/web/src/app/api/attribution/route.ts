import { NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

type AttributionRequest = {
  install_id?: string;
};

export async function POST(request: Request) {
  const auth = await getApiAuthContext("VIEWER");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as AttributionRequest;
  if (!payload.install_id) {
    return NextResponse.json(
      { error: "install_id is required." },
      { status: 400 }
    );
  }

  const install = await prisma.install.findFirst({
    where: {
      id: payload.install_id,
      workspaceId: auth.membership.workspaceId,
    },
    include: {
      link: {
        select: {
          id: true,
          slug: true,
          source: true,
          channel: true,
          campaign: true,
        },
      },
      click: {
        select: {
          clickId: true,
          clickedAt: true,
        },
      },
    },
  });

  if (!install) {
    return NextResponse.json({ error: "install_id not found." }, { status: 404 });
  }

  return NextResponse.json({
    install_id: install.id,
    attribution: {
      status: install.attributionStatus,
      source: install.attributedSource ?? "organic",
      channel: install.attributedChannel ?? "organic",
      campaign: install.attributedCampaign ?? "organic",
      link_id: install.link?.id ?? null,
      link_slug: install.link?.slug ?? null,
      click_id: install.click?.clickId ?? null,
      click_time: install.click?.clickedAt ?? null,
    },
  });
}


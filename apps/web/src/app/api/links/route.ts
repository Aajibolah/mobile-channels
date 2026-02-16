import { NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth/api";
import { createWorkspaceLink, getWorkspaceLinks } from "@/lib/links";

type LinkPayload = {
  app_id: string;
  source: string;
  channel: string;
  campaign: string;
  adset?: string;
  creative?: string;
  influencer_id?: string;
  destination_url?: string;
};

const trackingBase =
  process.env.NEXT_PUBLIC_TRACKING_BASE_URL ?? "http://localhost:3000";

export async function GET() {
  const auth = await getApiAuthContext("VIEWER");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await getWorkspaceLinks(auth.membership.workspaceId);
  return NextResponse.json({
    data: links.map((link) => ({
      id: link.id,
      app_id: link.appId,
      app_name: link.app.name,
      slug: link.slug,
      source: link.source,
      channel: link.channel,
      campaign: link.campaign,
      adset: link.adset,
      creative: link.creative,
      influencer_id: link.influencerId,
      destination_url: link.destinationUrl,
      clicks: link._count.clicks,
      installs: link._count.installs,
      url: `${trackingBase}/r/${link.slug}`,
      created_at: link.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await getApiAuthContext("ANALYST");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<LinkPayload>;

  if (!body.app_id || !body.source || !body.channel || !body.campaign) {
    return NextResponse.json(
      {
        error:
          "Missing required fields. Expected app_id, source, channel, campaign.",
      },
      { status: 400 }
    );
  }

  try {
    const link = await createWorkspaceLink({
      workspaceId: auth.membership.workspaceId,
      appId: body.app_id,
      actorUserId: auth.session.user.id,
      actorRole: auth.membership.role,
      source: body.source,
      channel: body.channel,
      campaign: body.campaign,
      adset: body.adset,
      creative: body.creative,
      influencerId: body.influencer_id,
      destinationUrl: body.destination_url,
    });

    return NextResponse.json(
      {
        data: {
          id: link.id,
          slug: link.slug,
          url: `${trackingBase}/r/${link.slug}`,
          created_at: link.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create link.",
      },
      { status: 400 }
    );
  }
}


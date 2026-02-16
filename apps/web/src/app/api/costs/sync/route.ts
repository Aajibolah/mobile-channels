import { NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth/api";
import { syncProviderCostData } from "@/lib/integrations/cost-sync";

type SyncPayload = {
  provider: "meta" | "tiktok";
  start_date: string;
  end_date: string;
  app_id?: string;
};

function isIsoDate(value?: string): boolean {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: Request) {
  const auth = await getApiAuthContext("ANALYST");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SyncPayload>;
  if (
    !body.provider ||
    (body.provider !== "meta" && body.provider !== "tiktok") ||
    !isIsoDate(body.start_date) ||
    !isIsoDate(body.end_date)
  ) {
    return NextResponse.json(
      {
        error:
          "provider, start_date, and end_date are required. Dates must be YYYY-MM-DD.",
      },
      { status: 400 }
    );
  }

  const provider = body.provider as "meta" | "tiktok";
  const startDate = body.start_date as string;
  const endDate = body.end_date as string;

  try {
    const rows = await syncProviderCostData({
      workspaceId: auth.membership.workspaceId,
      actorRole: auth.membership.role,
      appId: body.app_id,
      provider,
      startDate,
      endDate,
    });

    return NextResponse.json(
      { provider, imported_count: rows.length },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cost sync failed." },
      { status: 400 }
    );
  }
}

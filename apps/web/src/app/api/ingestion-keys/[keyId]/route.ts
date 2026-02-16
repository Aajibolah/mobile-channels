import { NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth/api";
import { revokeIngestionApiKey } from "@/lib/ingestion-keys";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ keyId: string }> }
) {
  const auth = await getApiAuthContext("ADMIN");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyId } = await context.params;

  try {
    await revokeIngestionApiKey(
      auth.membership.workspaceId,
      keyId,
      auth.membership.role
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to revoke key." },
      { status: 400 }
    );
  }
}


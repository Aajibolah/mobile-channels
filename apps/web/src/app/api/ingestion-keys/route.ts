import { NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/auth/api";
import {
  createIngestionApiKey,
  INGESTION_SCOPES,
  listWorkspaceIngestionApiKeys,
  type IngestionScope,
} from "@/lib/ingestion-keys";

type CreateKeyPayload = {
  name: string;
  app_id?: string;
  scopes: IngestionScope[];
};

export async function GET() {
  const auth = await getApiAuthContext("ADMIN");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await listWorkspaceIngestionApiKeys(auth.membership.workspaceId);
  return NextResponse.json({ data: keys, allowed_scopes: INGESTION_SCOPES });
}

export async function POST(request: Request) {
  const auth = await getApiAuthContext("ADMIN");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<CreateKeyPayload>;
  if (!body.name || !body.scopes?.length) {
    return NextResponse.json(
      { error: "name and scopes are required." },
      { status: 400 }
    );
  }

  try {
    const key = await createIngestionApiKey({
      workspaceId: auth.membership.workspaceId,
      appId: body.app_id,
      actorUserId: auth.session.user.id,
      actorRole: auth.membership.role,
      name: body.name,
      scopes: body.scopes,
    });

    return NextResponse.json(
      {
        data: {
          ...key.record,
          key_plaintext: key.keyPlaintext,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create key." },
      { status: 400 }
    );
  }
}


import { createHash, randomBytes } from "node:crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasRequiredRole } from "@/lib/auth/rbac";

export const INGESTION_SCOPES = [
  "mobile:install:write",
  "mobile:event:write",
  "mobile:skan:write",
  "cost:write",
] as const;

export type IngestionScope = (typeof INGESTION_SCOPES)[number];

type CreateIngestionApiKeyInput = {
  workspaceId: string;
  appId?: string;
  actorUserId: string;
  actorRole: Role;
  name: string;
  scopes: IngestionScope[];
};

function hashApiKey(plainTextKey: string): string {
  return createHash("sha256").update(plainTextKey).digest("hex");
}

function generateApiKeyMaterial() {
  const prefix = randomBytes(4).toString("hex");
  const secret = randomBytes(24).toString("base64url");
  const key = `st_live_${prefix}_${secret}`;

  return {
    key,
    prefix: `st_live_${prefix}`,
    hash: hashApiKey(key),
  };
}

function extractApiKeyFromRequest(request: Request): string | null {
  const stHeader = request.headers.get("x-st-api-key");
  if (stHeader) return stHeader.trim();

  const generic = request.headers.get("x-api-key");
  if (generic) return generic.trim();

  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return null;
}

function assertValidScopes(scopes: string[]): asserts scopes is IngestionScope[] {
  for (const scope of scopes) {
    if (!(INGESTION_SCOPES as readonly string[]).includes(scope)) {
      throw new Error(`Unsupported scope: ${scope}`);
    }
  }
}

export async function createIngestionApiKey(input: CreateIngestionApiKeyInput) {
  if (!hasRequiredRole(input.actorRole, "ADMIN")) {
    throw new Error("Only ADMIN or OWNER can create ingestion keys.");
  }

  if (!input.scopes.length) {
    throw new Error("At least one scope is required.");
  }
  assertValidScopes(input.scopes);

  if (input.appId) {
    const app = await prisma.mobileApp.findFirst({
      where: {
        id: input.appId,
        workspaceId: input.workspaceId,
      },
      select: { id: true },
    });

    if (!app) {
      throw new Error("App not found in active workspace.");
    }
  }

  const material = generateApiKeyMaterial();
  const record = await prisma.ingestionApiKey.create({
    data: {
      workspaceId: input.workspaceId,
      appId: input.appId ?? null,
      createdByUserId: input.actorUserId,
      name: input.name.trim(),
      keyPrefix: material.prefix,
      keyHash: material.hash,
      scopes: input.scopes,
    },
    select: {
      id: true,
      name: true,
      appId: true,
      keyPrefix: true,
      scopes: true,
      createdAt: true,
      isActive: true,
    },
  });

  return {
    keyPlaintext: material.key,
    record,
  };
}

export async function listWorkspaceIngestionApiKeys(workspaceId: string) {
  return prisma.ingestionApiKey.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      appId: true,
      keyPrefix: true,
      scopes: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
      app: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function revokeIngestionApiKey(
  workspaceId: string,
  keyId: string,
  actorRole: Role
) {
  if (!hasRequiredRole(actorRole, "ADMIN")) {
    throw new Error("Only ADMIN or OWNER can revoke ingestion keys.");
  }

  const key = await prisma.ingestionApiKey.findFirst({
    where: {
      id: keyId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });
  if (!key) {
    throw new Error("Ingestion key not found.");
  }

  await prisma.ingestionApiKey.update({
    where: { id: key.id },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });
}

export type IngestionRequestAuth = {
  keyId: string;
  workspaceId: string;
  appId: string | null;
  scopes: string[];
};

export async function authenticateIngestionRequest(
  request: Request,
  requiredScope: IngestionScope,
  targetAppId?: string
): Promise<IngestionRequestAuth | null> {
  const plainApiKey = extractApiKeyFromRequest(request);
  if (!plainApiKey) return null;

  const keyHash = hashApiKey(plainApiKey);
  const key = await prisma.ingestionApiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      workspaceId: true,
      appId: true,
      isActive: true,
      revokedAt: true,
      scopes: true,
    },
  });

  if (!key || !key.isActive || key.revokedAt) {
    return null;
  }

  if (!key.scopes.includes(requiredScope)) {
    return null;
  }

  if (targetAppId && key.appId && key.appId !== targetAppId) {
    return null;
  }

  await prisma.ingestionApiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    keyId: key.id,
    workspaceId: key.workspaceId,
    appId: key.appId,
    scopes: key.scopes,
  };
}


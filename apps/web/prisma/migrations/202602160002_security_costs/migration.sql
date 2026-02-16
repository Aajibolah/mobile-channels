-- CreateTable
CREATE TABLE "public"."IngestionApiKey" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT,
    "createdByUserId" TEXT,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdCostEntry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT,
    "source" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "campaign" TEXT,
    "adset" TEXT,
    "creative" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "installs" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SkanPostback" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "campaignId" TEXT,
    "conversionValue" INTEGER,
    "sourceAppId" TEXT,
    "fidelityType" TEXT,
    "isRedownload" BOOLEAN,
    "postbackAt" TIMESTAMP(3),
    "attributedSource" TEXT,
    "attributedChannel" TEXT,
    "attributedCampaign" TEXT,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkanPostback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestionApiKey_keyHash_key" ON "public"."IngestionApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "IngestionApiKey_workspaceId_isActive_idx" ON "public"."IngestionApiKey"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "IngestionApiKey_appId_isActive_idx" ON "public"."IngestionApiKey"("appId", "isActive");

-- CreateIndex
CREATE INDEX "IngestionApiKey_createdAt_idx" ON "public"."IngestionApiKey"("createdAt");

-- CreateIndex
CREATE INDEX "AdCostEntry_workspaceId_date_idx" ON "public"."AdCostEntry"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "AdCostEntry_workspaceId_source_channel_date_idx" ON "public"."AdCostEntry"("workspaceId", "source", "channel", "date");

-- CreateIndex
CREATE INDEX "AdCostEntry_appId_date_idx" ON "public"."AdCostEntry"("appId", "date");

-- CreateIndex
CREATE INDEX "SkanPostback_workspaceId_appId_createdAt_idx" ON "public"."SkanPostback"("workspaceId", "appId", "createdAt");

-- CreateIndex
CREATE INDEX "SkanPostback_campaignId_postbackAt_idx" ON "public"."SkanPostback"("campaignId", "postbackAt");

-- AddForeignKey
ALTER TABLE "public"."IngestionApiKey" ADD CONSTRAINT "IngestionApiKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IngestionApiKey" ADD CONSTRAINT "IngestionApiKey_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."MobileApp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IngestionApiKey" ADD CONSTRAINT "IngestionApiKey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdCostEntry" ADD CONSTRAINT "AdCostEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdCostEntry" ADD CONSTRAINT "AdCostEntry_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."MobileApp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkanPostback" ADD CONSTRAINT "SkanPostback_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkanPostback" ADD CONSTRAINT "SkanPostback_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."MobileApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;


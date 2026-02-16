-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('OWNER', 'ADMIN', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "public"."EventName" AS ENUM ('INSTALL', 'SIGNUP', 'TRIAL_START', 'PURCHASE', 'SUBSCRIPTION_START', 'SUBSCRIPTION_RENEWAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AttributionStatus" AS ENUM ('ATTRIBUTED', 'ORGANIC');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MobileApp" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iosBundleId" TEXT,
    "androidPackageName" TEXT,
    "appStoreId" TEXT,
    "playStoreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrackingLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "adset" TEXT,
    "creative" TEXT,
    "influencerId" TEXT,
    "destinationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Click" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "clickId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "platformHint" "public"."Platform",
    "locale" TEXT,
    "query" JSONB,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Install" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "linkId" TEXT,
    "clickInternalId" TEXT,
    "platform" "public"."Platform" NOT NULL,
    "deviceId" TEXT,
    "externalUserId" TEXT,
    "installReferrer" TEXT,
    "skanCampaignId" TEXT,
    "attributionStatus" "public"."AttributionStatus" NOT NULL DEFAULT 'ORGANIC',
    "attributedSource" TEXT,
    "attributedChannel" TEXT,
    "attributedCampaign" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Install_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "installId" TEXT,
    "eventName" "public"."EventName" NOT NULL,
    "eventNameRaw" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "deviceId" TEXT,
    "externalUserId" TEXT,
    "eventValue" DOUBLE PRECISION,
    "currency" TEXT,
    "metadata" JSONB,
    "attributionStatus" "public"."AttributionStatus" NOT NULL DEFAULT 'ORGANIC',
    "attributionSource" TEXT,
    "attributionChannel" TEXT,
    "attributionCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "public"."Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "public"."Workspace"("slug");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_role_idx" ON "public"."WorkspaceMember"("workspaceId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "public"."WorkspaceMember"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "MobileApp_workspaceId_idx" ON "public"."MobileApp"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingLink_slug_key" ON "public"."TrackingLink"("slug");

-- CreateIndex
CREATE INDEX "TrackingLink_workspaceId_appId_createdAt_idx" ON "public"."TrackingLink"("workspaceId", "appId", "createdAt");

-- CreateIndex
CREATE INDEX "TrackingLink_source_channel_campaign_idx" ON "public"."TrackingLink"("source", "channel", "campaign");

-- CreateIndex
CREATE UNIQUE INDEX "Click_clickId_key" ON "public"."Click"("clickId");

-- CreateIndex
CREATE INDEX "Click_linkId_clickedAt_idx" ON "public"."Click"("linkId", "clickedAt");

-- CreateIndex
CREATE INDEX "Install_workspaceId_installedAt_idx" ON "public"."Install"("workspaceId", "installedAt");

-- CreateIndex
CREATE INDEX "Install_appId_deviceId_installedAt_idx" ON "public"."Install"("appId", "deviceId", "installedAt");

-- CreateIndex
CREATE INDEX "Event_workspaceId_occurredAt_idx" ON "public"."Event"("workspaceId", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_appId_eventName_occurredAt_idx" ON "public"."Event"("appId", "eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_attributionSource_attributionChannel_idx" ON "public"."Event"("attributionSource", "attributionChannel");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MobileApp" ADD CONSTRAINT "MobileApp_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrackingLink" ADD CONSTRAINT "TrackingLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrackingLink" ADD CONSTRAINT "TrackingLink_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."MobileApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrackingLink" ADD CONSTRAINT "TrackingLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Click" ADD CONSTRAINT "Click_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."TrackingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Install" ADD CONSTRAINT "Install_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Install" ADD CONSTRAINT "Install_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."MobileApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Install" ADD CONSTRAINT "Install_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."TrackingLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Install" ADD CONSTRAINT "Install_clickInternalId_fkey" FOREIGN KEY ("clickInternalId") REFERENCES "public"."Click"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."MobileApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_installId_fkey" FOREIGN KEY ("installId") REFERENCES "public"."Install"("id") ON DELETE SET NULL ON UPDATE CASCADE;


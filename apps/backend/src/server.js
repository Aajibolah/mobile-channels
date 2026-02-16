import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

const app = express();
app.use(express.json({ limit: "2mb" }));

const frontendOrigin = process.env.FRONTEND_ORIGIN || "";
const fallbackUrl = process.env.BACKEND_FALLBACK_URL || "https://sourcetrace.app";

app.use((req, res, next) => {
  if (frontendOrigin) {
    res.setHeader("Access-Control-Allow-Origin", frontendOrigin);
  }
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-st-api-key, x-api-key"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

function hashApiKey(plainApiKey) {
  return createHash("sha256").update(plainApiKey).digest("hex");
}

function extractApiKey(req) {
  const stHeader = req.header("x-st-api-key");
  if (stHeader) return stHeader.trim();

  const generic = req.header("x-api-key");
  if (generic) return generic.trim();

  const auth = req.header("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return null;
}

async function authenticateIngestionKey(req, requiredScope, targetAppId) {
  const plainApiKey = extractApiKey(req);
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

  if (!key || !key.isActive || key.revokedAt) return null;
  if (!key.scopes.includes(requiredScope)) return null;
  if (targetAppId && key.appId && key.appId !== targetAppId) return null;

  await prisma.ingestionApiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return key;
}

function parseInstallReferrer(referrer) {
  if (!referrer) return {};
  const params = new URLSearchParams(referrer);
  return {
    clickId: params.get("st_click_id") || undefined,
    linkSlug: params.get("st_link_slug") || undefined,
  };
}

function parseAppStoreCampaignToken(token) {
  if (!token) return {};
  const [linkSlug, clickId] = token.split(".");
  return {
    linkSlug: linkSlug || undefined,
    clickId: clickId || undefined,
  };
}

function detectPlatformFromUserAgent(userAgent) {
  if (!userAgent) return null;
  const lower = userAgent.toLowerCase();
  if (lower.includes("android")) return "ANDROID";
  if (
    lower.includes("iphone") ||
    lower.includes("ipad") ||
    lower.includes("ios")
  ) {
    return "IOS";
  }
  return null;
}

function parseDate(dateInput) {
  if (!dateInput) return new Date();
  const candidate = dateInput.includes("T")
    ? dateInput
    : `${dateInput}T00:00:00.000Z`;
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function extractRequestIp(req) {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || null;
}

function serializableQuery(query) {
  const out = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") out[key] = value;
    if (Array.isArray(value) && typeof value[0] === "string") out[key] = value[0];
  }
  return out;
}

function eventNameToEnum(rawEventName) {
  const map = {
    install: "INSTALL",
    signup: "SIGNUP",
    trial_start: "TRIAL_START",
    purchase: "PURCHASE",
    subscription_start: "SUBSCRIPTION_START",
    subscription_renewal: "SUBSCRIPTION_RENEWAL",
  };
  return map[rawEventName] || "CUSTOM";
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sourcetrace-backend" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "sourcetrace-backend" });
});

app.get("/r/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const link = await prisma.trackingLink.findUnique({
      where: { slug },
      include: { app: true },
    });

    if (!link) {
      res.redirect(302, fallbackUrl);
      return;
    }

    const requestedPlatform = String(req.query.platform || "").toLowerCase();
    const uaPlatform = detectPlatformFromUserAgent(req.header("user-agent"));
    const platform =
      requestedPlatform === "ios"
        ? "IOS"
        : requestedPlatform === "android"
        ? "ANDROID"
        : uaPlatform ||
          (link.app.androidPackageName || link.app.playStoreId ? "ANDROID" : "IOS");

    const clickId = `clk_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await prisma.click.create({
      data: {
        linkId: link.id,
        clickId,
        ipAddress: extractRequestIp(req),
        userAgent: req.header("user-agent") || null,
        referrer: req.header("referer") || null,
        platformHint: uaPlatform,
        locale: req.header("accept-language") || null,
        query: serializableQuery(req.query),
      },
    });

    let destination = fallbackUrl;
    if (platform === "ANDROID") {
      const packageId = link.app.playStoreId || link.app.androidPackageName;
      if (packageId) {
        const referrer = new URLSearchParams({
          st_click_id: clickId,
          st_link_slug: link.slug,
          source: link.source,
          channel: link.channel,
          campaign: link.campaign,
        });
        destination =
          "https://play.google.com/store/apps/details?id=" +
          encodeURIComponent(packageId) +
          "&referrer=" +
          encodeURIComponent(referrer.toString());
      } else if (link.destinationUrl) {
        destination = link.destinationUrl;
      }
    } else if (platform === "IOS") {
      if (link.app.appStoreId) {
        destination =
          `https://apps.apple.com/app/id${link.app.appStoreId}?ct=` +
          encodeURIComponent(`${link.slug}.${clickId}`);
      } else if (link.destinationUrl) {
        destination = link.destinationUrl;
      }
    } else if (link.destinationUrl) {
      destination = link.destinationUrl;
    }

    res.redirect(302, destination);
  } catch (error) {
    next(error);
  }
});

app.post("/api/mobile/install", async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload.app_id || !payload.platform) {
      res.status(400).json({ error: "app_id and platform are required." });
      return;
    }
    if (payload.platform !== "ios" && payload.platform !== "android") {
      res.status(400).json({ error: "platform must be ios or android." });
      return;
    }

    const key = await authenticateIngestionKey(
      req,
      "mobile:install:write",
      payload.app_id
    );
    if (!key) {
      res.status(401).json({ error: "Unauthorized ingestion key." });
      return;
    }

    const appRecord = await prisma.mobileApp.findUnique({
      where: { id: payload.app_id },
      select: { id: true, workspaceId: true },
    });
    if (!appRecord) {
      res.status(404).json({ error: "Unknown app_id." });
      return;
    }
    if (appRecord.workspaceId !== key.workspaceId) {
      res
        .status(403)
        .json({ error: "App does not belong to ingestion key workspace." });
      return;
    }

    const referrerValues = parseInstallReferrer(payload.install_referrer);
    const tokenValues = parseAppStoreCampaignToken(payload.app_store_campaign_token);

    const clickId = payload.click_id || referrerValues.clickId || tokenValues.clickId;
    const linkSlug =
      payload.link_slug || referrerValues.linkSlug || tokenValues.linkSlug;

    let matchedClick = null;
    let matchedLink = null;

    if (clickId) {
      const click = await prisma.click.findUnique({
        where: { clickId },
        include: {
          link: {
            select: {
              id: true,
              appId: true,
              source: true,
              channel: true,
              campaign: true,
            },
          },
        },
      });
      if (click && click.link.appId === appRecord.id) {
        matchedClick = click;
        matchedLink = click.link;
      }
    }

    if (!matchedLink && linkSlug) {
      matchedLink = await prisma.trackingLink.findFirst({
        where: { slug: linkSlug, appId: appRecord.id },
        select: {
          id: true,
          appId: true,
          source: true,
          channel: true,
          campaign: true,
        },
      });
    }

    const installedAt = parseDate(payload.installed_at) || new Date();
    const attributionStatus = matchedLink ? "ATTRIBUTED" : "ORGANIC";

    const install = await prisma.install.create({
      data: {
        workspaceId: appRecord.workspaceId,
        appId: appRecord.id,
        linkId: matchedLink?.id || null,
        clickInternalId: matchedClick?.id || null,
        platform: payload.platform === "ios" ? "IOS" : "ANDROID",
        deviceId: payload.device_id || null,
        externalUserId: payload.external_user_id || null,
        installReferrer: payload.install_referrer || null,
        skanCampaignId: payload.skan_campaign_id || null,
        installedAt,
        attributionStatus,
        attributedSource: matchedLink?.source || null,
        attributedChannel: matchedLink?.channel || null,
        attributedCampaign: matchedLink?.campaign || null,
      },
    });

    await prisma.event.create({
      data: {
        workspaceId: appRecord.workspaceId,
        appId: appRecord.id,
        installId: install.id,
        eventName: "INSTALL",
        occurredAt: installedAt,
        platform: payload.platform === "ios" ? "IOS" : "ANDROID",
        deviceId: payload.device_id || null,
        externalUserId: payload.external_user_id || null,
        attributionStatus,
        attributionSource: matchedLink?.source || null,
        attributionChannel: matchedLink?.channel || null,
        attributionCampaign: matchedLink?.campaign || null,
        metadata: {
          referrer_click_id: clickId || null,
          referrer_link_slug: linkSlug || null,
          app_store_campaign_token: payload.app_store_campaign_token || null,
        },
      },
    });

    res.status(201).json({
      data: {
        install_id: install.id,
        attribution: {
          status: attributionStatus,
          source: matchedLink?.source || "organic",
          channel: matchedLink?.channel || "organic",
          campaign: matchedLink?.campaign || "organic",
          matched_click_id: matchedClick?.clickId || null,
          matched_link_id: matchedLink?.id || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/events", async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (
      !payload.event_name ||
      !payload.event_timestamp ||
      !payload.app_id ||
      !payload.platform
    ) {
      res.status(400).json({
        error:
          "event_name, event_timestamp, app_id, and platform are required.",
      });
      return;
    }
    if (payload.platform !== "ios" && payload.platform !== "android") {
      res.status(400).json({ error: "platform must be ios or android." });
      return;
    }

    const key = await authenticateIngestionKey(
      req,
      "mobile:event:write",
      payload.app_id
    );
    if (!key) {
      res.status(401).json({ error: "Unauthorized ingestion key." });
      return;
    }

    const appRecord = await prisma.mobileApp.findUnique({
      where: { id: payload.app_id },
      select: { id: true, workspaceId: true },
    });
    if (!appRecord) {
      res.status(404).json({ error: "Unknown app_id." });
      return;
    }
    if (appRecord.workspaceId !== key.workspaceId) {
      res
        .status(403)
        .json({ error: "App does not belong to ingestion key workspace." });
      return;
    }

    let install = null;
    if (payload.install_id) {
      install = await prisma.install.findFirst({
        where: {
          id: payload.install_id,
          workspaceId: appRecord.workspaceId,
          appId: appRecord.id,
        },
        select: {
          id: true,
          attributionStatus: true,
          attributedSource: true,
          attributedChannel: true,
          attributedCampaign: true,
        },
      });
    } else if (payload.device_id) {
      install = await prisma.install.findFirst({
        where: {
          workspaceId: appRecord.workspaceId,
          appId: appRecord.id,
          deviceId: payload.device_id,
        },
        orderBy: { installedAt: "desc" },
        select: {
          id: true,
          attributionStatus: true,
          attributedSource: true,
          attributedChannel: true,
          attributedCampaign: true,
        },
      });
    }

    const occurredAt = parseDate(payload.event_timestamp) || new Date();
    const eventName = eventNameToEnum(String(payload.event_name));
    const event = await prisma.event.create({
      data: {
        workspaceId: appRecord.workspaceId,
        appId: appRecord.id,
        installId: install?.id || null,
        eventName,
        eventNameRaw: eventName === "CUSTOM" ? String(payload.event_name) : null,
        occurredAt,
        platform: payload.platform === "ios" ? "IOS" : "ANDROID",
        deviceId: payload.device_id || null,
        externalUserId: payload.user_id || null,
        eventValue:
          typeof payload.event_value === "number" ? payload.event_value : null,
        currency: payload.currency || null,
        metadata: payload.metadata || null,
        attributionStatus: install?.attributionStatus || "ORGANIC",
        attributionSource: install?.attributedSource || null,
        attributionChannel: install?.attributedChannel || null,
        attributionCampaign: install?.attributedCampaign || null,
      },
      select: {
        id: true,
        eventName: true,
        installId: true,
        attributionStatus: true,
        attributionSource: true,
        attributionChannel: true,
        attributionCampaign: true,
      },
    });

    if (payload.user_id && install?.id) {
      await prisma.install.update({
        where: { id: install.id },
        data: { externalUserId: payload.user_id },
      });
    }

    res.status(202).json({
      accepted: true,
      data: {
        event_id: event.id,
        event_name: event.eventName,
        install_id: event.installId,
        attribution: {
          status: event.attributionStatus,
          source: event.attributionSource || "organic",
          channel: event.attributionChannel || "organic",
          campaign: event.attributionCampaign || "organic",
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/mobile/skan", async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!payload.app_id || !payload.raw_payload) {
      res.status(400).json({ error: "app_id and raw_payload are required." });
      return;
    }

    const key = await authenticateIngestionKey(
      req,
      "mobile:skan:write",
      payload.app_id
    );
    if (!key) {
      res.status(401).json({ error: "Unauthorized ingestion key." });
      return;
    }

    const appRecord = await prisma.mobileApp.findUnique({
      where: { id: payload.app_id },
      select: { id: true, workspaceId: true },
    });
    if (!appRecord) {
      res.status(404).json({ error: "Unknown app_id." });
      return;
    }
    if (appRecord.workspaceId !== key.workspaceId) {
      res
        .status(403)
        .json({ error: "App does not belong to ingestion key workspace." });
      return;
    }

    const postback = await prisma.skanPostback.create({
      data: {
        workspaceId: appRecord.workspaceId,
        appId: appRecord.id,
        campaignId: payload.campaign_id || null,
        conversionValue:
          typeof payload.conversion_value === "number"
            ? Math.round(payload.conversion_value)
            : null,
        sourceAppId: payload.source_app_id || null,
        fidelityType: payload.fidelity_type || null,
        isRedownload:
          typeof payload.is_redownload === "boolean"
            ? payload.is_redownload
            : null,
        postbackAt: parseDate(payload.postback_at),
        rawPayload: payload.raw_payload,
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

    res.status(201).json({ data: postback });
  } catch (error) {
    next(error);
  }
});

app.post("/api/costs", async (req, res, next) => {
  try {
    const payload = req.body;
    const rows = Array.isArray(payload) ? payload : [payload];
    if (!rows.length) {
      res.status(400).json({ error: "At least one row is required." });
      return;
    }

    const appIdHint = rows.find((row) => row?.app_id)?.app_id;
    const key = await authenticateIngestionKey(req, "cost:write", appIdHint);
    if (!key) {
      res.status(401).json({ error: "Unauthorized ingestion key." });
      return;
    }

    let count = 0;
    for (const row of rows) {
      if (
        !row ||
        !row.source ||
        !row.channel ||
        !row.date ||
        typeof row.cost_usd !== "number"
      ) {
        res.status(400).json({
          error:
            "Each row requires source, channel, date, and numeric cost_usd.",
        });
        return;
      }

      let appId = row.app_id || null;
      if (appId) {
        const appRecord = await prisma.mobileApp.findUnique({
          where: { id: appId },
          select: { id: true, workspaceId: true },
        });
        if (!appRecord || appRecord.workspaceId !== key.workspaceId) {
          res.status(403).json({ error: "Invalid app_id for ingestion key." });
          return;
        }
      }

      const parsedDate = parseDate(String(row.date));
      if (!parsedDate) {
        res.status(400).json({ error: `Invalid date value: ${row.date}` });
        return;
      }

      if (key.appId) {
        appId = key.appId;
      }

      await prisma.adCostEntry.create({
        data: {
          workspaceId: key.workspaceId,
          appId,
          source: String(row.source).toLowerCase().trim(),
          channel: String(row.channel).toLowerCase().trim(),
          campaign: row.campaign ? String(row.campaign).trim() : null,
          adset: row.adset ? String(row.adset).trim() : null,
          creative: row.creative ? String(row.creative).trim() : null,
          date: parsedDate,
          costUsd: Number(row.cost_usd),
          clicks:
            typeof row.clicks === "number" ? Math.round(row.clicks) : null,
          impressions:
            typeof row.impressions === "number"
              ? Math.round(row.impressions)
              : null,
          installs:
            typeof row.installs === "number" ? Math.round(row.installs) : null,
          metadata: row.metadata || null,
        },
      });
      count += 1;
    }

    res.status(201).json({ imported_count: count });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({
    error: "Internal server error",
    detail: process.env.NODE_ENV === "development" ? String(error) : undefined,
  });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SourceTrace backend listening on port ${port}`);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});


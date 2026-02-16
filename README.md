# SourceTrace
Open Source Channel Attribution

SourceTrace is a cost-first mobile attribution product for startup and growth
teams. This repository currently contains:

- Product requirements: `docs/PRD-SourceTrace-v1.md`
- Attribution flow spec: `docs/Attribution-Flow-v1.md`
- Mobile integration guide: `docs/Mobile-SDK-Integration-v1.md`
- Deployment guide: `docs/Deployment-Guide.md`
- Frontend app (Vercel): `apps/web`
- Backend service (Render): `apps/backend`

## Quick Start

```bash
npm install
copy apps/web/.env.example apps/web/.env
copy apps/backend/.env.example apps/backend/.env
docker compose up -d postgres
npm run prisma:migrate -w web
npm run prisma:migrate -w backend
npm run dev
```

Open `http://localhost:3000`.

## Current Implementation (v0.3)

- Public landing page at `/`
- Auth and onboarding: `/signup`, `/login`, `/onboarding`
- Product shell (auth protected): `/app`, `/app/dashboard`, `/app/links`, `/app/settings`
- DB-backed models (Prisma/Postgres): users, sessions, workspaces, apps, links, clicks, installs, events, ingestion API keys, ad costs, SKAN postbacks
- Frontend APIs (session-auth):
  - `POST /api/attribution`
  - `GET|POST /api/links`
  - `GET|POST /api/ingestion-keys`
  - `GET|POST /api/costs`
  - `POST /api/costs/sync`
- Backend APIs (ingestion-key auth):
  - `GET /r/:slug` click capture + store redirect
  - `POST /api/mobile/install`
  - `POST /api/mobile/skan`
  - `POST /api/events`
  - `POST /api/costs`
- Dashboard now computes spend-aware KPIs (Spend, CAC, ROAS) with cost ingestion.

## Prisma Commands

```bash
npm run prisma:generate -w web
npm run prisma:migrate -w web
npm run prisma:studio -w web
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
```

## Provider Cost Sync Env

Set these in `apps/web/.env` to enable provider sync:

```bash
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=...
TIKTOK_ACCESS_TOKEN=...
TIKTOK_ADVERTISER_ID=...
```

## Deployment Topology

1. Host code on GitHub.
2. Deploy Postgres + backend (`apps/backend`) on Render.
3. Deploy frontend (`apps/web`) on Vercel free tier.
4. Point frontend `NEXT_PUBLIC_TRACKING_BASE_URL` to Render backend URL.

## GitHub Auto-Deploy

This repo includes:
1. `.github/workflows/ci.yml`
2. `.github/workflows/deploy-hooks.yml`

Set these GitHub Actions secrets to enable deploy triggers:
1. `VERCEL_DEPLOY_HOOK_URL`
2. `RENDER_DEPLOY_HOOK_URL`

## Next Build Priorities

1. Add ingestion API key rotation + expiry policies.
2. Add Play referrer signature verification and anti-spoof validation.
3. Add iOS campaign/SKAN reconciliation jobs and report-level fallbacks.
4. Add alerting for install/sign-up/cost discrepancies by channel.

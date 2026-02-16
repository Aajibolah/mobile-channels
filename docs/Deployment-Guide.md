# SourceTrace Deployment Guide

Date: 2026-02-16  
Target topology:
1. GitHub for source hosting
2. Render for backend + Postgres
3. Vercel (free tier) for frontend

---

## 1. Push Repository to GitHub

Run from repo root:

```bash
git init
git add .
git commit -m "Initial SourceTrace platform"
git branch -M main
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

If repo already exists, just commit and push to `main`.

---

## 2. Deploy Backend + Database on Render

You have two options:
1. Blueprint deploy using `render.yaml` (recommended).
2. Manual web service + Postgres setup.

### 2.1 Blueprint Deploy (Recommended)

1. In Render, click `New` -> `Blueprint`.
2. Connect GitHub repo and select this repository.
3. Render reads `render.yaml` and creates:
   - Web service `sourcetrace-backend`
   - Postgres database `sourcetrace-postgres`
4. Set `FRONTEND_ORIGIN` env var after Vercel URL is known.

### 2.2 Manual Setup (If not using Blueprint)

1. Create Render Postgres instance (free plan if available).
2. Create new `Web Service`:
   - Root Directory: `apps/backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Add env vars:
   - `DATABASE_URL`: Render Postgres connection string
   - `BACKEND_FALLBACK_URL`: `https://sourcetrace.app` (or your marketing URL)
   - `FRONTEND_ORIGIN`: your Vercel frontend URL

### 2.3 Backend Verification

After deploy, check:

```bash
curl https://<your-render-backend>.onrender.com/health
```

Expected:

```json
{"ok":true,"service":"sourcetrace-backend"}
```

---

## 3. Deploy Frontend on Vercel (Free)

### 3.1 Import Project

1. In Vercel, click `Add New` -> `Project`.
2. Import your GitHub repository.
3. Configure:
   - Framework: Next.js
   - Root Directory: `apps/web`

### 3.2 Frontend Environment Variables

Set these in Vercel project settings:

1. `DATABASE_URL`  
Value: Render Postgres **external** connection string (usually includes SSL).

2. `NEXT_PUBLIC_TRACKING_BASE_URL`  
Value: `https://<your-render-backend>.onrender.com`

3. `NEXT_PUBLIC_APP_FALLBACK_URL`  
Value: your landing URL, e.g. `https://<your-vercel-app>.vercel.app`

Optional for ad cost sync:
1. `META_ACCESS_TOKEN`
2. `META_AD_ACCOUNT_ID`
3. `TIKTOK_ACCESS_TOKEN`
4. `TIKTOK_ADVERTISER_ID`

### 3.3 Redeploy

Trigger redeploy after env vars are saved.

---

## 4. Post-Deploy Wiring

### 4.1 Update Render CORS Origin

Set backend env var:
- `FRONTEND_ORIGIN=https://<your-vercel-app>.vercel.app`

Redeploy backend.

### 4.2 Generate Ingestion API Key

1. Open frontend app: `/signup` -> `/onboarding`.
2. Go to `/app/settings`.
3. Create ingestion key with scopes:
   - `mobile:install:write`
   - `mobile:event:write`
   - `mobile:skan:write` (iOS)
4. Save key securely; it is shown once.

### 4.3 Use Render Domain for Campaign Links

Ensure generated tracking links use backend redirect domain:
- `NEXT_PUBLIC_TRACKING_BASE_URL=https://<your-render-backend>.onrender.com`

---

## 5. End-to-End Smoke Test

### 5.1 Redirect + Click

Open in browser:

```text
https://<your-render-backend>.onrender.com/r/<link-slug>
```

Should redirect to Play Store/App Store or fallback URL.

### 5.2 Install Ingestion

```bash
curl -X POST https://<your-render-backend>.onrender.com/api/mobile/install \
  -H "Content-Type: application/json" \
  -H "x-st-api-key: <INGESTION_KEY>" \
  -d '{
    "app_id":"<APP_ID>",
    "platform":"android",
    "device_id":"dev-123",
    "install_referrer":"st_click_id=clk_demo&st_link_slug=<LINK_SLUG>"
  }'
```

### 5.3 Signup Event

```bash
curl -X POST https://<your-render-backend>.onrender.com/api/events \
  -H "Content-Type: application/json" \
  -H "x-st-api-key: <INGESTION_KEY>" \
  -d '{
    "event_name":"signup",
    "event_timestamp":"2026-02-16T20:30:00.000Z",
    "app_id":"<APP_ID>",
    "platform":"android",
    "device_id":"dev-123",
    "user_id":"user-001"
  }'
```

Then open frontend dashboard on Vercel and confirm metrics update.

---

## 6. Ongoing Ops Notes

1. Render free services may cold start.
2. Keep backend and frontend on same `DATABASE_URL`.
3. Rotate ingestion keys periodically from `/app/settings`.
4. Set custom domains later for stable tracking URLs.
5. Keep `apps/web/prisma` and `apps/backend/prisma` in sync when schema changes.

---

## 7. GitHub Auto-Deploy Hooks

This repo includes:
- ` .github/workflows/ci.yml` for validation
- ` .github/workflows/deploy-hooks.yml` to trigger Vercel + Render after CI passes on `main`

### 7.1 Required GitHub Secrets

In GitHub repo settings -> `Secrets and variables` -> `Actions`, add:
1. `VERCEL_DEPLOY_HOOK_URL`
2. `RENDER_DEPLOY_HOOK_URL`

If a secret is missing, that deploy target is skipped safely.

### 7.2 Create Vercel Deploy Hook URL

1. Open Vercel project settings.
2. Go to `Git` -> `Deploy Hooks`.
3. Create a hook for branch `main`.
4. Copy the hook URL into GitHub secret `VERCEL_DEPLOY_HOOK_URL`.

### 7.3 Create Render Deploy Hook URL

1. Open Render service `sourcetrace-backend`.
2. Go to settings -> `Deploy Hook`.
3. Copy the hook URL into GitHub secret `RENDER_DEPLOY_HOOK_URL`.

### 7.4 Flow Summary

1. Push to `main`.
2. CI workflow runs (`lint`, `build`, checks).
3. If CI succeeds, deploy-hooks workflow calls Vercel and Render hooks.

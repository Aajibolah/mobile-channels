# SourceTrace Attribution Flow (Install -> Signup)

Date: 2026-02-16  
Status: Implemented MVP Flow

Production base URL:
- `https://<your-render-backend>.onrender.com`

## 1. Click Tracking
1. Campaign links are generated in the web app and resolve to `/r/{slug}`.
2. `GET /r/{slug}` logs a click record with:
- `click_id`
- `link_id`
- user agent, IP, referrer
- platform hint
3. Redirect behavior:
- Android: sends users to Play Store URL with `referrer` payload:
  - `st_click_id`
  - `st_link_slug`
  - source/channel/campaign metadata
- iOS: sends users to App Store URL with campaign token in `ct`.

All mobile ingestion calls require `x-st-api-key`.

## 2. Install Ingestion
Mobile app should call:
- `POST /api/mobile/install`

Payload:
```json
{
  "app_id": "app_123",
  "platform": "android",
  "device_id": "device_abc",
  "install_referrer": "st_click_id=clk_abc&st_link_slug=tiktok-launch-12ab34",
  "installed_at": "2026-02-16T15:00:00.000Z"
}
```

Headers:
```text
x-st-api-key: st_live_...
```

Attribution matching priority:
1. `click_id` (direct payload or parsed from install referrer)
2. `link_slug`
3. fallback to organic

Output includes:
- `install_id`
- attribution status (`ATTRIBUTED` or `ORGANIC`)
- source/channel/campaign

## 3. Signup/Event Ingestion
Mobile app or backend should call:
- `POST /api/events`

Payload:
```json
{
  "event_name": "signup",
  "event_timestamp": "2026-02-16T16:00:00.000Z",
  "app_id": "app_123",
  "platform": "android",
  "install_id": "inst_123",
  "user_id": "user_789"
}
```

If `install_id` is absent, SourceTrace attempts fallback matching by:
- `app_id + device_id` (latest install)

Event records inherit attribution fields from matched install, enabling signup
and revenue reporting by source/channel/campaign.

## 4. Attribution Inspection
Internal web app users can check attribution details with:
- `POST /api/attribution`

Payload:
```json
{
  "install_id": "inst_123"
}
```

## 5. Current Gaps (Next Iteration)
1. Play Install Referrer verification and anti-spoof checks.
2. iOS campaign and SKAN reconciliation logic.
3. Re-attribution and re-engagement windows.
4. Cost-source reconciliation and deduping rules.
5. Automated anomaly alerts and discrepancy diagnostics.

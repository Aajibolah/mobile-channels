# SourceTrace Mobile SDK Integration Guide (v1)

Date: 2026-02-16  
Status: Active

## 1. Integration Goal
Track channel attribution from:
1. Click -> install (`/r/{slug}` + store redirect metadata)
2. Install -> signup (`/api/mobile/install` then `/api/events`)
3. Signup/revenue -> source reporting (dashboard attribution fields)

All ingestion calls require `x-st-api-key`.

Base URL in production should be your Render backend domain:
- `https://<your-render-backend>.onrender.com`

## 2. Required API Key Scopes
Create an ingestion key in app settings with:
1. `mobile:install:write`
2. `mobile:event:write`
3. `mobile:skan:write` (iOS SKAN only)

Optional:
1. `cost:write` for spend ingestion automation

## 3. Android Flow (Play Store)
### 3.1 Click Redirect
1. Campaign uses SourceTrace link: `https://your-domain/r/{slug}`.
2. SourceTrace logs click and redirects to Play Store with `referrer` that includes:
- `st_click_id`
- `st_link_slug`
- source/channel/campaign

### 3.2 First App Open
On first open:
1. Read Play Install Referrer.
2. Send install payload to SourceTrace.

Endpoint:
- `POST https://<your-render-backend>.onrender.com/api/mobile/install`

Headers:
- `x-st-api-key: st_live_...`

Example payload:
```json
{
  "app_id": "app_123",
  "platform": "android",
  "device_id": "android_device_id_or_install_id",
  "install_referrer": "st_click_id=clk_abc&st_link_slug=tiktok-q1-123abc",
  "installed_at": "2026-02-16T20:12:00.000Z"
}
```

### 3.3 Signup Event
After user registers:
- `POST /api/events`
- `POST https://<your-render-backend>.onrender.com/api/events`

```json
{
  "event_name": "signup",
  "event_timestamp": "2026-02-16T20:15:00.000Z",
  "app_id": "app_123",
  "platform": "android",
  "device_id": "android_device_id_or_install_id",
  "user_id": "internal_user_789"
}
```

## 4. iOS Flow (App Store + SKAN)
### 4.1 Click Redirect
SourceTrace appends App Store campaign token:
- `ct={linkSlug}.{clickId}`

### 4.2 First App Open Install Call
On first launch, send install with any available identifiers:
```json
{
  "app_id": "app_ios_123",
  "platform": "ios",
  "device_id": "idfv_or_internal_install_id",
  "app_store_campaign_token": "meta-q1-ios-abc123.clk_123456",
  "installed_at": "2026-02-16T21:00:00.000Z"
}
```

### 4.3 SKAdNetwork Postback
Forward SKAN payloads:
- `POST /api/mobile/skan`
- `POST https://<your-render-backend>.onrender.com/api/mobile/skan`

```json
{
  "app_id": "app_ios_123",
  "campaign_id": "23",
  "conversion_value": 5,
  "fidelity_type": "0",
  "is_redownload": false,
  "postback_at": "2026-02-16T22:00:00.000Z",
  "raw_payload": {
    "version": "4.0",
    "ad-network-id": "example.skadnetwork"
  }
}
```

### 4.4 Signup Event
Use same `/api/events` with `platform=ios`.

## 5. Event Contract
Supported `event_name` values:
1. `install`
2. `signup`
3. `trial_start`
4. `purchase`
5. `subscription_start`
6. `subscription_renewal`
7. any custom event (stored as `CUSTOM`)

Revenue events should include:
1. `event_value` (USD numeric)
2. `currency` (default expected `USD`)

## 6. Minimal Mobile Pseudocode
### Android
```kotlin
val referrer = playReferrerClient.installReferrer
post("/api/mobile/install", mapOf(
  "app_id" to APP_ID,
  "platform" to "android",
  "device_id" to deviceId,
  "install_referrer" to referrer
), apiKey = SOURCE_TRACE_KEY)
```

### iOS
```swift
post("/api/mobile/install", body: [
  "app_id": appId,
  "platform": "ios",
  "device_id": deviceId,
  "app_store_campaign_token": campaignToken
], apiKey: sourceTraceKey)
```

## 7. Validation Checklist
1. Click appears in SourceTrace for each campaign link.
2. Install payload accepted with `201`.
3. Signup payload accepted with `202`.
4. Dashboard shows installs/signups grouped by source/channel.
5. Attribution lookup works for sampled install IDs (`POST /api/attribution`).

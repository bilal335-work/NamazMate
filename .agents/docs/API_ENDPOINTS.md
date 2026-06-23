# API_ENDPOINTS.md

## Strategy
Use Supabase client for safe RLS-protected reads/writes, Edge Functions for sensitive business logic, and Realtime for Duo updates.

## Required Edge Functions

### get-today-prayers
`POST /functions/v1/get-today-prayers`
Request: `{}`. Authenticates user, fetches location/settings, checks cache, calls Aladhan if needed, saves cache, returns normalized prayers.

### get-month-prayers
`POST /functions/v1/get-month-prayers`
Request: `{ "month": 5, "year": 2026 }`. Fetches/caches monthly prayer times.

### resolve-location
`POST /functions/v1/resolve-location`
Request: `{ "latitude": 31.5204, "longitude": 74.3587, "source": "gps" }`. Uses free/open geocoding and returns normalized location.

### save-location
`POST /functions/v1/save-location`
Saves city, region, country, countryCode, lat, lng, timezone, locationSource. Refreshes prayer cache if changed.

### save-prayer-settings
`POST /functions/v1/save-prayer-settings`
Saves calculation method, Asr method, time format. Server maps method name to Aladhan IDs.

### save-notification-settings
`POST /functions/v1/save-notification-settings`
Saves preferences, permission state, and push token when available.

### create-pair-invite
`POST /functions/v1/create-pair-invite`
Creates one active invite for unpaired user, expires in 7 days.

### accept-pair-invite
`POST /functions/v1/accept-pair-invite`
Validates code, blocks own invite/already paired users, creates pair, sends notification.

### decline-pair-invite
`POST /functions/v1/decline-pair-invite`
Declines pending invite.

### cancel-pair-invite
`POST /functions/v1/cancel-pair-invite`
Cancels own pending invite.

### remove-partner
`POST /functions/v1/remove-partner`
Marks active pair as removed, sends notification, realtime closes Duo.

### sync-prayer-log-statuses
`POST /functions/v1/sync-prayer-log-statuses`
Creates/updates today prayer log statuses based on user timezone and prayer times.

### mark-prayer
`POST /functions/v1/mark-prayer`
Request: `{ "prayerKey": "asr", "markType": "prayed" }` or `{ "prayerKey": "dhuhr", "markType": "qaza_prayed" }`. Validates transition, no undo, no future marking, same-day Qaza only, recalculates score.

### send-partner-reminder
`POST /functions/v1/send-partner-reminder`
Request: `{ "pairId": "pair-id", "prayerKey": "asr", "message": "Time for Asr 🤲" }`. Enforces active pair, message max 120, cooldown 30 minutes.

## Error Format
```json
{ "success": false, "error": { "code": "INVITE_EXPIRED", "message": "This invite has expired. Please ask your partner to send a new one." } }
```

Common errors: UNAUTHORIZED, LOCATION_NOT_FOUND, PRAYER_SETTINGS_NOT_FOUND, INVITE_EXPIRED, ALREADY_PAIRED, CANNOT_ACCEPT_OWN_INVITE, INVALID_PRAYER_KEY, PRAYER_LOCKED, QAZA_EXPIRED, REMINDER_COOLDOWN_ACTIVE.

## Direct Supabase Reads
Allowed with RLS: own profile, active partner basic profile, cities, own logs, active partner logs from pair date, own pair, own invites, own notification settings.

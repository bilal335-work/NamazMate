# EDGE_FUNCTIONS_SPEC.md

## General Rules
Every Edge Function validates auth and input, returns consistent responses, hides raw errors, and uses service role only server-side.

## Standard Responses
Success: `{ "success": true, "data": {} }`
Error: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "User-friendly message." } }`

## Shared Types
`PrayerKey = fajr | dhuhr | asr | maghrib | isha`
`PrayerStatus = locked | available | prayed | qaza_available | qaza_prayed | not_completed`
`MarkType = prayed | qaza_prayed`

## Functions

### get-today-prayers
Authenticate, fetch location/settings, calculate date in timezone, check cache, call Aladhan if missing, normalize, save cache, return.

### get-month-prayers
Validate month/year, fetch/cache monthly prayers.

### resolve-location
Validate coordinates/source, use free/open reverse geocoding, resolve timezone via free approach/nearest city, return normalized location.

### save-location
Validate and upsert location, refresh/clear prayer cache, update onboarding step.

### save-prayer-settings
Validate calculation method, Asr method, time format. Server maps method to Aladhan IDs. Refresh cache.

### save-notification-settings
Validate preferences, upsert settings, save push token if granted, complete onboarding if applicable.

### create-pair-invite
Check no active pair, cancel old pending invite if needed, generate unique code, create invite with 7-day expiry.

### accept-pair-invite
Validate invite pending/not expired/not own invite/no active pairs, create pair, set pair_start_date, accept invite, send notification.

### decline-pair-invite
Validate invite and allowed user, set status declined.

### cancel-pair-invite
Validate invite belongs to current user and pending, set cancelled.

### remove-partner
Validate active pair and membership, set removed_by/removed_at/status, send notification.

### sync-prayer-log-statuses
Fetch timezone and prayer times, get/create daily log, update allowed automatic statuses, recalculate score.

### mark-prayer
Run sync first, validate prayerKey/markType/current status, allow only `available → prayed` or `qaza_available → qaza_prayed`, block undo/future/old Qaza, update status, set marked_at, recalculate score, send notification.

### send-partner-reminder
Validate active pair, receiver, prayer key, message, 120-char max, 30-minute cooldown, insert reminder, send push if allowed.

### send-push-notification
Internal helper only. Respect settings, fetch active tokens, send Expo push, mark invalid tokens inactive.

## Build Order
save-location, save-prayer-settings, save-notification-settings, get-today-prayers, get-month-prayers, sync-prayer-log-statuses, mark-prayer, create-pair-invite, accept-pair-invite, decline-pair-invite, cancel-pair-invite, send-partner-reminder, remove-partner, resolve-location.

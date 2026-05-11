# RELEASE_CHECKLIST.md

## Product Scope
MVP includes Auth, email activation, Google Sign-In, onboarding, gender/location/prayer/notification setup, Home prayer dashboard, prayer/Qaza marking, Duo pairing, realtime, partner reminders, Profile/settings.
Not MVP: Apple Sign-In, multiple partners, groups, chat, paid subscriptions, Sunnah/Nafl/Witr, advanced analytics, achievements, masjid finder, Qibla.

## Free-Only Check
No Google Places, Maps, Time Zone, paid geocoding, paid notifications, paid analytics/SDKs. Use Supabase Free, Aladhan, OpenStreetMap/Nominatim carefully, free city data, Expo Notifications.

## Auth Check
Signup, activation link, verification blocking, auth callback, resend, sign in, Google, forgot password all work.

## Onboarding Check
Gender required, avatar assigned, all location methods work, saved location has all fields, prayer defaults work, notifications grant/deny/skip work.

## Home Check
Two sections only. Prayer times load/cache, countdown works, timezone correct, no UI Aladhan call, statuses work, marking confirmations/no undo, Qaza same-day, score correct, Jummah display correct.

## Duo Check
Pairing, invite lifecycle, errors, one partner, dashboard, Qaza summary only, history from pair date, reminders, cooldown, remove partner all work.

## Realtime Check
Prayer update appears instantly, pair removal closes Duo, reminders/invite updates work, no polling/loops, subscriptions cleanup.

## Notifications Check
Local reminders schedule/reschedule/no duplicate. Push notifications for partner/invite/removal work and respect settings.

## Profile Check
Profile, edit name, avatar, gender, location, prayer settings, notifications, logout all work.

## Database/RLS Check
Tables, indexes, constraints exist. RLS enabled. Users access own data only. Partner access limited. Removed partner blocked. Sensitive actions through Edge Functions.

## Edge Function Check
All required functions exist, auth checked, input validated, user timezone used, friendly errors returned, service role server-side only.

## Design Check
Cream background, charcoal primary, Titan One headings, consistent buttons/cards/inputs, calm copy, no raw errors.

## Animation Check
Staircase Down matches spec and reduced motion fallback works.

## Performance Check
Cached prayer times, no repeated geocoding/Aladhan calls, no unnecessary subscriptions, city table not fully loaded, smooth app opening.

## Accessibility Check
44px targets, contrast, labels, status text/icons, reduced motion, dynamic text safe.

## Device Check
Small/large iOS and Android, deep links, Google, notifications, location, online/slow/offline.

## Go/No-Go
Go only if auth, onboarding, prayer times, Qaza, Duo, realtime, notifications, Profile, RLS, no paid APIs, no exposed service role, no Duo polling all pass.

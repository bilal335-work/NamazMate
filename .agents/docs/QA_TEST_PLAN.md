# QA_TEST_PLAN.md

## Auth QA
Test Splash routing, Sign Up validation, activation link, Email Verification, Resend Email, Sign In, Google Sign-In, Forgot Password, Logout.

## Onboarding QA
Test required gender, avatar assignment, GPS allowed/denied, city selector, map picker, confirm location, prayer settings defaults, notifications grant/deny/skip.

## Home / Prayer QA
Test prayer times, cache, timezone, no UI Aladhan calls, Home two-section layout, Jummah display, all statuses, marking confirmation, no undo, Qaza same-day, Isha until next Fajr, scoring.

## Notifications QA
Test local prayer/before/Qaza notifications, rescheduling, no duplicates, push token saving, partner completed/reminder/invite/removed notifications, disabled preferences.

## Duo Pairing QA
Test unpaired screen, create/copy/share/cancel invite, enter code, invalid/expired/own invite errors, already paired blocks, accept/decline, pair start date.

## Duo Dashboard QA
Test partner data display, Qaza summary only, 7/30/all-time history, realtime prayer updates, no polling, reminders, cooldown, custom emoji messages, remove partner.

## Profile QA
Test profile display, edit name, avatar, gender, location, prayer settings, notification settings, logout.

## Security / RLS QA
Test random data blocked, partner access only from pair date, removed partner blocked, push tokens private, partner cannot update logs, pair creation/removal only through Edge Functions.

## Edge Function QA
For each function, test auth, input validation, business rules, friendly errors, raw errors hidden.

## Performance QA
No repeated Aladhan calls, no repeated Nominatim calls, no polling, React Query cache works, subscriptions clean up, city table not loaded all at once.

## Free-Only QA
Confirm no Google Places, Google Maps, Google Time Zone, paid geocoding, paid notifications, paid analytics, or paid SDKs.

## Accessibility QA
44px targets, contrast, text/icons for statuses, labels, readable errors, reduced motion, accessibility labels.

## Device QA
Test small/large iOS and Android, deep links, notifications, location permission, online/slow/offline network states.

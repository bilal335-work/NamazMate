# IMPLEMENTATION_NOTES.md

## App Opening Animation
Run Staircase Down only on cold app open. In parallel check auth/session. Remove overlay after completion. Respect reduced motion.

## Auth
Use activation link, not code. Email users cannot enter onboarding until verified. Google users are treated as verified. Store sessions with Expo SecureStore. No Apple Sign-In in MVP.

## Onboarding
Order: Gender → Location → Prayer Settings → Notifications. Track with `profiles.onboarding_step`. Completion sets onboarding_completed true and step null.

## Location
Use Current Location, City Selector, and Map Picker. Ask GPS permission only after user taps. No Google APIs. Cache reverse geocoding. Always save lat/lng/timezone.

## Prayer Times
Frontend → Edge Function → Aladhan → cache → frontend. Do not call Aladhan from UI. Do not refetch every minute. Use saved timezone. Refresh when location/settings/cache/month changes.

## Prayer Logs
Backend validates status transitions. Use `sync-prayer-log-statuses` and `mark-prayer`. No undo. Qaza same day only.

## Jummah
Display-only. If gender male and Friday, show Jummah; otherwise Dhuhr. Always store `dhuhr`. Do not change old logs when gender changes.

## Notifications
Local for prayer/before/Qaza. Push for partner actions. Optional; app works if skipped. Respect preferences. No duplicates.

## Duo
One active pair, one active invite. Invite expires 7 days. Sensitive actions through Edge Functions. Partner sees limited data from pair date only. Unpair sets pair removed and closes Duo for both.

## Realtime
Use Supabase Realtime for Duo progress, pair status, reminders, invite updates. No polling. Subscribe only when screen active and unsubscribe on unmount.

## Data Fetching
React Query for server data. Zustand only for lightweight UI state. Do not duplicate server state.

## Offline
Show cached prayer times if available. Prayer marking is online-only MVP because backend validation/no undo are required.

## Errors
Use friendly messages. Do not show raw Supabase, SQL, API, stack trace, or internals.

## Security
Never expose service role key in app. Use RLS. Validate frontend and backend. Do not trust client data.

## Performance
Avoid polling, repeated geocoding, repeated Aladhan calls, large global state, unnecessary subscriptions, and heavy recurring animations.

## Testing Priorities
Email verification, onboarding routing, location selector, prayer cache, prayer marking, Qaza same-day, Duo pairing, realtime, remove partner, notification preferences, RLS.

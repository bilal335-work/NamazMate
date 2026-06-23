# GEMINI.md

## Project Name
NamazMate

## Tech Stack
- Mobile: React Native, Expo, TypeScript, Expo Router
- Styling: NativeWind
- Backend: Supabase Free Tier, Supabase Auth, PostgreSQL, Edge Functions, Realtime
- Prayer Times: Aladhan API, Adhan.js fallback later
- Location: Expo Location, Supabase `cities` table, OpenStreetMap/Nominatim carefully
- Notifications: Expo Notifications, local scheduled notifications, Expo Push Notifications
- State/Data: TanStack React Query, Zustand only for lightweight local state
- Forms: React Hook Form, Zod
- Secure Storage: Expo SecureStore

## Free-Only Restrictions
Do not use paid APIs/services, Google Places API, Google Maps API, Google Time Zone API, paid geocoding, paid notifications, paid analytics by default, or paid SDKs by default.

## Product Decisions
- Main tabs: Home, Duo, Profile. No separate Invite tab.
- Auth flow: Splash → Welcome → Sign Up / Sign In.
- Auth methods: Email/password and Google Sign-In only. No Apple Sign-In in MVP.
- Email activation link verification is required before onboarding.
- Gender is required in onboarding and can be changed later in Profile.
- Default avatar: Islamic/minimal vector avatar by gender. Custom upload later from Profile.
- Location methods: Current Location, Country → Region → City selector, Map Picker.
- Pairing: one partner only in MVP.
- Duo unpaired state contains invite/pairing UI. Duo paired state contains progress, reminders, history, remove partner.

## Prayer Rules
Tracked prayers: Fajr, Dhuhr, Asr, Maghrib, Isha.
Jummah is display-only for male users on Friday and stored internally as `dhuhr`.
Statuses: `locked`, `available`, `prayed`, `qaza_available`, `qaza_prayed`, `not_completed`.
Prayer can be marked only after time starts and before next prayer starts. Future prayers are locked. No undo.
Qaza is same-day only. If day ends, unmarked Qaza becomes `not_completed`.
Scoring: prayed = 1, qaza_prayed = 0.5, all other incomplete states = 0.

## Partner Visibility
Partner can see today progress, 7-day/30-day/all-time score from pair date, and Qaza summary only. Partner cannot see exact Qaza prayer names, exact location, notification settings, push tokens, prayer settings, or data before pair date.

## Code Quality Rules
- Clean, simple, readable TypeScript.
- Avoid `any`, over-engineering, duplication, unused code, and temporary hacks.
- Screens compose components and hooks; no API calls directly in UI components.
- Supabase/API calls live in `services/`.
- Server data uses React Query; Zustand is only for lightweight local UI state.
- Use Zod validation.
- Use RLS and Edge Functions for sensitive actions.
- No polling or loops for realtime.

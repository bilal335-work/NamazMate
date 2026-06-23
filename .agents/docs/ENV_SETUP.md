# ENV_SETUP.md

## Environment Files
Use `.env.local`, `.env.development`, `.env.production`. Do not commit real secrets.

## Mobile App Variables
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_APP_SCHEME=namazmate
EXPO_PUBLIC_APP_NAME=NamazMate
EXPO_PUBLIC_ALADHAN_BASE_URL=https://api.aladhan.com/v1
```
Only expose safe values. Never put service role key in app.

## Edge Function Variables
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALADHAN_BASE_URL=https://api.aladhan.com/v1
EXPO_PUSH_API_URL=https://exp.host/--/api/v2/push/send
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
```
Service role only in Edge Functions.

## Auth Setup
Enable email/password, Google Sign-In, confirm email, activation links, password reset links, and mobile deep links. No Apple Sign-In in MVP.

## Deep Links
Scheme: `namazmate://`
Redirects: `namazmate://auth/callback`, `namazmate://reset-password`, `namazmate://invite`.
Add Expo dev URLs if needed.

## Supabase Setup
Enable `pgcrypto`, create all required tables, RLS policies, realtime tables, and storage bucket `avatars`.

## Storage
Bucket: `avatars`. Path: `avatars/{user_id}/{filename}`. Users can manage own avatar.

## City Dataset
Required fields: city, region, country, country_code, latitude, longitude, timezone. MVP countries include PK, IN, BD, SA, AE, QA, KW, EG, GB, US, CA, AU.

## Prayer Defaults
Create country mapping constants. PK/IN/BD default Karachi + Hanafi. SA Umm al-Qura. AE Dubai. US/CA ISNA. GB/default MWL. Verify Aladhan IDs.

## Expo Config
Set app name, slug, scheme, bundle identifier, Android package, permissions, notifications, deep links, icons, splash.

## Permissions
Location asked only after Use Current Location. Notifications asked only after Allow Notifications.

## Security
Never commit real env files, service role key, OAuth secrets, private keys, production credentials. Anon key and public URLs are okay in app.

## Final Checklist
Expo project, Supabase project, auth providers, email verification, deep links, tables, RLS, realtime, city data, avatar bucket, env vars, no paid API keys.

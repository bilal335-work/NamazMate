# RLS_POLICIES.md

## Purpose
Secure NamazMate data so users only access their own data, allowed paired-user data, public city data, and valid invite data.

## Enable RLS
Enable RLS on all user tables: profiles, user_locations, prayer_settings, notification_settings, push_tokens, cities, prayer_time_cache, prayer_logs, pair_invites, pairs, partner_reminders.

## Helper Function
```sql
create or replace function public.is_active_pair(user_one uuid, user_two uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from pairs
    where status = 'active'
      and ((user_a_id = user_one and user_b_id = user_two)
        or (user_a_id = user_two and user_b_id = user_one))
  );
$$;
```

## Policy Rules
- Profiles: user can read/update/insert own profile; active partner can read basic partner profile.
- Locations: user can read/insert/update/delete own location. Partner cannot read exact location in MVP.
- Prayer settings: user can read/write own settings only.
- Notification settings: user can read/write own settings only.
- Push tokens: user can manage own tokens only. Partner cannot read tokens.
- Cities: authenticated users can read. No app insert/update/delete.
- Prayer time cache: user can read/write own cache; writes preferably through Edge Functions.
- Prayer logs: user can read/insert/update own logs. Active partner can read prayer logs only from pair date onward. Partner cannot update logs. No delete policy in MVP.
- Pair invites: user can create own invite; read own invites; authenticated users can lookup pending non-expired invite codes; user can cancel own pending invite.
- Pairs: user can read pairs they are part of. Creation/removal only through Edge Functions.
- Partner reminders: users can read sent/received reminders and create reminders only for active partner; cooldown enforced in Edge Function.

## Realtime Tables
Enable realtime only for `prayer_logs`, `pairs`, `partner_reminders`, `pair_invites`.

## Edge Function Enforcement
Sensitive actions must use Edge Functions: accept invite, remove partner, send reminder, mark prayer. Never disable RLS to fix an access problem.

# DATABASE_SCHEMA.md

## Core Tables
`profiles`, `user_locations`, `prayer_settings`, `notification_settings`, `push_tokens`, `cities`, `prayer_time_cache`, `prayer_logs`, `pair_invites`, `pairs`, `partner_reminders`.

## Required Extension
```sql
create extension if not exists "pgcrypto";
```

## profiles
Stores user profile, gender, avatar, onboarding state.
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  gender text not null check (gender in ('male','female','prefer_not_to_say')),
  avatar_type text not null default 'default_vector' check (avatar_type in ('default_vector','custom_upload')),
  avatar_style text default 'islamic_minimal',
  avatar_key text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  onboarding_step text check (onboarding_step in ('gender','location','prayer_settings','notifications')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## user_locations
One active prayer location per user.
```sql
create table user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  city text not null,
  region text,
  country text not null,
  country_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  location_source text not null check (location_source in ('gps','city_selector','map')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
```

## prayer_settings
Stores calculation method, Asr method, time format, and adjustments.
```sql
create table prayer_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  calculation_method text not null check (calculation_method in ('AUTO','MWL','ISNA','UMM_AL_QURA','EGYPTIAN','KARACHI','DUBAI','QATAR','KUWAIT')),
  aladhan_method_id integer not null,
  asr_method text not null check (asr_method in ('STANDARD','HANAFI')),
  aladhan_school_id integer not null check (aladhan_school_id in (0,1)),
  time_format text not null default '12h' check (time_format in ('12h','24h')),
  fajr_adjustment integer not null default 0,
  dhuhr_adjustment integer not null default 0,
  asr_adjustment integer not null default 0,
  maghrib_adjustment integer not null default 0,
  isha_adjustment integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
```

## notification_settings
Stores user notification preferences and permission state.

## push_tokens
Stores Expo push tokens per user/device.

## cities
Free city dataset for selectors. Required fields: city, region, country, country_code, latitude, longitude, timezone. Add indexes on `country_code`, `region`, `city`, and `(country_code, region)`.

## prayer_time_cache
Caches prayer times by `user_id + prayer_date`.

## prayer_logs
One daily row per user/date. Fixed columns for five prayer statuses and marked_at timestamps. Status values: `locked`, `available`, `prayed`, `qaza_available`, `qaza_prayed`, `not_completed`. `daily_score numeric(3,1)`.

## pair_invites
Stores invite code, creator, accepted_by, status, expiry. Status values: `pending`, `accepted`, `declined`, `expired`, `cancelled`.

## pairs
Stores active/removed pair relationship, `pair_start_date`, removal data, and status. One active pair per user enforced by logic/Edge Functions.

## partner_reminders
Stores reminder events with pair, sender, receiver, prayer_date, prayer_key, message max 120 chars, sent_at. Index for cooldown checks.

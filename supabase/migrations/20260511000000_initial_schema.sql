-- Initial Schema Migration for NamazMate
-- Date: 2026-05-11

-- Required Extension
create extension if not exists "pgcrypto";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  gender text not null check (gender in ('male', 'female', 'prefer_not_to_say')),
  avatar_type text not null default 'default_vector' check (avatar_type in ('default_vector', 'custom_upload')),
  avatar_style text default 'islamic_minimal',
  avatar_key text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  onboarding_step text check (onboarding_step in ('gender', 'location', 'prayer_settings', 'notifications')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- user_locations
create table if not exists public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  city text not null,
  region text,
  country text not null,
  country_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  location_source text not null check (location_source in ('gps', 'city_selector', 'map')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- prayer_settings
create table if not exists public.prayer_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  calculation_method text not null check (calculation_method in ('AUTO', 'MWL', 'ISNA', 'UMM_AL_QURA', 'EGYPTIAN', 'KARACHI', 'DUBAI', 'QATAR', 'KUWAIT')),
  aladhan_method_id integer not null,
  asr_method text not null check (asr_method in ('STANDARD', 'HANAFI')),
  aladhan_school_id integer not null check (aladhan_school_id in (0, 1)),
  time_format text not null default '12h' check (time_format in ('12h', '24h')),
  fajr_adjustment integer not null default 0,
  dhuhr_adjustment integer not null default 0,
  asr_adjustment integer not null default 0,
  maghrib_adjustment integer not null default 0,
  isha_adjustment integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- notification_settings
create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prayer_notifications_enabled boolean not null default true,
  before_prayer_notifications_enabled boolean not null default true,
  qaza_notifications_enabled boolean not null default true,
  partner_notifications_enabled boolean not null default true,
  push_notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- push_tokens
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  device_id text,
  platform text check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, token)
);

-- cities
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  region text,
  country text not null,
  country_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cities_country_code on public.cities(country_code);
create index if not exists idx_cities_region on public.cities(region);
create index if not exists idx_cities_city on public.cities(city);
create index if not exists idx_cities_country_region on public.cities(country_code, region);

-- prayer_time_cache
create table if not exists public.prayer_time_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prayer_date date not null,
  fajr timestamptz not null,
  dhuhr timestamptz not null,
  asr timestamptz not null,
  maghrib timestamptz not null,
  isha timestamptz not null,
  created_at timestamptz not null default now(),
  unique(user_id, prayer_date)
);

-- prayer_logs
create table if not exists public.prayer_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prayer_date date not null,
  fajr_status text not null default 'locked' check (fajr_status in ('locked', 'available', 'prayed', 'qaza_available', 'qaza_prayed', 'not_completed')),
  dhuhr_status text not null default 'locked' check (dhuhr_status in ('locked', 'available', 'prayed', 'qaza_available', 'qaza_prayed', 'not_completed')),
  asr_status text not null default 'locked' check (asr_status in ('locked', 'available', 'prayed', 'qaza_available', 'qaza_prayed', 'not_completed')),
  maghrib_status text not null default 'locked' check (maghrib_status in ('locked', 'available', 'prayed', 'qaza_available', 'qaza_prayed', 'not_completed')),
  isha_status text not null default 'locked' check (isha_status in ('locked', 'available', 'prayed', 'qaza_available', 'qaza_prayed', 'not_completed')),
  fajr_marked_at timestamptz,
  dhuhr_marked_at timestamptz,
  asr_marked_at timestamptz,
  maghrib_marked_at timestamptz,
  isha_marked_at timestamptz,
  daily_score numeric(3,1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, prayer_date)
);

-- pairs
create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  pair_start_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'removed')),
  removed_at timestamptz,
  removed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_a_id != user_b_id)
);

create index if not exists idx_pairs_active_users on public.pairs(user_a_id, user_b_id) where status = 'active';

-- pair_invites
create table if not exists public.pair_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- partner_reminders
create table if not exists public.partner_reminders (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  prayer_date date not null,
  prayer_key text not null check (prayer_key in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  message text check (length(message) <= 120),
  sent_at timestamptz not null default now()
);

create index if not exists idx_partner_reminders_cooldown on public.partner_reminders(sender_id, receiver_id, prayer_date, prayer_key, sent_at);

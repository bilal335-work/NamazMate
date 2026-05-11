-- Fix Phase 3 Schema Alignment
-- Date: 2026-05-11
-- Purpose: Align Supabase schema with NamazMate documentation requirements for Phase 3.

-- 1. notification_settings cleanup and alignment
alter table public.notification_settings 
  rename column prayer_notifications_enabled to prayer_reminders_enabled;
alter table public.notification_settings 
  rename column before_prayer_notifications_enabled to before_prayer_reminder_enabled;
alter table public.notification_settings 
  rename column qaza_notifications_enabled to qaza_reminder_enabled;
alter table public.notification_settings 
  rename column partner_notifications_enabled to partner_activity_enabled;

alter table public.notification_settings 
  add column if not exists before_prayer_minutes integer not null default 10,
  add column if not exists invite_notifications_enabled boolean not null default true;

-- 2. prayer_time_cache alignment
alter table public.prayer_time_cache 
  add column if not exists timezone text not null,
  add column if not exists latitude double precision not null,
  add column if not exists longitude double precision not null,
  add column if not exists calculation_method text not null,
  add column if not exists aladhan_method_id integer not null,
  add column if not exists asr_method text not null,
  add column if not exists aladhan_school_id integer not null;

-- 3. push_tokens alignment
alter table public.push_tokens 
  add column if not exists is_active boolean not null default true;

-- 4. resolved_locations_cache creation (from CITY_DATA_IMPORT_PLAN.md)
create table if not exists public.resolved_locations_cache (
  id uuid primary key default gen_random_uuid(),
  rounded_latitude numeric(5,2) not null,
  rounded_longitude numeric(5,2) not null,
  city text not null,
  region text,
  country text not null,
  country_code text not null,
  timezone text not null,
  created_at timestamptz not null default now(),
  unique(rounded_latitude, rounded_longitude)
);

alter table public.resolved_locations_cache enable row level security;
create policy "Authenticated users can read resolved locations"
  on public.resolved_locations_cache for select
  to authenticated
  using (true);

-- 5. RLS Policy Fixes (Backend Authority Enforcement)

-- prayer_logs: restrict to SELECT only for users (mark-prayer is Edge Function only)
drop policy if exists "Users can manage own prayer logs" on public.prayer_logs;
create policy "Users can view own prayer logs"
  on public.prayer_logs for select
  using (auth.uid() = user_id);

-- pair_invites: restrict to SELECT only for users (create/accept/cancel are Edge Functions)
drop policy if exists "Users can manage own invites" on public.pair_invites;
create policy "Users can view own invites"
  on public.pair_invites for select
  using (auth.uid() = created_by);

-- partner_reminders: restrict to SELECT only for users (send-reminder is Edge Function)
drop policy if exists "Users can create reminders for active partner" on public.partner_reminders;
-- (Denied by default as no INSERT policy exists for authenticated users)

-- Ensure cities table has correct RLS (authenticated users can read)
-- This was already in initial_schema but enforced here for consistency
drop policy if exists "Authenticated users can read cities" on public.cities;
create policy "Authenticated users can read cities"
  on public.cities for select
  to authenticated
  using (true);

-- RLS Policies Migration for NamazMate
-- Date: 2026-05-11

-- Helper Function
create or replace function public.is_active_pair(user_one uuid, user_two uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pairs
    where status = 'active'
      and ((user_a_id = user_one and user_b_id = user_two)
        or (user_a_id = user_two and user_b_id = user_one))
  );
$$;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_locations enable row level security;
alter table public.prayer_settings enable row level security;
alter table public.notification_settings enable row level security;
alter table public.push_tokens enable row level security;
alter table public.cities enable row level security;
alter table public.prayer_time_cache enable row level security;
alter table public.prayer_logs enable row level security;
alter table public.pairs enable row level security;
alter table public.pair_invites enable row level security;
alter table public.partner_reminders enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Active partners can view basic profile"
  on public.profiles for select
  using (public.is_active_pair(auth.uid(), id));

-- user_locations
create policy "Users can manage own location"
  on public.user_locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- prayer_settings
create policy "Users can manage own prayer settings"
  on public.prayer_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- notification_settings
create policy "Users can manage own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- push_tokens
create policy "Users can manage own push tokens"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- cities
create policy "Authenticated users can read cities"
  on public.cities for select
  to authenticated
  using (true);

-- prayer_time_cache
create policy "Users can manage own prayer time cache"
  on public.prayer_time_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- prayer_logs
create policy "Users can manage own prayer logs"
  on public.prayer_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Active partners can view prayer logs from pair date"
  on public.prayer_logs for select
  using (
    exists (
      select 1 from public.pairs
      where status = 'active'
        and public.prayer_logs.prayer_date >= pair_start_date
        and ((user_a_id = auth.uid() and user_b_id = public.prayer_logs.user_id)
          or (user_a_id = public.prayer_logs.user_id and user_b_id = auth.uid()))
    )
  );

-- pairs
create policy "Users can view pairs they belong to"
  on public.pairs for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- pair_invites
create policy "Users can manage own invites"
  on public.pair_invites for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "Authenticated users can view pending invites"
  on public.pair_invites for select
  to authenticated
  using (status = 'pending' and expires_at > now());

-- partner_reminders
create policy "Users can view sent or received reminders"
  on public.partner_reminders for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can create reminders for active partner"
  on public.partner_reminders for insert
  with check (
    auth.uid() = sender_id 
    and public.is_active_pair(sender_id, receiver_id)
  );

-- Enable Realtime
alter publication supabase_realtime add table public.prayer_logs;
alter publication supabase_realtime add table public.pairs;
alter publication supabase_realtime add table public.partner_reminders;
alter publication supabase_realtime add table public.pair_invites;

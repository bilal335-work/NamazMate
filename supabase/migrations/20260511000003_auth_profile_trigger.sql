-- Auth Profile Trigger
-- Date: 2026-05-11
-- Purpose: Automatically create a profile row in public.profiles when a new user signs up in auth.users.

-- function to handle profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, gender)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'prefer_not_to_say' -- Default gender to satisfy NOT NULL constraint
  );
  return new;
end;
$$;

-- trigger to execute function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

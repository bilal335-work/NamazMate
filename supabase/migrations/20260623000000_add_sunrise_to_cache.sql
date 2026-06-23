ALTER TABLE public.prayer_time_cache
ADD COLUMN IF NOT EXISTS sunrise TEXT;

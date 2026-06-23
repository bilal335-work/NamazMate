-- Add unique constraint to support safe upserts during city data import
-- Postgres 15+ allows NULLS NOT DISTINCT which treats multiple NULL regions as the same identity
ALTER TABLE public.cities 
ADD CONSTRAINT cities_unique_identity 
UNIQUE NULLS NOT DISTINCT (country_code, region, city, latitude, longitude);

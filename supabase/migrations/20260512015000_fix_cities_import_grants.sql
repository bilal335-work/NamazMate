-- Grant permissions for city data management
-- Service role needs full access for seeding and updates
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.cities
TO service_role;

-- Authenticated users only need to read cities for the location selector
GRANT SELECT
ON public.cities
TO authenticated;

-- RLS remains enabled to protect the data
-- No INSERT/UPDATE/DELETE permissions for public/authenticated users

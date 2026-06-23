# CITY_DATA_IMPORT_PLAN.md

## Purpose
Prepare/import free city/location data for Country → Region → City selector without paid APIs.

## Requirement
Selector supports Country → Region/State/Province → City. No free typing in MVP. Every selected city provides city, region, country, country_code, latitude, longitude, timezone.

## Free-Only
No Google Places, Google Maps, Google Time Zone, paid geocoding, paid location search. Use free dataset, Supabase cities, OpenStreetMap/Nominatim for GPS/map only with caching.

## MVP Countries
Pakistan, India, Bangladesh, Saudi Arabia, UAE, Qatar, Kuwait, Egypt, UK, US, Canada, Australia.

## Cities Table
Fields: city, region, country, country_code, latitude, longitude, timezone. Index country_code, region, city, and (country_code, region).

## Data Sources
Free/open: GeoNames, SimpleMaps free dataset, OpenStreetMap export. Recommended MVP: clean a CSV with city/admin/country/iso2/lat/lng/timezone/population.

## Filtering
Do not import every tiny village. Suggested population threshold 25,000, with exceptions for important/religious/common cities.

## Normalization
Country code: ISO alpha-2. Region: readable admin field. Timezone: IANA timezone, not abbreviations.

## Import Process
1. Download free dataset
2. Clean data
3. Remove missing lat/lng/country/timezone
4. Normalize names/codes
5. Filter MVP countries
6. Filter population
7. Remove duplicates
8. Create cities_cleaned.csv
9. Import into Supabase
10. Verify important cities

## Query Patterns
Countries: distinct country/country_code.
Regions: distinct region by country_code.
Cities: filtered by country_code and region, ordered by city.

## Frontend Flow
Fetch countries → select country → fetch regions → select region → fetch cities → select city → Confirm Location. Use React Query caching. Do not load all cities at once.

## GPS/Map Reverse Geocoding
Use Nominatim/OpenStreetMap carefully, only when needed. Do not call while dragging map. Resolve after user stops or taps Use This Location. If fails, choose city manually.

## Optional Cache
Add `resolved_locations_cache` with rounded_latitude/rounded_longitude and resolved fields. Round to 2 decimals.

## Timezone Strategy
City selector timezone comes from dataset. GPS/map should use nearest city from your own cities table when possible. No paid timezone API.

## Important Cities Checklist
Verify major cities in PK, IN, BD, SA, UAE, UK, US, CA, AU and other MVP countries.

## Final Rule
Prayer times must never be calculated from city name only. Every location must include lat/lng/timezone.

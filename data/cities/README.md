# City Data Import

This folder is used for storing free, open-source city datasets (such as from geonames.org or simplemaps).

**CRITICAL RULES:**
1. Do NOT use paid APIs.
2. Do NOT use Google Places or Google Maps data.
3. Use a completely free city dataset.

## How to prepare data

1. Download `cities5000.zip` from [GeoNames](https://download.geonames.org/export/dump/).
2. Extract `cities5000.txt` into this directory (`data/cities/cities5000.txt`).
3. Run the conversion script to generate `cities.json`:

```bash
npx tsx scripts/convert-geonames-cities.ts
```

## How to import

1. Place your dataset file (`.json`) in this directory (e.g., `data/cities/free-cities.json`).
2. Ensure the JSON objects match the required `cities` table schema:
   - `city` (string)
   - `region` (string, optional)
   - `country` (string)
   - `country_code` (string)
   - `latitude` (number)
   - `longitude` (number)
   - `timezone` (string)
3. Run the import script from the root of the project with your Supabase credentials:

```bash
# Windows (PowerShell)
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npx tsx scripts/import-cities.ts

# Mac/Linux
SUPABASE_URL="https://your-project.supabase.co" SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" npx tsx scripts/import-cities.ts
```

The script will automatically pick up the dataset file from this directory, validate the data, and batch insert it into the Supabase database.

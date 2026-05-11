import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Setup environment variables
// Note: We use SUPABASE_SERVICE_ROLE_KEY because cities are protected by RLS
// and only the service role can bypass it for initial seeding.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided via environment variables.');
  console.error('Make sure you are NOT using the EXPO_PUBLIC_SUPABASE_ANON_KEY for this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: {
    transport: ws as any,
  },
});

const BATCH_SIZE = 500;

interface CityData {
  city: string;
  region?: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

async function main() {
  const dataDir = path.join(__dirname, '../data/cities');
  const files = fs.readdirSync(dataDir);
  const datasetFile = files.find(f => f.endsWith('.json') || f.endsWith('.csv'));

  if (!datasetFile) {
    console.error(`Error: No dataset file (.json or .csv) found in ${dataDir}`);
    process.exit(1);
  }

  console.log(`Found dataset file: ${datasetFile}`);
  
  const filePath = path.join(dataDir, datasetFile);
  let rawData: CityData[] = [];

  if (datasetFile.endsWith('.json')) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    rawData = JSON.parse(fileContent);
  } else {
    console.error('CSV parsing is not fully implemented in this script. Please convert to JSON or add a CSV parser library.');
    process.exit(1);
  }

  // Validate data
  const validData: CityData[] = rawData.filter(item => 
    item.city && item.country && item.country_code && 
    typeof item.latitude === 'number' && typeof item.longitude === 'number' && item.timezone
  );

  console.log(`Validated ${validData.length} records to import out of ${rawData.length} raw records.`);

  if (validData.length === 0) {
    console.error('No valid records found to import.');
    process.exit(1);
  }

  console.log('Starting batch import...');

  for (let i = 0; i < validData.length; i += BATCH_SIZE) {
    const batch = validData.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('cities')
      .upsert(batch, { onConflict: 'country_code,region,city,latitude,longitude', ignoreDuplicates: true });

    if (error) {
      console.error(`Error importing batch ${i / BATCH_SIZE + 1}:`, error.message);
    } else {
      console.log(`Successfully imported batch ${i / BATCH_SIZE + 1} (${batch.length} records)`);
    }
  }

  console.log('City import completed.');
}

main().catch(console.error);

import * as fs from 'fs';
import * as path from 'path';

// Common country codes to names mapping
const countryMap: Record<string, string> = {
  'PK': 'Pakistan',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'IN': 'India',
  'BD': 'Bangladesh',
  'TR': 'Turkey',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'EG': 'Egypt',
  'JO': 'Jordan',
  'QA': 'Qatar',
  'KW': 'Kuwait',
  'OM': 'Oman',
  'BH': 'Bahrain',
};

const INPUT_FILE = path.join(__dirname, '../data/cities/cities5000.txt');
const OUTPUT_FILE = path.join(__dirname, '../data/cities/cities.json');

async function convert() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found at ${INPUT_FILE}`);
    console.log('Please download cities5000.txt from GeoNames and place it in data/cities/');
    process.exit(1);
  }

  console.log(`Reading ${INPUT_FILE}...`);
  const content = fs.readFileSync(INPUT_FILE, 'utf-8');
  const lines = content.split('\n');

  let rowsRead = 0;
  let rowsSkipped = 0;
  const cities: any[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;
    rowsRead++;

    const cols = line.split('\t');
    
    // 0: geonameid, 1: name, 2: asciiname, 4: lat, 5: long, 8: country_code, 10: admin1, 17: timezone
    const city = cols[2];
    const lat = parseFloat(cols[4]);
    const lon = parseFloat(cols[5]);
    const countryCode = cols[8];
    const region = cols[10];
    const timezone = cols[17]?.trim();

    if (!city || !countryCode || isNaN(lat) || isNaN(lon) || !timezone) {
      rowsSkipped++;
      continue;
    }

    const country = countryMap[countryCode] || countryCode;
    
    // Deduplicate by country_code + region + city
    const key = `${countryCode}|${region}|${city}`.toLowerCase();
    if (seen.has(key)) {
      rowsSkipped++;
      continue;
    }
    seen.add(key);

    cities.push({
      city,
      region: region || null,
      country,
      country_code: countryCode,
      latitude: lat,
      longitude: lon,
      timezone,
    });
  }

  console.log(`Processing complete.`);
  console.log(`Rows read: ${rowsRead}`);
  console.log(`Rows skipped/deduplicated: ${rowsSkipped}`);
  console.log(`Rows written: ${cities.length}`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cities, null, 2));
  console.log(`Output written to ${OUTPUT_FILE}`);
}

convert().catch(console.error);

import { supabase } from '../supabase/client';

export interface City {
  id: string;
  city: string;
  region: string | null;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const locationService = {
  async searchCities(query: string): Promise<City[]> {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .ilike('city', `%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching cities:', error);
      return [];
    }

    return data || [];
  },

  async getCityById(id: string): Promise<City | null> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting city:', error);
      return null;
    }

    return data;
  },

  async resolveLocation(latitude: number, longitude: number): Promise<Partial<City> | null> {
    try {
      // Using Nominatim for free reverse geocoding (OpenStreetMap)
      // Note: In production, consider moving this to an Edge Function
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NamazMate-App',
          },
        }
      );
      
      const data = await response.json();
      
      if (!data || !data.address) return null;

      return {
        city: data.address.city || data.address.town || data.address.village || data.address.suburb || '',
        region: data.address.state || data.address.county || '',
        country: data.address.country || '',
        country_code: data.address.country_code?.toUpperCase() || '',
      };
    } catch (error) {
      console.error('Error resolving location:', error);
      return null;
    }
  }
};

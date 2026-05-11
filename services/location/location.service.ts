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
  async getCountries(): Promise<{ country: string, country_code: string }[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('country, country_code')
      .order('country');

    if (error) {
      console.error('Error fetching countries:', error);
      return [];
    }

    // Unique countries
    const unique = Array.from(new Set(data.map(c => c.country_code)))
      .map(code => data.find(c => c.country_code === code)!);
    
    return unique;
  },

  async getRegions(countryCode: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('region')
      .eq('country_code', countryCode)
      .not('region', 'is', null)
      .order('region');

    if (error) {
      console.error('Error fetching regions:', error);
      return [];
    }

    return Array.from(new Set(data.map(c => c.region!)));
  },

  async getCitiesByRegion(countryCode: string, region: string): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('country_code', countryCode)
      .eq('region', region)
      .order('city');

    if (error) {
      console.error('Error fetching cities by region:', error);
      return [];
    }

    return data || [];
  },

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
      const { data, error } = await supabase.functions.invoke('resolve-location', {
        body: { latitude, longitude },
      });

      if (error || !data.success) {
        console.error('Error resolving location via Edge Function:', error || data.error);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('Error resolving location:', error);
      return null;
    }
  },

  async getUserLocation(userId: string) {
    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

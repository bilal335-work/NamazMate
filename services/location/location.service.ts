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
  }
};

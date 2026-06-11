import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationService } from '@/services/location/location.service';

export const useLocation = () => {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);

  const countriesQuery = useQuery({
    queryKey: ['countries'],
    queryFn: () => locationService.getCountries(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const regionsQuery = useQuery({
    queryKey: ['regions', countryCode],
    queryFn: () => locationService.getRegions(countryCode!),
    enabled: !!countryCode,
    staleTime: 1000 * 60 * 60,
  });

  const citiesQuery = useQuery({
    queryKey: ['cities', countryCode, region],
    queryFn: () => locationService.getCitiesByRegion(countryCode!, region!),
    enabled: !!countryCode && !!region,
    staleTime: 1000 * 60 * 60,
  });

  const isCityDataAvailable = useQuery({
    queryKey: ['cityDataAvailability'],
    queryFn: async () => {
      const countries = await locationService.getCountries();
      return countries.length > 0;
    },
  });

  return {
    countryCode,
    setCountryCode,
    region,
    setRegion,
    countries: countriesQuery.data || [],
    regions: regionsQuery.data || [],
    cities: citiesQuery.data || [],
    isLoadingCountries: countriesQuery.isLoading,
    isLoadingRegions: regionsQuery.isLoading,
    isLoadingCities: citiesQuery.isLoading,
    isCityDataAvailable: isCityDataAvailable.data ?? true, // Default to true to avoid flash
    isLoadingAvailability: isCityDataAvailable.isLoading,
  };
};

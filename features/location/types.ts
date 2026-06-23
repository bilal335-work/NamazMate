export interface LocationData {
  country: string;
  region?: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CityData {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

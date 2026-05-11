export type Gender = 'male' | 'female';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  gender: Gender | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

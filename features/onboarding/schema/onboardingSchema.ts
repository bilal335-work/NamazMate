import { z } from 'zod';

export const genderSchema = z.object({
  gender: z.enum(['male', 'female', 'prefer_not_to_say']),
});

export type GenderFormData = z.infer<typeof genderSchema>;

export const avatarSchema = z.object({
  avatarType: z.enum(['default_vector', 'custom_upload']),
  avatarStyle: z.string(),
});

export type AvatarFormData = z.infer<typeof avatarSchema>;

export const prayerSettingsSchema = z.object({
  calculationMethod: z.string().min(1, 'Please select a calculation method'),
  asrMethod: z.enum(['standard', 'hanafi']),
  timeFormat: z.enum(['12h', '24h']),
});

export type PrayerSettingsFormData = z.infer<typeof prayerSettingsSchema>;

export const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().min(1),
  region: z.string().optional(),
  country: z.string().min(1),
  countryCode: z.string().min(2),
  timezone: z.string().min(1),
  locationSource: z.enum(['gps', 'city_selector', 'manual', 'map']),
});

export type LocationFormData = z.infer<typeof locationSchema>;

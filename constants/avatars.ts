export interface AvatarConfig {
  id: string;
  genderGroup: 'male' | 'female' | 'neutral';
  label: string;
  storagePath: string;
}

export const DEFAULT_AVATARS: AvatarConfig[] = [
  // Male Avatars
  {
    id: 'male_01',
    genderGroup: 'male',
    label: 'Male 01',
    storagePath: 'default/male/male_01.png',
  },
  {
    id: 'male_02',
    genderGroup: 'male',
    label: 'Male 02',
    storagePath: 'default/male/male_02.png',
  },
  {
    id: 'male_03',
    genderGroup: 'male',
    label: 'Male 03',
    storagePath: 'default/male/male_03.png',
  },
  {
    id: 'male_04',
    genderGroup: 'male',
    label: 'Male 04',
    storagePath: 'default/male/male_04.png',
  },
  {
    id: 'male_05',
    genderGroup: 'male',
    label: 'Male 05',
    storagePath: 'default/male/male_05.png',
  },
  // Female Avatars
  {
    id: 'female_01',
    genderGroup: 'female',
    label: 'Female 01',
    storagePath: 'default/female/female_01.png',
  },
  {
    id: 'female_02',
    genderGroup: 'female',
    label: 'Female 02',
    storagePath: 'default/female/female_02.png',
  },
  {
    id: 'female_03',
    genderGroup: 'female',
    label: 'Female 03',
    storagePath: 'default/female/female_03.png',
  },
  {
    id: 'female_04',
    genderGroup: 'female',
    label: 'Female 04',
    storagePath: 'default/female/female_04.png',
  },
  {
    id: 'female_05',
    genderGroup: 'female',
    label: 'Female 05',
    storagePath: 'default/female/female_05.png',
  },
];

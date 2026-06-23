import { PrayerStatus } from './prayer';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
export type PairStatus = 'active' | 'removed';
export { PrayerStatus };

export interface PairInvite {
  id: string;
  code: string;
  created_by: string;
  accepted_by: string | null;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Pair {
  id: string;
  user_a_id: string;
  user_b_id: string;
  pair_start_date: string;
  status: PairStatus;
  removed_at: string | null;
  removed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DuoPartner {
  id: string;
  full_name: string;
  avatar_type: 'default_vector' | 'custom_upload';
  avatar_style: string | null;
  avatar_url: string | null;
}

export interface DuoPair {
  id: string;
  user1_id: string;
  user2_id: string;
  paired_at: string;
  status: 'active' | 'removed';
}

export interface DuoInvite {
  id: string;
  inviter_id: string;
  invite_code: string;
  invite_email: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'canceled';
  created_at: string;
}

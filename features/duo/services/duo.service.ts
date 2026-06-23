import { supabase } from '@/services/supabase/client';
import { Pair, PairInvite, DuoPartner } from '@/features/duo/types';

export const duoService = {
  async getActivePair(userId: string): Promise<Pair | null> {
    const { data, error } = await supabase
      .from('pairs')
      .select('*')
      .eq('status', 'active')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active pair:', error);
      return null;
    }

    return data;
  },

  async getInvites(userId: string): Promise<{ sent: PairInvite[]; received: PairInvite[] }> {
    const [sentRes, receivedRes] = await Promise.all([
      supabase
        .from('pair_invites')
        .select('*')
        .eq('created_by', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('pair_invites')
        .select('*, created_by_profile:profiles(id, full_name, avatar_type, avatar_style, avatar_url)')
        .eq('accepted_by', userId) // This might not be right for public lookup by code, but for direct invites if added later
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    ]);

    // Note: Most invites will be found via code entry, but we list sent ones here
    return {
      sent: sentRes.data || [],
      received: receivedRes.data || []
    };
  },

  async getInviteByCode(code: string): Promise<(PairInvite & { inviter: DuoPartner }) | null> {
    const { data, error } = await supabase
      .from('pair_invites')
      .select('*, profiles!pair_invites_created_by_fkey(id, full_name, avatar_type, avatar_style, avatar_url)')
      .eq('code', code.toUpperCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;

    const { profiles, ...invite } = data;
    return {
      ...invite,
      inviter: profiles as unknown as DuoPartner
    };
  },

  async getPartnerProfile(partnerId: string): Promise<DuoPartner | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_type, avatar_style, avatar_url')
      .eq('id', partnerId)
      .single();

    if (error) return null;
    return data as DuoPartner;
  },

  // Edge Function Calls
  async createInvite() {
    const { data, error } = await supabase.functions.invoke('create-pair-invite');
    if (error) throw error;
    return data;
  },

  async acceptInvite(code: string) {
    const { data, error } = await supabase.functions.invoke('accept-pair-invite', {
      body: { code: code.toUpperCase() }
    });
    if (error) throw error;
    return data;
  },

  async declineInvite(inviteId: string) {
    const { data, error } = await supabase.functions.invoke('decline-pair-invite', {
      body: { inviteId }
    });
    if (error) throw error;
    return data;
  },

  async cancelInvite(inviteId: string) {
    const { data, error } = await supabase.functions.invoke('cancel-pair-invite', {
      body: { inviteId }
    });
    if (error) throw error;
    return data;
  },

  async getPartnerTodayLog(partnerId: string, date: string) {
    const { data, error } = await supabase
      .from('prayer_logs')
      .select('*')
      .eq('user_id', partnerId)
      .eq('prayer_date', date)
      .maybeSingle();

    if (error) {
      console.error('Error fetching partner today log:', error);
      return null;
    }
    return data;
  },

  async getDuoHistory(userId: string, partnerId: string, pairStartDate: string, days?: number) {
    let query = supabase
      .from('prayer_logs')
      .select('user_id, prayer_date, daily_score, fajr_status, dhuhr_status, asr_status, maghrib_status, isha_status')
      .in('user_id', [userId, partnerId])
      .gte('prayer_date', pairStartDate);

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const dateStr = startDate.toISOString().split('T')[0];
      query = query.gte('prayer_date', dateStr);
    }

    const { data, error } = await query.order('prayer_date', { ascending: false });

    if (error) {
      console.error('Error fetching duo history:', error);
      throw error;
    }

    return data;
  },

  async sendReminder(pairId: string, receiverId: string, prayerKey: string, message: string) {
    const { data, error } = await supabase.functions.invoke('send-partner-reminder', {
      body: { pairId, receiverId, prayerKey, message }
    });
    if (error) throw error;
    return data;
  },

  async removePartner(pairId: string) {
    const { data, error } = await supabase.functions.invoke('remove-partner', {
      body: { pairId }
    });
    if (error) throw error;
    return data;
  }
};

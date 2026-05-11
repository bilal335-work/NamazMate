-- Fix Pair Invites Security
-- Date: 2026-05-11
-- Purpose: Remove the direct UPDATE policy on pair_invites so users cannot accept their own invites from the client.

drop policy if exists "Users can update own invites" on public.pair_invites;

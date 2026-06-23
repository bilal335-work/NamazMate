-- Restore the constraint instead of dropping it
ALTER TABLE public.pairs
  DROP CONSTRAINT IF EXISTS pairs_check;

ALTER TABLE public.pairs
  ADD CONSTRAINT pairs_check
  CHECK (user_a_id != user_b_id);

-- Onboarding / interactive tutorial state on profile
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS has_completed_tutorial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tutorial_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_state jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profile.has_completed_tutorial IS
  'True after the user finishes or skips the interactive first-time tutorial.';
COMMENT ON COLUMN public.profile.tutorial_completed_at IS
  'Timestamp when the interactive tutorial was completed or skipped.';
COMMENT ON COLUMN public.profile.onboarding_state IS
  'JSON blob for tutorial progress and seen contextual tip IDs.';

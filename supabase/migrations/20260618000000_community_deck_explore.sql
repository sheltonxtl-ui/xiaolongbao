-- Community deck explore: author metadata, description, saved_deck relationship, RLS updates.

-- -----------------------------------------------------------------------------
-- 1) DECK: author metadata + description
-- -----------------------------------------------------------------------------
ALTER TABLE public.deck
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS author_id uuid,
  ADD COLUMN IF NOT EXISTS author_name text NOT NULL DEFAULT '';

-- Backfill author fields from profile for existing rows
UPDATE public.deck d
SET
  author_id = d.profile_id,
  author_name = COALESCE(
    NULLIF(
      initcap(
        replace(replace(split_part(p.email, '@', 1), '.', ' '), '_', ' ')
      ),
      ''
    ),
    'Anonymous'
  )
FROM public.profile p
WHERE p.id = d.profile_id
  AND (d.author_id IS NULL OR d.author_name = '');

-- Enforce author_id after backfill
ALTER TABLE public.deck
  ALTER COLUMN author_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'deck_author_id_fkey'
      AND n.nspname = 'public'
      AND t.relname = 'deck'
  ) THEN
    ALTER TABLE public.deck
      ADD CONSTRAINT deck_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.profile (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deck_is_public ON public.deck (is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_deck_author_id ON public.deck (author_id);

-- -----------------------------------------------------------------------------
-- 2) SAVED_DECK: user-to-deck relationship (no duplication)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_deck (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profile (id) ON DELETE CASCADE,
  deck_id uuid NOT NULL REFERENCES public.deck (id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_deck_user_id_deck_id_key UNIQUE (user_id, deck_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_deck_user_id ON public.saved_deck (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_deck_deck_id ON public.saved_deck (deck_id);

-- -----------------------------------------------------------------------------
-- 3) RLS: saved_deck
-- -----------------------------------------------------------------------------
ALTER TABLE public.saved_deck ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'saved_deck'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.saved_deck', r.policyname);
  END LOOP;
END $$;

CREATE POLICY saved_deck_select_own
  ON public.saved_deck
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = saved_deck.user_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY saved_deck_insert_own
  ON public.saved_deck
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = saved_deck.user_id
        AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.deck d
      WHERE d.id = saved_deck.deck_id
        AND d.is_public = true
        AND d.profile_id <> saved_deck.user_id
    )
  );

CREATE POLICY saved_deck_delete_own
  ON public.saved_deck
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = saved_deck.user_id
        AND p.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 4) RLS: extend deck & card read access for saved decks
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS deck_select_public_or_own ON public.deck;

CREATE POLICY deck_select_public_or_own
  ON public.deck
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = deck.profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.saved_deck sd
      JOIN public.profile p ON p.id = sd.user_id
      WHERE sd.deck_id = deck.id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS card_select_public_or_own ON public.card;

CREATE POLICY card_select_public_or_own
  ON public.card
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.deck d
      WHERE d.id = card.deck_id
        AND d.is_public = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.deck d
      JOIN public.profile p ON p.id = d.profile_id
      WHERE d.id = card.deck_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.saved_deck sd
      JOIN public.profile p ON p.id = sd.user_id
      WHERE sd.deck_id = card.deck_id
        AND p.user_id = auth.uid()
    )
  );

-- saved_deck INSERT checks deck; deck/card SELECT check saved_deck — circular RLS (42P17).
-- Use SECURITY DEFINER helpers in a non-API schema to break the cycle.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_deck_saveable(p_deck_id uuid, p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.deck d
    WHERE d.id = p_deck_id
      AND d.is_public = true
      AND d.profile_id <> p_profile_id
  );
$$;

CREATE OR REPLACE FUNCTION private.user_has_saved_deck(p_deck_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.saved_deck sd
    JOIN public.profile p ON p.id = sd.user_id
    WHERE sd.deck_id = p_deck_id
      AND p.user_id = auth.uid()
  );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_deck_saveable(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.user_has_saved_deck(uuid) TO authenticated;

DROP POLICY IF EXISTS saved_deck_insert_own ON public.saved_deck;

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
    AND private.is_deck_saveable(saved_deck.deck_id, saved_deck.user_id)
  );

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
    OR private.user_has_saved_deck(deck.id)
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
    OR private.user_has_saved_deck(card.deck_id)
  );

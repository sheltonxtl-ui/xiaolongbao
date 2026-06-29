-- Authenticated users could not read cards from other users' public decks because
-- card_select_public_or_own joined public.profile, and profile RLS only allows
-- reading your own row. Match the anon policy: check deck.is_public without profile.

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

-- Safety: recursive profile↔deck policy breaks all community deck reads (42P17).
DROP POLICY IF EXISTS profile_select_public_deck_authors ON public.profile;

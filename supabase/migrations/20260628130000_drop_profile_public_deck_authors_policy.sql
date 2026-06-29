-- profile_select_public_deck_authors referenced public.deck from public.profile,
-- while deck RLS references public.profile — causing infinite recursion (42P17).
-- Author display uses deck.author_name instead; do not reintroduce a profile policy
-- that reads from deck.

DROP POLICY IF EXISTS profile_select_public_deck_authors ON public.profile;

-- System "Uncategorized" deck per user + transactional safe deck deletion.

ALTER TABLE public.deck
  ADD COLUMN IF NOT EXISTS is_system_deck boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS deck_one_system_per_profile
  ON public.deck (profile_id)
  WHERE is_system_deck = true;

CREATE OR REPLACE FUNCTION public.ensure_uncategorized_deck(p_profile_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deck_id uuid;
  v_author_name text;
BEGIN
  SELECT id INTO v_deck_id
  FROM public.deck
  WHERE profile_id = p_profile_id
    AND is_system_deck = true
  LIMIT 1;

  IF v_deck_id IS NOT NULL THEN
    RETURN v_deck_id;
  END IF;

  SELECT COALESCE(
    initcap(
      replace(
        replace(split_part(p.email, '@', 1), '.', ' '),
        '_',
        ' '
      )
    ),
    'Anonymous'
  )
  INTO v_author_name
  FROM public.profile p
  WHERE p.id = p_profile_id;

  INSERT INTO public.deck (
    profile_id,
    title,
    is_public,
    author_id,
    author_name,
    description,
    is_system_deck,
    share_anonymously
  )
  VALUES (
    p_profile_id,
    'Uncategorized',
    false,
    p_profile_id,
    COALESCE(v_author_name, 'Anonymous'),
    '',
    true,
    false
  )
  RETURNING id INTO v_deck_id;

  RETURN v_deck_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_deck(p_deck_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_profile_id uuid;
  v_deck public.deck%ROWTYPE;
  v_uncategorized_id uuid;
BEGIN
  SELECT id INTO v_caller_profile_id
  FROM public.profile
  WHERE user_id = auth.uid();

  IF v_caller_profile_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_deck
  FROM public.deck
  WHERE id = p_deck_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  IF v_deck.profile_id <> v_caller_profile_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF v_deck.is_system_deck THEN
    RAISE EXCEPTION 'CANNOT_DELETE_SYSTEM_DECK';
  END IF;

  v_uncategorized_id := public.ensure_uncategorized_deck(v_caller_profile_id);

  IF v_uncategorized_id = p_deck_id THEN
    RAISE EXCEPTION 'CANNOT_DELETE_SYSTEM_DECK';
  END IF;

  UPDATE public.card
  SET deck_id = v_uncategorized_id
  WHERE deck_id = p_deck_id;

  DELETE FROM public.deck
  WHERE id = p_deck_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  INSERT INTO public.profile (user_id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_profile_id
  FROM public.profile
  WHERE user_id = NEW.id;

  IF v_profile_id IS NOT NULL THEN
    PERFORM public.ensure_uncategorized_deck(v_profile_id);
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.profile LOOP
    PERFORM public.ensure_uncategorized_deck(r.id);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS deck_delete_own ON public.deck;

CREATE POLICY deck_delete_own
  ON public.deck
  FOR DELETE
  TO authenticated
  USING (
    NOT is_system_deck
    AND EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = deck.profile_id
        AND p.user_id = auth.uid()
    )
  );

GRANT EXECUTE ON FUNCTION public.ensure_uncategorized_deck(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_deck(uuid) TO authenticated;

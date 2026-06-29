-- Allow deck owners to choose anonymous vs named attribution when sharing publicly.

ALTER TABLE public.deck
  ADD COLUMN IF NOT EXISTS share_anonymously boolean NOT NULL DEFAULT false;

-- Existing public decks that already display as Anonymous keep that preference.
UPDATE public.deck
SET share_anonymously = true
WHERE is_public = true
  AND trim(author_name) = 'Anonymous';

-- Merge / cleanup: pgvector, deck.is_public, AI tables, RLS overhaul.
-- Safe to re-run: uses IF NOT EXISTS, extension IF NOT EXISTS, and drops policies by name from catalog.

-- -----------------------------------------------------------------------------
-- 1) CORE: pgvector
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- 2) CORE: deck.is_public
-- -----------------------------------------------------------------------------
ALTER TABLE public.deck
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- 3) NEW TABLES (public schema only if not present)
-- -----------------------------------------------------------------------------
-- source_material: owned by profile
CREATE TABLE IF NOT EXISTS public.source_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profile (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  raw_text text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- chunk: belongs to source_material; optional embedding for RAG (dimension 1536 = text-embedding-3-small / ada-002 class)
CREATE TABLE IF NOT EXISTS public.chunk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_material_id uuid NOT NULL REFERENCES public.source_material (id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  token_count integer,
  chunk_index integer NOT NULL DEFAULT 0,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- activity_log: owned by profile; optional link to source_material
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profile (id) ON DELETE CASCADE,
  source_material_id uuid REFERENCES public.source_material (id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- subscriptions: one row per profile (column stores profile.id — same as your FK to public.profile)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profile (id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'pro')),
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- embeddings: vector storage keyed by chunk (join uses source_material_id, not source_id)
CREATE TABLE IF NOT EXISTS public.embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id uuid NOT NULL REFERENCES public.chunk (id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL
);

-- If these tables already existed with an older shape, CREATE TABLE IF NOT EXISTS does nothing.
-- Add missing columns and FKs so indexes and RLS policies compile.
ALTER TABLE public.source_material
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS raw_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.chunk
  ADD COLUMN IF NOT EXISTS source_material_id uuid,
  ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS token_count integer,
  ADD COLUMN IF NOT EXISTS chunk_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.activity_log
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS source_material_id uuid,
  ADD COLUMN IF NOT EXISTS action text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'source_material_profile_id_fkey'
      AND n.nspname = 'public'
      AND t.relname = 'source_material'
  ) THEN
    ALTER TABLE public.source_material
      ADD CONSTRAINT source_material_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profile (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'chunk_source_material_id_fkey'
      AND n.nspname = 'public'
      AND t.relname = 'chunk'
  ) THEN
    ALTER TABLE public.chunk
      ADD CONSTRAINT chunk_source_material_id_fkey
      FOREIGN KEY (source_material_id) REFERENCES public.source_material (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'activity_log_profile_id_fkey'
      AND n.nspname = 'public'
      AND t.relname = 'activity_log'
  ) THEN
    ALTER TABLE public.activity_log
      ADD CONSTRAINT activity_log_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profile (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'activity_log_source_material_id_fkey'
      AND n.nspname = 'public'
      AND t.relname = 'activity_log'
  ) THEN
    ALTER TABLE public.activity_log
      ADD CONSTRAINT activity_log_source_material_id_fkey
      FOREIGN KEY (source_material_id) REFERENCES public.source_material (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_source_material_profile_id ON public.source_material (profile_id);
CREATE INDEX IF NOT EXISTS idx_chunk_source_material_id ON public.chunk (source_material_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_profile_id ON public.activity_log (profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_source_material_id ON public.activity_log (source_material_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON public.embeddings (chunk_id);

-- -----------------------------------------------------------------------------
-- 4) RLS: enable on all involved tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5) RLS: drop existing policies (avoid name / logic conflicts)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profile',
        'deck',
        'card',
        'source_material',
        'chunk',
        'activity_log',
        'subscriptions',
        'embeddings'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 6) RLS: strictly private — profile, source_material, chunk, activity_log
-- -----------------------------------------------------------------------------
-- profile: only the auth user matching profile.user_id
CREATE POLICY profile_select_own
  ON public.profile
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY profile_insert_own
  ON public.profile
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profile_update_own
  ON public.profile
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profile_delete_own
  ON public.profile
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- source_material: same profile ownership
CREATE POLICY source_material_select_own
  ON public.source_material
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = source_material.profile_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY source_material_insert_own
  ON public.source_material
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = source_material.profile_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY source_material_update_own
  ON public.source_material
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = source_material.profile_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = source_material.profile_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY source_material_delete_own
  ON public.source_material
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = source_material.profile_id
        AND p.user_id = auth.uid()
    )
  );

-- chunk: via parent source_material → profile
CREATE POLICY chunk_select_own
  ON public.chunk
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.source_material sm
      JOIN public.profile p ON p.id = sm.profile_id
      WHERE sm.id = chunk.source_material_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY chunk_insert_own
  ON public.chunk
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.source_material sm
      JOIN public.profile p ON p.id = sm.profile_id
      WHERE sm.id = chunk.source_material_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY chunk_update_own
  ON public.chunk
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.source_material sm
      JOIN public.profile p ON p.id = sm.profile_id
      WHERE sm.id = chunk.source_material_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.source_material sm
      JOIN public.profile p ON p.id = sm.profile_id
      WHERE sm.id = chunk.source_material_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY chunk_delete_own
  ON public.chunk
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.source_material sm
      JOIN public.profile p ON p.id = sm.profile_id
      WHERE sm.id = chunk.source_material_id
        AND p.user_id = auth.uid()
    )
  );

-- activity_log: profile owner; optional source_material must still belong to same user
CREATE POLICY activity_log_select_own
  ON public.activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = activity_log.profile_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY activity_log_insert_own
  ON public.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = activity_log.profile_id
        AND p.user_id = auth.uid()
    )
    AND (
      activity_log.source_material_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.source_material sm
        WHERE sm.id = activity_log.source_material_id
          AND sm.profile_id = activity_log.profile_id
      )
    )
  );

CREATE POLICY activity_log_update_own
  ON public.activity_log
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = activity_log.profile_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = activity_log.profile_id
        AND p.user_id = auth.uid()
    )
    AND (
      activity_log.source_material_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.source_material sm
        WHERE sm.id = activity_log.source_material_id
          AND sm.profile_id = activity_log.profile_id
      )
    )
  );

CREATE POLICY activity_log_delete_own
  ON public.activity_log
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = activity_log.profile_id
        AND p.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 7) RLS: deck & card — public read OR owner; writes only for owner
-- -----------------------------------------------------------------------------
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
  );

CREATE POLICY deck_insert_own
  ON public.deck
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = deck.profile_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY deck_update_own
  ON public.deck
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = deck.profile_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = deck.profile_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY deck_delete_own
  ON public.deck
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = deck.profile_id
        AND p.user_id = auth.uid()
    )
  );

-- card: visible if parent deck is public or owned; mutate only if deck owned
CREATE POLICY card_select_public_or_own
  ON public.card
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.deck d
      JOIN public.profile p ON p.id = d.profile_id
      WHERE d.id = card.deck_id
        AND (d.is_public = true OR p.user_id = auth.uid())
    )
  );

CREATE POLICY card_insert_own
  ON public.card
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.deck d
      JOIN public.profile p ON p.id = d.profile_id
      WHERE d.id = card.deck_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY card_update_own
  ON public.card
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.deck d
      JOIN public.profile p ON p.id = d.profile_id
      WHERE d.id = card.deck_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.deck d
      JOIN public.profile p ON p.id = d.profile_id
      WHERE d.id = card.deck_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY card_delete_own
  ON public.card
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.deck d
      JOIN public.profile p ON p.id = d.profile_id
      WHERE d.id = card.deck_id
        AND p.user_id = auth.uid()
    )
  );

-- Anonymous (publishable key): read-only for public decks/cards only
CREATE POLICY deck_select_public_anon
  ON public.deck
  FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY card_select_public_anon
  ON public.card
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.deck d
      WHERE d.id = card.deck_id
        AND d.is_public = true
    )
  );

-- -----------------------------------------------------------------------------
-- 7b) subscriptions & embeddings (owner-only; writes often use service_role e.g. Stripe)
-- -----------------------------------------------------------------------------
-- subscriptions.user_id = public.profile.id (FK); visibility via profile.user_id = auth.uid()
CREATE POLICY subscriptions_select_own
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile p
      WHERE p.id = subscriptions.user_id
        AND p.user_id = auth.uid()
    )
  );
-- Inserts/updates: prefer service_role (e.g. Stripe webhooks / admin)

-- embeddings: same ownership chain as chunk (fixed: chunk.source_material_id)
CREATE POLICY embeddings_select_own
  ON public.embeddings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chunk c
      JOIN public.source_material s ON s.id = c.source_material_id
      JOIN public.profile p ON p.id = s.profile_id
      WHERE c.id = embeddings.chunk_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY embeddings_insert_own
  ON public.embeddings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chunk c
      JOIN public.source_material s ON s.id = c.source_material_id
      JOIN public.profile p ON p.id = s.profile_id
      WHERE c.id = embeddings.chunk_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY embeddings_update_own
  ON public.embeddings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chunk c
      JOIN public.source_material s ON s.id = c.source_material_id
      JOIN public.profile p ON p.id = s.profile_id
      WHERE c.id = embeddings.chunk_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chunk c
      JOIN public.source_material s ON s.id = c.source_material_id
      JOIN public.profile p ON p.id = s.profile_id
      WHERE c.id = embeddings.chunk_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY embeddings_delete_own
  ON public.embeddings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chunk c
      JOIN public.source_material s ON s.id = c.source_material_id
      JOIN public.profile p ON p.id = s.profile_id
      WHERE c.id = embeddings.chunk_id
        AND p.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 8) API roles: allow PostgREST clients to use RLS-protected tables
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_material TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chunk TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embeddings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_material TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chunk TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embeddings TO service_role;

GRANT SELECT ON public.deck TO anon;
GRANT SELECT ON public.card TO anon;

-- -----------------------------------------------------------------------------
-- 9) SCHEMA NOTE (manual if needed)
-- If legacy tables live outside public, move them explicitly, e.g.:
--   ALTER TABLE other_schema.chunk SET SCHEMA public;
-- (Not automated here — verify with:
--   SELECT schemaname, tablename FROM pg_tables WHERE tablename IN (...); )
-- -----------------------------------------------------------------------------

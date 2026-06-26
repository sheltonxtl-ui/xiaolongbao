"use server";

import {
  createDeckWithCards,
  saveDeckToCollection,
  updateDeckVisibility,
} from "@/lib/decks/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export type FinalizeDeckResult =
  | { ok: true; deckId: string }
  | { ok: false; error: string };

export type SaveDeckResult =
  | { ok: true; alreadySaved: boolean }
  | { ok: false; error: string };

export type UpdateDeckVisibilityResult =
  | { ok: true; isPublic: boolean }
  | { ok: false; error: string };

export async function finalizeGeneratedDeckAction(
  title: string,
  cards: { question: string; answer: string }[],
): Promise<FinalizeDeckResult> {
  const { isConfigured } = getSupabasePublicEnv();
  const supabase = isConfigured ? await createServerSupabaseClient() : undefined;
  const result = await createDeckWithCards(title, cards, supabase);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, deckId: result.data.deckId };
}

export async function updateDeckVisibilityAction(
  deckId: string,
  isPublic: boolean,
): Promise<UpdateDeckVisibilityResult> {
  const { isConfigured } = getSupabasePublicEnv();
  const supabase = isConfigured ? await createServerSupabaseClient() : undefined;
  const result = await updateDeckVisibility(deckId, isPublic, supabase);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, isPublic: result.data.isPublic };
}

export async function saveDeckAction(deckId: string): Promise<SaveDeckResult> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return { ok: true, alreadySaved: false };
  }

  const supabase = await createServerSupabaseClient();
  const result = await saveDeckToCollection(deckId, supabase);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, alreadySaved: result.data.alreadySaved };
}

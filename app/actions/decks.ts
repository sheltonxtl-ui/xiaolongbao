"use server";

import {
  createDeckWithCards,
  saveDeckToCollection,
  updateDeckShareAnonymously,
  updateDeckVisibility,
  type DeckRepoResult,
} from "@/lib/decks/repository";
import {
  fetchExploreDeckPreviewServer,
  fetchExploreDecksServer,
  fetchDeckStudyServer,
} from "@/lib/decks/explore-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";
import type { ExploreDeck, ExploreDeckPreview, DeckTerm } from "@/lib/decks/types";

export type FinalizeDeckResult =
  | { ok: true; deckId: string }
  | { ok: false; error: string };

export type SaveDeckResult =
  | { ok: true; alreadySaved: boolean }
  | { ok: false; error: string };

export type UpdateDeckVisibilityResult =
  | { ok: true; isPublic: boolean; shareAnonymously: boolean }
  | { ok: false; error: string };

export type UpdateDeckShareAnonymouslyResult =
  | { ok: true; shareAnonymously: boolean }
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
  shareAnonymously = false,
): Promise<UpdateDeckVisibilityResult> {
  const { isConfigured } = getSupabasePublicEnv();
  const supabase = isConfigured ? await createServerSupabaseClient() : undefined;
  const result = await updateDeckVisibility(deckId, isPublic, shareAnonymously, supabase);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return {
    ok: true,
    isPublic: result.data.isPublic,
    shareAnonymously: result.data.shareAnonymously,
  };
}

export async function updateDeckShareAnonymouslyAction(
  deckId: string,
  shareAnonymously: boolean,
): Promise<UpdateDeckShareAnonymouslyResult> {
  const { isConfigured } = getSupabasePublicEnv();
  const supabase = isConfigured ? await createServerSupabaseClient() : undefined;
  const result = await updateDeckShareAnonymously(deckId, shareAnonymously, supabase);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, shareAnonymously: result.data.shareAnonymously };
}

export async function fetchExploreDecksAction(): Promise<DeckRepoResult<ExploreDeck[]>> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    const { fetchExploreDecks } = await import("@/lib/decks/repository");
    return fetchExploreDecks();
  }

  return fetchExploreDecksServer();
}

export async function fetchExploreDeckPreviewAction(
  deckId: string,
): Promise<DeckRepoResult<ExploreDeckPreview>> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    const { fetchExploreDeckPreview } = await import("@/lib/decks/repository");
    return fetchExploreDeckPreview(deckId);
  }

  return fetchExploreDeckPreviewServer(deckId);
}

export async function fetchDeckStudyAction(
  deckId: string,
): Promise<DeckRepoResult<{ deckId: string; deckTitle: string; terms: DeckTerm[] }>> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    const { fetchDeckDetail } = await import("@/lib/decks/repository");
    const result = await fetchDeckDetail(deckId);
    if (!result.ok) return result;
    return {
      ok: true,
      data: {
        deckId: result.data.deck.id,
        deckTitle: result.data.deck.title,
        terms: result.data.terms,
      },
    };
  }

  return fetchDeckStudyServer(deckId);
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

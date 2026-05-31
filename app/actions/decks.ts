"use server";

import { createDeckWithCards } from "@/lib/decks/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export type FinalizeDeckResult =
  | { ok: true; deckId: string }
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

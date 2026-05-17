import type { SupabaseClient } from "@supabase/supabase-js";
import type { Deck } from "@/components/decks/DecksLibrary";
import { mockDecks, getMockDeck, getMockDeckTerms } from "@/lib/decks-mock-data";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.generated";
import type { DeckDetail, DeckTerm } from "./types";

export type DeckRepoErrorCode =
  | "NOT_CONFIGURED"
  | "NOT_AUTHENTICATED"
  | "NOT_FOUND"
  | "UNKNOWN";

export type DeckRepoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: DeckRepoErrorCode };

type DbClient = SupabaseClient<Database>;

function isLocalCardId(id: string): boolean {
  return id.includes("_new_");
}

function creatorLabel(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function topicFromTitle(title: string): string {
  const beforeColon = title.split(":")[0]?.trim();
  return beforeColon && beforeColon.length < 48 ? beforeColon : "General";
}

function mapDeckRow(
  row: {
    id: string;
    title: string;
    is_public: boolean;
    card: { id: string }[] | null;
  },
  profileEmail: string,
  index: number,
): Deck {
  const cardCount = row.card?.length ?? 0;
  return {
    id: row.id,
    title: row.title,
    topic: topicFromTitle(row.title),
    creator: creatorLabel(profileEmail),
    terms: cardCount,
    cardsInside: cardCount,
    updatedAt: "Recently",
    updatedRank: index,
    visibility: row.is_public ? "Public" : "Private",
    mastery: 0,
  };
}

function mapCardRow(row: {
  id: string;
  front_question: string;
  back_answer: string;
}): DeckTerm {
  return {
    id: row.id,
    question: row.front_question,
    answer: row.back_answer,
  };
}

async function getClient(): Promise<DeckRepoResult<DbClient>> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return {
      ok: false,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and your anon key to .env.local.",
      code: "NOT_CONFIGURED",
    };
  }
  try {
    return { ok: true, data: createBrowserSupabaseClient() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not connect to Supabase.",
      code: "UNKNOWN",
    };
  }
}

async function getCurrentProfile(
  supabase: DbClient,
): Promise<DeckRepoResult<{ id: string; email: string }>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      error: "Sign in to view and manage your decks.",
      code: "NOT_AUTHENTICATED",
    };
  }

  const { data: profile, error } = await supabase
    .from("profile")
    .select("id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      ok: false,
      error: error?.message ?? "Profile not found for this account.",
      code: "UNKNOWN",
    };
  }

  return { ok: true, data: profile };
}

export async function fetchUserDecks(): Promise<DeckRepoResult<Deck[]>> {
  const clientResult = await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      return { ok: true, data: mockDecks };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const profileResult = await getCurrentProfile(supabase);
  if (!profileResult.ok) return profileResult;

  const { data, error } = await supabase
    .from("deck")
    .select("id, title, is_public, card ( id )")
    .eq("profile_id", profileResult.data.id)
    .order("title", { ascending: true });

  if (error) {
    return { ok: false, error: error.message, code: "UNKNOWN" };
  }

  const decks = (data ?? []).map((row, index) =>
    mapDeckRow(
      {
        id: row.id,
        title: row.title,
        is_public: row.is_public,
        card: row.card as { id: string }[] | null,
      },
      profileResult.data.email,
      index,
    ),
  );

  return { ok: true, data: decks };
}

export async function fetchDeckDetail(deckId: string): Promise<
  DeckRepoResult<{ deck: DeckDetail; terms: DeckTerm[] }>
> {
  const clientResult = await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      const mock = getMockDeck(deckId);
      if (!mock) {
        return { ok: false, error: "Deck not found.", code: "NOT_FOUND" };
      }
      return {
        ok: true,
        data: {
          deck: { id: mock.id, title: mock.title, isPublic: mock.visibility === "Public" },
          terms: getMockDeckTerms(deckId),
        },
      };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const profileResult = await getCurrentProfile(supabase);
  if (!profileResult.ok) return profileResult;

  const { data: deckRow, error: deckError } = await supabase
    .from("deck")
    .select("id, title, is_public")
    .eq("id", deckId)
    .eq("profile_id", profileResult.data.id)
    .maybeSingle();

  if (deckError) {
    return { ok: false, error: deckError.message, code: "UNKNOWN" };
  }
  if (!deckRow) {
    return { ok: false, error: "Deck not found or you do not have access.", code: "NOT_FOUND" };
  }

  const { data: cards, error: cardsError } = await supabase
    .from("card")
    .select("id, front_question, back_answer, order")
    .eq("deck_id", deckId)
    .order("order", { ascending: true, nullsFirst: false });

  if (cardsError) {
    return { ok: false, error: cardsError.message, code: "UNKNOWN" };
  }

  return {
    ok: true,
    data: {
      deck: {
        id: deckRow.id,
        title: deckRow.title,
        isPublic: deckRow.is_public,
      },
      terms: (cards ?? []).map(mapCardRow),
    },
  };
}

export async function createCard(
  deckId: string,
  payload: { question: string; answer: string; order: number },
): Promise<DeckRepoResult<DeckTerm>> {
  const clientResult = await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      return {
        ok: true,
        data: {
          id: `t_${deckId}_new_${Date.now()}`,
          question: payload.question,
          answer: payload.answer,
        },
      };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const profileResult = await getCurrentProfile(supabase);
  if (!profileResult.ok) return profileResult;

  const owned = await supabase
    .from("deck")
    .select("id")
    .eq("id", deckId)
    .eq("profile_id", profileResult.data.id)
    .maybeSingle();

  if (!owned.data) {
    return { ok: false, error: "Deck not found or you do not have access.", code: "NOT_FOUND" };
  }

  const { data, error } = await supabase
    .from("card")
    .insert({
      deck_id: deckId,
      front_question: payload.question,
      back_answer: payload.answer,
      order: payload.order,
    })
    .select("id, front_question, back_answer")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create card.", code: "UNKNOWN" };
  }

  return { ok: true, data: mapCardRow(data) };
}

export async function updateCard(
  cardId: string,
  payload: { question: string; answer: string },
): Promise<DeckRepoResult<DeckTerm>> {
  if (isLocalCardId(cardId)) {
    return {
      ok: true,
      data: { id: cardId, question: payload.question, answer: payload.answer },
    };
  }

  const clientResult = await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      return {
        ok: true,
        data: { id: cardId, question: payload.question, answer: payload.answer },
      };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const { data, error } = await supabase
    .from("card")
    .update({
      front_question: payload.question,
      back_answer: payload.answer,
    })
    .eq("id", cardId)
    .select("id, front_question, back_answer")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update card.", code: "UNKNOWN" };
  }

  return { ok: true, data: mapCardRow(data) };
}

export async function deleteCard(cardId: string): Promise<DeckRepoResult<null>> {
  if (isLocalCardId(cardId)) {
    return { ok: true, data: null };
  }

  const clientResult = await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      return { ok: true, data: null };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const { error } = await supabase.from("card").delete().eq("id", cardId);

  if (error) {
    return { ok: false, error: error.message, code: "UNKNOWN" };
  }

  return { ok: true, data: null };
}

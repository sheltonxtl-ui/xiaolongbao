import type { SupabaseClient } from "@supabase/supabase-js";
import type { Deck } from "@/components/decks/DecksLibrary";
import { mockDecks, getMockDeck, getMockDeckTerms } from "@/lib/decks-mock-data";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.generated";
import type { ExploreDeck, ExploreDeckPreview, DeckDetail, DeckTerm } from "./types";

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

function isMissingSchemaError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function authorNameFromProfile(profile: { email: string } | null | undefined): string {
  if (!profile?.email) return "Anonymous";
  return creatorLabel(profile.email);
}

function mapDeckRow(
  row: {
    id: string;
    title: string;
    is_public: boolean;
    author_name?: string;
    card: { id: string }[] | null;
  },
  profileEmail: string,
  index: number,
  options?: { isCommunityDeck?: boolean; authorName?: string },
): Deck {
  const cardCount = row.card?.length ?? 0;
  const authorLabel = options?.isCommunityDeck
    ? (options.authorName ?? row.author_name ?? "Unknown")
    : creatorLabel(profileEmail);
  return {
    id: row.id,
    title: row.title,
    topic: topicFromTitle(row.title),
    creator: authorLabel,
    terms: cardCount,
    cardsInside: cardCount,
    updatedAt: "Recently",
    updatedRank: index,
    visibility: row.is_public ? "Public" : "Private",
    mastery: 0,
    isCommunityDeck: options?.isCommunityDeck ?? false,
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

  const { data: ownedRows, error: ownedError } = await supabase
    .from("deck")
    .select("id, title, is_public, card ( id )")
    .eq("profile_id", profileResult.data.id)
    .order("title", { ascending: true });

  if (ownedError) {
    return { ok: false, error: ownedError.message, code: "UNKNOWN" };
  }

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_deck")
    .select(
      "deck_id, deck:deck_id ( id, title, is_public, card ( id ), profile!deck_profile_id_fkey ( email ) )",
    )
    .eq("user_id", profileResult.data.id);

  if (savedError && !isMissingSchemaError(savedError)) {
    return { ok: false, error: savedError.message, code: "UNKNOWN" };
  }

  const ownedIds = new Set((ownedRows ?? []).map((row) => row.id));
  const ownedDecks = (ownedRows ?? []).map((row, index) =>
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

  const savedDecks = (savedRows ?? [])
    .filter((row) => {
      const deck = row.deck as {
        id: string;
      } | null;
      return deck && !ownedIds.has(deck.id);
    })
    .map((row, index) => {
      const deck = row.deck as {
        id: string;
        title: string;
        is_public: boolean;
        card: { id: string }[] | null;
        profile: { email: string } | null;
      };
      return mapDeckRow(
        deck,
        profileResult.data.email,
        ownedDecks.length + index,
        {
          isCommunityDeck: true,
          authorName: authorNameFromProfile(deck.profile),
        },
      );
    });

  return { ok: true, data: [...ownedDecks, ...savedDecks] };
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
    .select("id, title, is_public, profile_id, profile!deck_profile_id_fkey ( email )")
    .eq("id", deckId)
    .maybeSingle();

  if (deckError) {
    return { ok: false, error: deckError.message, code: "UNKNOWN" };
  }
  if (!deckRow) {
    return { ok: false, error: "Deck not found or you do not have access.", code: "NOT_FOUND" };
  }

  const isOwner = deckRow.profile_id === profileResult.data.id;
  if (!isOwner) {
    const { data: savedRow, error: savedLookupError } = await supabase
      .from("saved_deck")
      .select("id")
      .eq("user_id", profileResult.data.id)
      .eq("deck_id", deckId)
      .maybeSingle();

    if (savedLookupError && !isMissingSchemaError(savedLookupError)) {
      return { ok: false, error: savedLookupError.message, code: "UNKNOWN" };
    }

    if (!savedRow) {
      return { ok: false, error: "Deck not found or you do not have access.", code: "NOT_FOUND" };
    }
  }

  const { data: cards, error: cardsError } = await supabase
    .from("card")
    .select("id, front_question, back_answer, order")
    .eq("deck_id", deckId)
    .order("order", { ascending: true, nullsFirst: false });

  if (cardsError) {
    return { ok: false, error: cardsError.message, code: "UNKNOWN" };
  }

  const deckProfile = deckRow.profile as { email: string } | null;

  return {
    ok: true,
    data: {
      deck: {
        id: deckRow.id,
        title: deckRow.title,
        isPublic: deckRow.is_public,
        authorName: authorNameFromProfile(deckProfile),
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

export async function createDeckWithCards(
  title: string,
  cards: { question: string; answer: string }[],
  supabaseOverride?: DbClient,
): Promise<DeckRepoResult<{ deckId: string }>> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { ok: false, error: "Deck title is required.", code: "UNKNOWN" };
  }

  if (cards.length === 0) {
    return { ok: false, error: "Add at least one card before saving.", code: "UNKNOWN" };
  }

  const clientResult = supabaseOverride
    ? ({ ok: true as const, data: supabaseOverride })
    : await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      return {
        ok: true,
        data: { deckId: `deck_${Date.now()}` },
      };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const profileResult = await getCurrentProfile(supabase);
  if (!profileResult.ok) return profileResult;

  const authorName = creatorLabel(profileResult.data.email);
  const extendedInsert = {
    title: trimmedTitle,
    profile_id: profileResult.data.id,
    is_public: false,
    author_id: profileResult.data.id,
    author_name: authorName,
    description: "",
  };
  const basicInsert = {
    title: trimmedTitle,
    profile_id: profileResult.data.id,
    is_public: false,
  };

  let deckRow: { id: string } | null = null;
  let deckError: { message: string } | null = null;

  const extendedResult = await supabase
    .from("deck")
    .insert(extendedInsert)
    .select("id")
    .single();

  if (extendedResult.error && isMissingSchemaError(extendedResult.error)) {
    const basicResult = await supabase
      .from("deck")
      .insert(basicInsert as never)
      .select("id")
      .single();
    deckRow = basicResult.data;
    deckError = basicResult.error;
  } else {
    deckRow = extendedResult.data;
    deckError = extendedResult.error;
  }

  if (deckError || !deckRow) {
    return {
      ok: false,
      error: deckError?.message ?? "Could not create deck.",
      code: "UNKNOWN",
    };
  }

  const { error: cardsError } = await supabase.from("card").insert(
    cards.map((card, index) => ({
      deck_id: deckRow.id,
      front_question: card.question,
      back_answer: card.answer,
      order: index,
    })),
  );

  if (cardsError) {
    return { ok: false, error: cardsError.message, code: "UNKNOWN" };
  }

  return { ok: true, data: { deckId: deckRow.id } };
}

export async function updateDeckVisibility(
  deckId: string,
  isPublic: boolean,
  supabaseOverride?: DbClient,
): Promise<DeckRepoResult<{ isPublic: boolean }>> {
  const clientResult = supabaseOverride
    ? ({ ok: true as const, data: supabaseOverride })
    : await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      return { ok: true, data: { isPublic } };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const profileResult = await getCurrentProfile(supabase);
  if (!profileResult.ok) return profileResult;

  const { data, error } = await supabase
    .from("deck")
    .update({ is_public: isPublic })
    .eq("id", deckId)
    .eq("profile_id", profileResult.data.id)
    .select("is_public")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, code: "UNKNOWN" };
  }
  if (!data) {
    return { ok: false, error: "Deck not found or you do not have access.", code: "NOT_FOUND" };
  }

  return { ok: true, data: { isPublic: data.is_public } };
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

export async function fetchExploreDecks(): Promise<DeckRepoResult<ExploreDeck[]>> {
  const clientResult = await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      const publicDecks = mockDecks
        .filter((d) => d.visibility === "Public")
        .map((d) => ({
          id: d.id,
          title: d.title,
          authorName: d.creator,
          cardCount: d.cardsInside,
          isOwnDeck: false,
        }));
      return { ok: true, data: publicDecks };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const profileResult = await getCurrentProfile(supabase);
  if (!profileResult.ok) return profileResult;

  const { data, error } = await supabase
    .from("deck")
    .select("id, title, profile_id, card ( id ), profile!deck_profile_id_fkey ( email )")
    .eq("is_public", true)
    .order("title", { ascending: true });

  if (error) {
    return { ok: false, error: error.message, code: "UNKNOWN" };
  }

  const decks: ExploreDeck[] = (data ?? []).map((row) => {
    const isOwnDeck = row.profile_id === profileResult.data.id;
    return {
      id: row.id,
      title: row.title,
      authorName: isOwnDeck
        ? "You"
        : authorNameFromProfile(row.profile as { email: string } | null),
      cardCount: (row.card as { id: string }[] | null)?.length ?? 0,
      isOwnDeck,
    };
  });

  return { ok: true, data: decks };
}

export async function fetchExploreDeckPreview(
  deckId: string,
  previewLimit = 5,
): Promise<DeckRepoResult<ExploreDeckPreview>> {
  const clientResult = await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      const mock = getMockDeck(deckId);
      if (!mock || mock.visibility !== "Public") {
        return { ok: false, error: "Deck not found.", code: "NOT_FOUND" };
      }
      const terms = getMockDeckTerms(deckId);
      return {
        ok: true,
        data: {
          id: mock.id,
          title: mock.title,
          description: `A community deck on ${mock.topic}.`,
          authorName: mock.creator,
          cardCount: terms.length,
          previewCards: terms.slice(0, previewLimit),
          isSaved: false,
          isOwnDeck: false,
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
    .select("id, title, is_public, profile_id, card ( id ), profile!deck_profile_id_fkey ( email )")
    .eq("id", deckId)
    .eq("is_public", true)
    .maybeSingle();

  if (deckError) {
    return { ok: false, error: deckError.message, code: "UNKNOWN" };
  }
  if (!deckRow) {
    return { ok: false, error: "Public deck not found.", code: "NOT_FOUND" };
  }

  const isOwnDeck = deckRow.profile_id === profileResult.data.id;

  const { data: cards, error: cardsError } = await supabase
    .from("card")
    .select("id, front_question, back_answer, order")
    .eq("deck_id", deckId)
    .order("order", { ascending: true, nullsFirst: false })
    .limit(previewLimit);

  if (cardsError) {
    return { ok: false, error: cardsError.message, code: "UNKNOWN" };
  }

  let isSaved = false;
  const { data: savedRow, error: savedLookupError } = await supabase
    .from("saved_deck")
    .select("id")
    .eq("user_id", profileResult.data.id)
    .eq("deck_id", deckId)
    .maybeSingle();

  if (savedLookupError && !isMissingSchemaError(savedLookupError)) {
    return { ok: false, error: savedLookupError.message, code: "UNKNOWN" };
  }

  isSaved = Boolean(savedRow);

  const allCards = deckRow.card as { id: string }[] | null;
  const deckProfile = deckRow.profile as { email: string } | null;

  return {
    ok: true,
    data: {
      id: deckRow.id,
      title: deckRow.title,
      description: "No description provided.",
      authorName: isOwnDeck ? "You" : authorNameFromProfile(deckProfile),
      cardCount: allCards?.length ?? 0,
      previewCards: (cards ?? []).map(mapCardRow),
      isSaved: isOwnDeck ? false : isSaved,
      isOwnDeck,
    },
  };
}

export async function saveDeckToCollection(
  deckId: string,
  supabaseOverride?: DbClient,
): Promise<DeckRepoResult<{ alreadySaved: boolean }>> {
  const clientResult = supabaseOverride
    ? ({ ok: true as const, data: supabaseOverride })
    : await getClient();
  if (!clientResult.ok) {
    if (clientResult.code === "NOT_CONFIGURED") {
      return { ok: true, data: { alreadySaved: false } };
    }
    return clientResult;
  }

  const supabase = clientResult.data;
  const profileResult = await getCurrentProfile(supabase);
  if (!profileResult.ok) return profileResult;

  const { data: existing, error: existingError } = await supabase
    .from("saved_deck")
    .select("id")
    .eq("user_id", profileResult.data.id)
    .eq("deck_id", deckId)
    .maybeSingle();

  if (existingError) {
    if (isMissingSchemaError(existingError)) {
      return {
        ok: false,
        error: "Community deck saving is not available yet. Apply the latest database migration.",
        code: "UNKNOWN",
      };
    }
    return { ok: false, error: existingError.message, code: "UNKNOWN" };
  }

  if (existing) {
    return { ok: true, data: { alreadySaved: true } };
  }

  const { data: deckRow } = await supabase
    .from("deck")
    .select("id, is_public, profile_id")
    .eq("id", deckId)
    .eq("is_public", true)
    .neq("profile_id", profileResult.data.id)
    .maybeSingle();

  if (!deckRow) {
    return { ok: false, error: "This deck is not available to save.", code: "NOT_FOUND" };
  }

  const { error } = await supabase.from("saved_deck").insert({
    user_id: profileResult.data.id,
    deck_id: deckId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true, data: { alreadySaved: true } };
    }
    return { ok: false, error: error.message, code: "UNKNOWN" };
  }

  return { ok: true, data: { alreadySaved: false } };
}

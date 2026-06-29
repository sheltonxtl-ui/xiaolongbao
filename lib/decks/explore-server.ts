import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOrCreateProfileForUser,
  type UserProfile,
} from "@/lib/profile/get-or-create-profile";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import type { DeckRepoResult } from "@/lib/decks/repository";
import type { ExploreDeck, ExploreDeckPreview, DeckTerm } from "@/lib/decks/types";

type DbClient = SupabaseClient<Database>;

type PublicDeckExploreRow = {
  id: string;
  title: string;
  profile_id: string;
  author_name?: string;
  description?: string;
  card: { id: string }[] | null;
};

function creatorLabel(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function exploreAuthorName(
  row: Pick<PublicDeckExploreRow, "author_name">,
  isOwnDeck: boolean,
): string {
  if (isOwnDeck) return "You";
  const storedAuthor = row.author_name?.trim();
  if (storedAuthor) return storedAuthor;
  return "Anonymous";
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

async function getOptionalCurrentProfile(
  supabase: DbClient,
): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { profile } = await getOrCreateProfileForUser(supabase, user);
  return profile;
}

async function fetchPublicDeckExploreRows(
  supabase: DbClient,
): Promise<{ rows: PublicDeckExploreRow[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("deck")
    .select("id, title, profile_id, author_name, description, card ( id )")
    .eq("is_public", true)
    .order("title", { ascending: true });

  if (error) {
    return { rows: null, error: error.message };
  }

  return { rows: (data ?? []) as PublicDeckExploreRow[], error: null };
}

export async function fetchExploreDecksServer(): Promise<DeckRepoResult<ExploreDeck[]>> {
  const sessionSupabase = await createServerSupabaseClient();
  const catalogSupabase = createAdminSupabaseClient();

  const currentProfile = await getOptionalCurrentProfile(sessionSupabase);
  const currentProfileId = currentProfile?.id ?? null;
  const { rows, error } = await fetchPublicDeckExploreRows(catalogSupabase);

  if (error) {
    return { ok: false, error, code: "UNKNOWN" };
  }

  const decks: ExploreDeck[] = (rows ?? []).map((row) => {
    const isOwnDeck = currentProfileId ? row.profile_id === currentProfileId : false;
    return {
      id: row.id,
      title: row.title,
      authorName: exploreAuthorName(row, isOwnDeck),
      cardCount: row.card?.length ?? 0,
      isOwnDeck,
    };
  });

  return { ok: true, data: decks };
}

export async function fetchExploreDeckPreviewServer(
  deckId: string,
  previewLimit = 5,
): Promise<DeckRepoResult<ExploreDeckPreview>> {
  const sessionSupabase = await createServerSupabaseClient();
  const catalogSupabase = createAdminSupabaseClient();
  const currentProfile = await getOptionalCurrentProfile(sessionSupabase);
  const currentProfileId = currentProfile?.id ?? null;

  const { data: deckRow, error: deckError } = await catalogSupabase
    .from("deck")
    .select("id, title, is_public, profile_id, author_name, description, card ( id )")
    .eq("id", deckId)
    .eq("is_public", true)
    .maybeSingle();

  if (deckError) {
    return { ok: false, error: deckError.message, code: "UNKNOWN" };
  }
  if (!deckRow) {
    return { ok: false, error: "Public deck not found.", code: "NOT_FOUND" };
  }

  const typedDeckRow = deckRow as PublicDeckExploreRow & { is_public: boolean };
  const isOwnDeck = currentProfileId ? typedDeckRow.profile_id === currentProfileId : false;

  const { data: cards, error: cardsError } = await catalogSupabase
    .from("card")
    .select("id, front_question, back_answer, order")
    .eq("deck_id", deckId)
    .order("order", { ascending: true, nullsFirst: false })
    .limit(previewLimit);

  if (cardsError) {
    return { ok: false, error: cardsError.message, code: "UNKNOWN" };
  }

  let isSaved = false;
  if (currentProfileId) {
    const { data: savedRow, error: savedLookupError } = await sessionSupabase
      .from("saved_deck")
      .select("id")
      .eq("user_id", currentProfileId)
      .eq("deck_id", deckId)
      .maybeSingle();

    if (savedLookupError) {
      return { ok: false, error: savedLookupError.message, code: "UNKNOWN" };
    }

    isSaved = Boolean(savedRow);
  }

  return {
    ok: true,
    data: {
      id: typedDeckRow.id,
      title: typedDeckRow.title,
      description: typedDeckRow.description?.trim() || "No description provided.",
      authorName: exploreAuthorName(typedDeckRow, isOwnDeck),
      cardCount: typedDeckRow.card?.length ?? 0,
      previewCards: (cards ?? []).map(mapCardRow),
      isSaved: isOwnDeck ? false : isSaved,
      isOwnDeck,
    },
  };
}

type AccessibleDeck = {
  id: string;
  title: string;
  is_public: boolean;
  profile_id: string;
};

async function resolveAccessibleDeck(
  deckId: string,
  sessionSupabase: DbClient,
  catalogSupabase: DbClient,
  currentProfile: UserProfile,
): Promise<
  | { ok: true; deck: AccessibleDeck; readClient: DbClient }
  | { ok: false; error: string; code: "NOT_FOUND" }
> {
  const { data: deckRow, error: deckError } = await catalogSupabase
    .from("deck")
    .select("id, title, is_public, profile_id")
    .eq("id", deckId)
    .maybeSingle();

  if (deckError || !deckRow) {
    return { ok: false, error: "Deck not found.", code: "NOT_FOUND" };
  }

  const isOwner = deckRow.profile_id === currentProfile.id;
  if (isOwner) {
    return { ok: true, deck: deckRow, readClient: sessionSupabase };
  }

  if (deckRow.is_public) {
    return { ok: true, deck: deckRow, readClient: catalogSupabase };
  }

  const { data: savedRow } = await sessionSupabase
    .from("saved_deck")
    .select("id")
    .eq("user_id", currentProfile.id)
    .eq("deck_id", deckId)
    .maybeSingle();

  if (!savedRow) {
    return {
      ok: false,
      error: "Deck not found or you do not have access.",
      code: "NOT_FOUND",
    };
  }

  return { ok: true, deck: deckRow, readClient: catalogSupabase };
}

export async function fetchPublicDeckCardsServer(
  deckId: string,
): Promise<DeckRepoResult<DeckTerm[]>> {
  const sessionSupabase = await createServerSupabaseClient();
  const catalogSupabase = createAdminSupabaseClient();
  const currentProfile = await getOptionalCurrentProfile(sessionSupabase);

  if (!currentProfile) {
    return {
      ok: false,
      error: "Sign in to view and manage your decks.",
      code: "NOT_AUTHENTICATED",
    };
  }

  const access = await resolveAccessibleDeck(
    deckId,
    sessionSupabase,
    catalogSupabase,
    currentProfile,
  );
  if (!access.ok) {
    return access;
  }

  const { data: cards, error: cardsError } = await access.readClient
    .from("card")
    .select("id, front_question, back_answer, order")
    .eq("deck_id", deckId)
    .order("order", { ascending: true, nullsFirst: false });

  if (cardsError) {
    return { ok: false, error: cardsError.message, code: "UNKNOWN" };
  }

  return { ok: true, data: (cards ?? []).map(mapCardRow) };
}

export async function fetchDeckStudyServer(
  deckId: string,
): Promise<
  DeckRepoResult<{ deckId: string; deckTitle: string; terms: DeckTerm[] }>
> {
  const sessionSupabase = await createServerSupabaseClient();
  const catalogSupabase = createAdminSupabaseClient();
  const currentProfile = await getOptionalCurrentProfile(sessionSupabase);

  if (!currentProfile) {
    return {
      ok: false,
      error: "Sign in to view and manage your decks.",
      code: "NOT_AUTHENTICATED",
    };
  }

  const access = await resolveAccessibleDeck(
    deckId,
    sessionSupabase,
    catalogSupabase,
    currentProfile,
  );
  if (!access.ok) {
    return access;
  }

  const { data: cards, error: cardsError } = await access.readClient
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
      deckId: access.deck.id,
      deckTitle: access.deck.title,
      terms: (cards ?? []).map(mapCardRow),
    },
  };
}

export function authorNameFromEmail(email: string | null | undefined): string {
  if (!email) return "Unknown";
  return creatorLabel(email);
}

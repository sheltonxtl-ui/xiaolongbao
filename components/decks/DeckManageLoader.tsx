"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  DeckErrorPanel,
  DeckLoadingPanel,
} from "@/components/decks/DeckAsyncState";
import { DeckCardManagement } from "@/components/decks/DeckCardManagement";
import { fetchDeckDetail } from "@/lib/decks/repository";
import type { DeckTerm } from "@/lib/decks/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; code?: string }
  | { status: "ready"; deckId: string; deckTitle: string; isPublic: boolean; terms: DeckTerm[] };

export function DeckManageLoader({ deckId }: { deckId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await fetchDeckDetail(deckId);
    if (!result.ok) {
      setState({ status: "error", message: result.error, code: result.code });
      return;
    }
    setState({
      status: "ready",
      deckId: result.data.deck.id,
      deckTitle: result.data.deck.title,
      isPublic: result.data.deck.isPublic,
      terms: result.data.terms,
    });
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <DeckLoadingPanel
        headingId="deck-manage-loading-heading"
        title="Loading deck"
        description="Fetching cards for this deck."
      />
    );
  }

  if (state.status === "error") {
    return (
      <DeckErrorPanel
        headingId="deck-manage-error-heading"
        title={
          state.code === "NOT_FOUND"
            ? "Deck not found"
            : state.code === "NOT_AUTHENTICATED"
              ? "Sign in required"
              : "Could not load deck"
        }
        message={state.message}
        onRetry={state.code === "NOT_AUTHENTICATED" ? undefined : load}
        retryLabel="Reload deck"
        actions={
          state.code === "NOT_AUTHENTICATED" ? (
            <Button color="indigo" href="/sign-in">
              Sign in
            </Button>
          ) : state.code === "NOT_FOUND" ? (
            <Button outline href="/decks">
              Back to decks
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <DeckCardManagement
      deckId={state.deckId}
      deckTitle={state.deckTitle}
      isPublic={state.isPublic}
      terms={state.terms}
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  DeckErrorPanel,
  DeckLoadingPanel,
} from "@/components/decks/DeckAsyncState";
import { DeckStudyMode } from "@/components/decks/DeckStudyMode";
import { fetchDeckStudyAction } from "@/app/actions/decks";
import type { DeckTerm } from "@/lib/decks/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; code?: string }
  | { status: "ready"; deckId: string; deckTitle: string; terms: DeckTerm[] };

export function DeckStudyLoader({ deckId }: { deckId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await fetchDeckStudyAction(deckId);
    if (!result.ok) {
      setState({ status: "error", message: result.error, code: result.code });
      return;
    }
    setState({
      status: "ready",
      deckId: result.data.deckId,
      deckTitle: result.data.deckTitle,
      terms: result.data.terms,
    });
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <DeckLoadingPanel
        headingId="deck-study-loading-heading"
        title="Loading study session"
        description="Fetching cards for this deck."
      />
    );
  }

  if (state.status === "error") {
    return (
      <DeckErrorPanel
        headingId="deck-study-error-heading"
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
    <DeckStudyMode
      deckId={state.deckId}
      deckTitle={state.deckTitle}
      terms={state.terms}
    />
  );
}

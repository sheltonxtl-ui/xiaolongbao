"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  DeckErrorPanel,
  DeckLoadingPanel,
} from "@/components/decks/DeckAsyncState";
import { ExploreLibrary } from "@/components/decks/ExploreLibrary";
import { fetchExploreDecks } from "@/lib/decks/repository";
import type { ExploreDeck } from "@/lib/decks/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; code?: string }
  | { status: "ready"; decks: ExploreDeck[] };

export function ExploreLibraryLoader() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await fetchExploreDecks();
    if (!result.ok) {
      setState({ status: "error", message: result.error, code: result.code });
      return;
    }
    setState({ status: "ready", decks: result.data });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <DeckLoadingPanel
        headingId="explore-loading-heading"
        title="Loading community decks"
        description="Fetching public decks shared by the community."
        className="mt-8"
      />
    );
  }

  if (state.status === "error") {
    return (
      <DeckErrorPanel
        headingId="explore-error-heading"
        title={
          state.code === "NOT_AUTHENTICATED"
            ? "Sign in required"
            : "Could not load community decks"
        }
        message={state.message}
        onRetry={state.code === "NOT_AUTHENTICATED" ? undefined : load}
        retryLabel="Reload decks"
        className="mt-8"
        actions={
          state.code === "NOT_AUTHENTICATED" ? (
            <Button color="indigo" href="/sign-in">
              Sign in
            </Button>
          ) : undefined
        }
      />
    );
  }

  return <ExploreLibrary decks={state.decks} />;
}

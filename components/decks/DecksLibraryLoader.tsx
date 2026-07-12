"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  DeckEmptyPanel,
  DeckErrorPanel,
  DeckLoadingPanel,
} from "@/components/decks/DeckAsyncState";
import { DecksLibrary, type Deck } from "@/components/decks/DecksLibrary";
import { FeatureTip } from "@/components/onboarding/FeatureTip";
import { fetchUserDecks } from "@/lib/decks/repository";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; code?: string }
  | { status: "ready"; decks: Deck[] };

export function DecksLibraryLoader({
  onDecksLoaded,
}: {
  onDecksLoaded?: (decks: Deck[]) => void;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await fetchUserDecks();
    if (!result.ok) {
      setState({ status: "error", message: result.error, code: result.code });
      return;
    }
    setState({ status: "ready", decks: result.data });
    onDecksLoaded?.(result.data);
  }, [onDecksLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <section className="w-full" aria-labelledby="decks-loading-heading">
        <DeckLoadingPanel
          headingId="decks-loading-heading"
          title="Loading your decks"
          description="Pulling your library from the server."
          className="mt-8"
        />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="w-full" aria-labelledby="decks-error-heading">
        <DeckErrorPanel
          headingId="decks-error-heading"
          title={
            state.code === "NOT_AUTHENTICATED"
              ? "Sign in required"
              : "Could not load decks"
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
      </section>
    );
  }

  if (state.decks.length === 0) {
    return (
      <section className="w-full" aria-labelledby="decks-empty-heading" data-tour="decks-library">
        <header className="mb-8">
          <h1 className="text-2xl/8 font-semibold text-zinc-950 sm:text-xl/8 dark:text-white">
            Your decks
          </h1>
          <p className="mt-2 max-w-2xl text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
            Create your first deck to start studying.
          </p>
        </header>
        <DeckEmptyPanel
          headingId="decks-empty-heading"
          title="No decks yet"
          description="Generate flashcards from your notes or build a deck card by card."
          className="mt-6"
          variant="plain"
          actions={
            <FeatureTip tipId="new-deck">
              <Button color="indigo" href="/generate" data-tour="cta-new-deck">
                New deck
              </Button>
            </FeatureTip>
          }
        />
      </section>
    );
  }

  return <DecksLibrary decks={state.decks} onDeckDeleted={load} />;
}

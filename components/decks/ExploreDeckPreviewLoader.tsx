"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  DeckErrorPanel,
  DeckLoadingPanel,
} from "@/components/decks/DeckAsyncState";
import { ExploreDeckPreviewView } from "@/components/decks/ExploreDeckPreviewView";
import { fetchExploreDeckPreviewAction } from "@/app/actions/decks";
import type { ExploreDeckPreview } from "@/lib/decks/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; code?: string }
  | { status: "ready"; preview: ExploreDeckPreview };

export function ExploreDeckPreviewLoader({ deckId }: { deckId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await fetchExploreDeckPreviewAction(deckId);
    if (!result.ok) {
      setState({ status: "error", message: result.error, code: result.code });
      return;
    }
    setState({ status: "ready", preview: result.data });
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <DeckLoadingPanel
        headingId="explore-preview-loading-heading"
        title="Loading deck preview"
        description="Fetching deck details and sample cards."
        className="mt-8"
      />
    );
  }

  if (state.status === "error") {
    return (
      <DeckErrorPanel
        headingId="explore-preview-error-heading"
        title={
          state.code === "NOT_FOUND"
            ? "Deck not found"
            : state.code === "NOT_AUTHENTICATED"
              ? "Sign in required"
              : "Could not load deck"
        }
        message={state.message}
        onRetry={
          state.code === "NOT_AUTHENTICATED" || state.code === "NOT_FOUND" ? undefined : load
        }
        retryLabel="Reload deck"
        className="mt-8"
        actions={
          state.code === "NOT_AUTHENTICATED" ? (
            <Button color="indigo" href="/sign-in">
              Sign in
            </Button>
          ) : (
            <Button outline href="/explore">
              Back to explore
            </Button>
          )
        }
      />
    );
  }

  return (
    <ExploreDeckPreviewView
      preview={state.preview}
      onSaved={() => {
        setState({
          status: "ready",
          preview: { ...state.preview, isSaved: true },
        });
      }}
    />
  );
}

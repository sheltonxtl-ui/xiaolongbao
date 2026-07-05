"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { unsaveDeckAction } from "@/app/actions/decks";
import { Button } from "@/components/catalyst/button";
import { DeckUnsaveDialog } from "@/components/decks/DeckUnsaveDialog";
import { DeckToast } from "@/components/decks/DeckToast";
import { COMMUNITY_DECK_UNSAVE_SUCCESS_MESSAGE } from "@/lib/decks/constants";

export function CommunityDeckManagePanel({
  deckId,
  deckTitle,
}: {
  deckId: string;
  deckTitle: string;
}) {
  const router = useRouter();
  const [unsaveOpen, setUnsaveOpen] = useState(false);
  const [unsaveLoading, setUnsaveLoading] = useState(false);
  const [unsaveError, setUnsaveError] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleUnsaveCancel = useCallback(() => {
    if (unsaveLoading) return;
    setUnsaveOpen(false);
    setUnsaveError(null);
  }, [unsaveLoading]);

  const handleUnsaveConfirm = useCallback(async () => {
    if (unsaveLoading) return;
    setUnsaveLoading(true);
    setUnsaveError(null);

    const result = await unsaveDeckAction(deckId);
    setUnsaveLoading(false);

    if (!result.ok) {
      setUnsaveError(result.error);
      setErrorToast(result.error);
      return;
    }

    setUnsaveOpen(false);
    router.push("/decks?unsaved=1");
  }, [deckId, unsaveLoading, router]);

  return (
    <>
      <DeckUnsaveDialog
        open={unsaveOpen}
        onClose={handleUnsaveCancel}
        onConfirm={() => void handleUnsaveConfirm()}
        deckTitle={deckTitle}
        loading={unsaveLoading}
        error={unsaveError}
      />

      {errorToast && !unsaveOpen ? (
        <DeckToast message={errorToast} tone="error" onDismiss={() => setErrorToast(null)} />
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button color="indigo" href={`/decks/${deckId}/study`}>
          Study deck
        </Button>
        <Button
          plain
          onClick={() => {
            setUnsaveError(null);
            setUnsaveOpen(true);
          }}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Remove from library
        </Button>
        <Button outline href="/decks">
          Back to decks
        </Button>
      </div>
    </>
  );
}
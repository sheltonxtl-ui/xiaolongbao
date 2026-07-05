"use client";

import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/catalyst/alert";
import { Button } from "@/components/catalyst/button";

export function DeckDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  error = null,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <Alert open={open} onClose={onClose} size="3xl" className="w-max max-w-[calc(100vw-2rem)]">
      <AlertTitle>Delete Deck?</AlertTitle>
      <AlertDescription className="max-w-md text-pretty sm:text-left">
        Deleting this deck will remove only the deck.
        <br />
        <br />
        All flashcards inside it will be moved safely into your Uncategorized deck.
        <br />
        <br />
        This action cannot be undone.
      </AlertDescription>
      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <AlertActions>
        <Button outline onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting…" : "Delete Deck"}
        </Button>
      </AlertActions>
    </Alert>
  );
}

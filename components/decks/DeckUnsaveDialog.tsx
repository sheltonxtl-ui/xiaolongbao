"use client";

import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/catalyst/alert";
import { Button } from "@/components/catalyst/button";

export function DeckUnsaveDialog({
  open,
  onClose,
  onConfirm,
  deckTitle,
  loading = false,
  error = null,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deckTitle?: string;
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <Alert open={open} onClose={onClose} size="3xl" className="w-max max-w-[calc(100vw-2rem)]">
      <AlertTitle>Remove from library?</AlertTitle>
      <AlertDescription className="max-w-md text-pretty sm:text-left">
        {deckTitle ? (
          <>
            <span className="font-medium text-zinc-950 dark:text-white">{deckTitle}</span> will be
            removed from your personal library.
          </>
        ) : (
          <>This community deck will be removed from your personal library.</>
        )}
        <br />
        <br />
        The deck itself will not be deleted. It will stay available in Explore for you and other
        learners, and you can save it again anytime.
        <br />
        <br />
        You will lose quick access to it from this library until you save it again.
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
          {loading ? "Removing…" : "Remove"}
        </Button>
      </AlertActions>
    </Alert>
  );
}

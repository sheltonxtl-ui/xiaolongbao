"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/catalyst/dialog";
import { ImportDeckForm, type ImportDeckSource } from "@/components/decks/ImportDeckForm";

export type { ImportDeckSource };

export type ImportDeckDialogProps = {
  open: boolean;
  onClose: () => void;
  onImport?: (source: ImportDeckSource) => void | Promise<void>;
};

export function ImportDeckDialog({ open, onClose, onImport }: ImportDeckDialogProps) {
  const handleImport = useCallback(
    async (source: ImportDeckSource) => {
      await onImport?.(source);
      onClose();
    },
    [onClose, onImport],
  );

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogTitle>Import deck</DialogTitle>
      <DialogDescription>
        Bring in a deck from a shared link or upload a file. Supported formats include CSV, JSON,
        TSV, PDF, Word, JPEG, PNG, plain text, and Anki packages (.apkg).
      </DialogDescription>

      <DialogBody>
        <ImportDeckForm onImport={handleImport} onCancel={onClose} />
      </DialogBody>
    </Dialog>
  );
}

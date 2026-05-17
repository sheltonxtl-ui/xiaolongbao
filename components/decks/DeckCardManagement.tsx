"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PlayIcon } from "@heroicons/react/16/solid";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/catalyst/alert";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import {
  DeckEmptyPanel,
  DeckErrorPanel,
  DeckSaveStatus,
  type DeckSaveStatusState,
} from "@/components/decks/DeckAsyncState";
import {
  FlashcardEditor,
  type FlashcardEditorItem,
} from "@/components/decks/FlashcardEditor";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { createCard, deleteCard, updateCard } from "@/lib/decks/repository";
import type { DeckTerm } from "@/lib/decks/types";

type EditorRow = FlashcardEditorItem;

function termsToRows(terms: DeckTerm[]): EditorRow[] {
  return terms.map((t) => ({
    id: t.id,
    term: t.question,
    definition: t.answer,
    image: null,
  }));
}

function isLocalCardId(id: string): boolean {
  return id.includes("_new_");
}

export function DeckCardManagement({
  deckId,
  deckTitle,
  terms,
}: {
  deckId: string;
  deckTitle: string;
  terms: DeckTerm[];
}) {
  const [rows, setRows] = useState<EditorRow[]>(() => termsToRows(terms));
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<DeckSaveStatusState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  const rowsRef = useRef(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    setRows(termsToRows(terms));
    setSaveStatus("idle");
    setSaveError(null);
  }, [terms]);

  useEffect(() => {
    const created = objectUrls.current;
    return () => {
      for (const url of created) URL.revokeObjectURL(url);
      created.clear();
    };
  }, []);

  const persistRow = useCallback(
    async (id: string, term: string, definition: string) => {
      const trimmedTerm = term.trim();
      const trimmedDef = definition.trim();
      if (!trimmedTerm && !trimmedDef) return;

      setSaveStatus("saving");
      setSaveError(null);

      const order =
        rowsRef.current.findIndex((r) => r.id === id) + 1 || rowsRef.current.length + 1;

      if (isLocalCardId(id)) {
        const result = await createCard(deckId, {
          question: trimmedTerm,
          answer: trimmedDef,
          order,
        });
        if (!result.ok) {
          setSaveStatus("error");
          setSaveError(result.error);
          return;
        }
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  id: result.data.id,
                  term: result.data.question,
                  definition: result.data.answer,
                }
              : r,
          ),
        );
      } else {
        const result = await updateCard(id, {
          question: trimmedTerm,
          answer: trimmedDef,
        });
        if (!result.ok) {
          setSaveStatus("error");
          setSaveError(result.error);
          return;
        }
      }

      setSaveStatus("saved");
    },
    [deckId],
  );

  const debouncedPersist = useDebouncedCallback(
    (id: string, term: string, definition: string) => {
      void persistRow(id, term, definition);
    },
    600,
  );

  const handleChange = useCallback(
    (id: string, value: { term: string; definition: string }) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, term: value.term, definition: value.definition }
            : r,
        ),
      );
      debouncedPersist(id, value.term, value.definition);
    },
    [debouncedPersist],
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteError(null);
    setPendingDeleteId(id);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (deleteLoading) return;
    setPendingDeleteId(null);
    setDeleteError(null);
  }, [deleteLoading]);

  const handleDeleteConfirm = useCallback(async () => {
    const id = pendingDeleteId;
    if (!id) return;

    setDeleteLoading(true);
    setDeleteError(null);

    const result = await deleteCard(id);
    if (!result.ok) {
      setDeleteLoading(false);
      setDeleteError(result.error);
      return;
    }

    setRows((prev) => {
      const removed = prev.find((r) => r.id === id);
      if (removed?.image && objectUrls.current.has(removed.image)) {
        URL.revokeObjectURL(removed.image);
        objectUrls.current.delete(removed.image);
      }
      return prev.filter((r) => r.id !== id);
    });
    setDeleteLoading(false);
    setPendingDeleteId(null);
    setSaveStatus("saved");
  }, [pendingDeleteId]);

  const handleImageUpload = useCallback((id: string, file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.image && objectUrls.current.has(r.image)) {
          URL.revokeObjectURL(r.image);
          objectUrls.current.delete(r.image);
        }
        return { ...r, image: url };
      }),
    );
  }, []);

  const handleAddCard = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: `t_${deckId}_new_${Date.now()}_${prev.length}`,
        term: "",
        definition: "",
        image: null,
      },
    ]);
  }, [deckId]);

  const count = rows.length;
  const summaryLabel = useMemo(
    () => (count === 1 ? "1 card" : `${count} cards`),
    [count],
  );

  return (
    <>
      <Alert
        open={pendingDeleteId !== null}
        onClose={handleDeleteCancel}
        size="3xl"
        className="w-max max-w-[calc(100vw-2rem)]"
      >
        <AlertTitle>Delete card</AlertTitle>
        <AlertDescription className="text-nowrap sm:text-left">
          Are you sure you want to delete it? Once deleted, it cannot be restored.
        </AlertDescription>
        {deleteError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {deleteError}
          </p>
        ) : null}
        <AlertActions>
          <Button outline onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button color="red" onClick={() => void handleDeleteConfirm()} disabled={deleteLoading}>
            {deleteLoading ? "Deleting…" : "Confirm"}
          </Button>
        </AlertActions>
      </Alert>

      <section className="w-full" aria-labelledby="deck-manage-heading">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Heading id="deck-manage-heading">{deckTitle}</Heading>
            <Text className="mt-1 text-sm">
              <span className="font-medium text-zinc-950 dark:text-white">
                {summaryLabel}
              </span>{" "}
              in this deck
            </Text>
            <DeckSaveStatus status={saveStatus} errorMessage={saveError} className="mt-2" />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {count > 0 ? (
              <Button
                color="indigo"
                href={`/decks/${deckId}/study`}
                aria-label={`Study ${deckTitle}`}
              >
                <PlayIcon data-slot="icon" />
                Play
              </Button>
            ) : null}
            <Button outline onClick={handleAddCard} aria-label="Add a new card">
              <PlusIcon data-slot="icon" />
              Add card
            </Button>
          </div>
        </header>

        {saveStatus === "error" && saveError ? (
          <DeckErrorPanel
            className="mb-6 !py-10"
            title="Could not save card"
            message={saveError}
            onRetry={() => {
              const failing = rowsRef.current.find(
                (r) => r.term.trim() || r.definition.trim(),
              );
              if (failing) {
                void persistRow(failing.id, failing.term, failing.definition);
              }
            }}
            retryLabel="Retry save"
          />
        ) : null}

        {count === 0 ? (
          <DeckEmptyPanel
            headingId="deck-cards-empty-heading"
            title="No cards yet"
            description={
              <>
                Add cards manually or generate them from{" "}
                <Link
                  href="/generate"
                  className="font-medium text-indigo-600 underline decoration-indigo-600/30 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Generate
                </Link>
                .
              </>
            }
            actions={
              <Button color="indigo" onClick={handleAddCard}>
                <PlusIcon data-slot="icon" />
                Add your first card
              </Button>
            }
          />
        ) : (
          <FlashcardEditor
            key={deckId}
            items={rows}
            onChange={handleChange}
            onDelete={handleDeleteRequest}
            onImageUpload={handleImageUpload}
            ariaLabel={`Cards in ${deckTitle}`}
          />
        )}
      </section>
    </>
  );
}

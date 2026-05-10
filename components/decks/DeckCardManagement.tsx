"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PlayIcon } from "@heroicons/react/16/solid";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import {
  FlashcardEditor,
  type FlashcardEditorItem,
} from "@/components/decks/FlashcardEditor";
import type { DeckTerm } from "@/lib/decks-mock-data";

type EditorRow = FlashcardEditorItem;

function termsToRows(terms: DeckTerm[]): EditorRow[] {
  return terms.map((t) => ({
    id: t.id,
    term: t.question,
    definition: t.answer,
    image: null,
  }));
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
  // Local editor state. In production this would be wired up to a server
  // mutation; the mock page just keeps everything in memory.
  const [rows, setRows] = useState<EditorRow[]>(() => termsToRows(terms));
  // Track object URLs we created for uploaded images so we can revoke them.
  const objectUrls = useRef<Set<string>>(new Set());

  // Keep state in sync if the parent ever swaps the deck under us.
  useEffect(() => {
    setRows(termsToRows(terms));
  }, [terms]);

  useEffect(() => {
    const created = objectUrls.current;
    return () => {
      for (const url of created) URL.revokeObjectURL(url);
      created.clear();
    };
  }, []);

  const handleChange = useCallback(
    (id: string, value: { term: string; definition: string }) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, term: value.term, definition: value.definition }
            : r
        )
      );
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    setRows((prev) => {
      const removed = prev.find((r) => r.id === id);
      if (removed?.image && objectUrls.current.has(removed.image)) {
        URL.revokeObjectURL(removed.image);
        objectUrls.current.delete(removed.image);
      }
      return prev.filter((r) => r.id !== id);
    });
  }, []);

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
      })
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
    [count]
  );

  return (
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
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {count > 0 ? (
            <Button color="indigo" href={`/decks/${deckId}/study`} aria-label={`Study ${deckTitle}`}>
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

      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <p className="text-lg font-semibold text-zinc-950 dark:text-white">
            No cards yet
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add cards manually or generate them from{" "}
            <Link
              href="/generate"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Generate
            </Link>
            .
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleAddCard}>
              <PlusIcon data-slot="icon" />
              Add your first card
            </Button>
          </div>
        </div>
      ) : (
        <FlashcardEditor
          key={deckId}
          items={rows}
          onChange={handleChange}
          onDelete={handleDelete}
          onImageUpload={handleImageUpload}
          ariaLabel={`Cards in ${deckTitle}`}
        />
      )}
    </section>
  );
}

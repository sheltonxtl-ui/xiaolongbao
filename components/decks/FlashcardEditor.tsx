"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import {
  Pagination,
  PaginationNext,
  PaginationPrevious,
} from "@/components/catalyst/pagination";
import { Text } from "@/components/catalyst/text";
import { FlashcardRow, type FlashcardRowValue } from "./FlashcardRow";

const DEFAULT_PAGE_SIZE = 5;

/**
 * One row in a {@link FlashcardEditor}. Storage-shape-agnostic: callers map
 * their own domain models (e.g. `DeckTerm`) into this representation before
 * passing them in.
 */
export interface FlashcardEditorItem {
  id: string;
  term: string;
  definition: string;
  image: string | null;
}

export interface FlashcardEditorProps {
  items: FlashcardEditorItem[];
  /** Called when either the term or the definition input changes. */
  onChange: (id: string, value: FlashcardRowValue) => void;
  /** Called when the user picks "Delete card" from a row's kebab menu. */
  onDelete: (id: string) => void;
  /** Called once the user drops or picks a single image file. */
  onImageUpload: (id: string, file: File) => void;
  /** Max rows per page. Defaults to 5. */
  pageSize?: number;
  /** ARIA label for the editor's outer list landmark. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Inline list editor for a deck of flashcards: renders one
 * {@link FlashcardRow} per item and forwards each row's events back to the
 * parent keyed by id.
 *
 * Designed for an "always-editing" surface (Quizlet/Notion/Linear feel)
 * rather than a table or detail page — drop it inside a page-level container
 * with a soft background such as `bg-zinc-50` or `bg-[#f8f8f8]`.
 */
export function FlashcardEditor({
  items,
  onChange,
  onDelete,
  onImageUpload,
  pageSize = DEFAULT_PAGE_SIZE,
  ariaLabel = "Flashcards",
  className,
}: FlashcardEditorProps) {
  const [page, setPage] = useState(1);
  const prevLengthRef = useRef(items.length);

  const totalPages =
    items.length === 0 ? 0 : Math.max(1, Math.ceil(items.length / pageSize));

  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (totalPages === 0) return;
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  // After append (e.g. "Add card"), jump to the last page so the new row is visible.
  useEffect(() => {
    if (items.length > prevLengthRef.current && totalPages > 0) {
      setPage(totalPages);
    }
    prevLengthRef.current = items.length;
  }, [items.length, totalPages]);

  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const showPagination = totalPages > 1;

  return (
    <div className={clsx("w-full", className)}>
      <ol
        role="list"
        aria-label={ariaLabel}
        className="flex flex-col gap-3"
      >
        {pageItems.map((item, idx) => (
          <li key={item.id} className="list-none">
            <FlashcardRow
              id={item.id}
              index={start + idx + 1}
              term={item.term}
              definition={item.definition}
              image={item.image}
              onChange={(value) => onChange(item.id, value)}
              onDelete={() => onDelete(item.id)}
              onImageUpload={(file) => onImageUpload(item.id, file)}
            />
          </li>
        ))}
      </ol>

      {showPagination ? (
        <Pagination
          aria-label={`Pagination for ${ariaLabel}`}
          className="mt-6 items-center justify-between border-t border-zinc-200/80 pt-5 dark:border-zinc-700/80"
        >
          <PaginationPrevious
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
          <Text className="shrink-0 text-center text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
            Page {currentPage} of {totalPages}
            <span className="sr-only">
              {" "}
              — showing cards {start + 1}–
              {Math.min(start + pageItems.length, items.length)} of{" "}
              {items.length}
            </span>
          </Text>
          <PaginationNext
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </Pagination>
      ) : null}
    </div>
  );
}

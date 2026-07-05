"use client";

import { PlayIcon } from "@heroicons/react/16/solid";
import { TrashIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deleteDeckAction, unsaveDeckAction } from "@/app/actions/decks";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import {
  Pagination,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from "@/components/catalyst/pagination";
import { Select } from "@/components/catalyst/select";
import { Strong, Text } from "@/components/catalyst/text";
import { DeckDeleteDialog } from "@/components/decks/DeckDeleteDialog";
import { DeckEmptyPanel } from "@/components/decks/DeckAsyncState";
import { DeckToast } from "@/components/decks/DeckToast";
import { DeckUnsaveDialog } from "@/components/decks/DeckUnsaveDialog";
import {
  COMMUNITY_DECK_UNSAVE_SUCCESS_MESSAGE,
  DECK_DELETE_SUCCESS_MESSAGE,
  canRemoveFromLibrary,
} from "@/lib/decks/constants";

export type Deck = {
  id: string;
  title: string;
  topic: string;
  creator: string;
  terms: number;
  cardsInside: number;
  updatedAt: string;
  updatedRank: number;
  visibility: "Public" | "Private";
  mastery: number;
  isCommunityDeck?: boolean;
  isSystemDeck?: boolean;
  canDelete?: boolean;
  canUnsave?: boolean;
};

const DECKS_PER_PAGE = 3;

type FilterTab = "all" | "recent" | "public" | "community" | "uncategorized";

function DeckStudyCard({
  deck,
  onDeleteRequest,
  onRemoveRequest,
}: {
  deck: Deck;
  onDeleteRequest?: (deck: Deck) => void;
  onRemoveRequest?: (deck: Deck) => void;
}) {
  const isCommunity = deck.isCommunityDeck === true;
  const visibilityColor: Parameters<typeof Badge>[0]["color"] = isCommunity
    ? "violet"
    : deck.visibility === "Public"
      ? "emerald"
      : "zinc";
  const manageHref = `/decks/${deck.id}/manage`;
  const showRemove = canRemoveFromLibrary(deck);
  const removeHandler = isCommunity ? onRemoveRequest : onDeleteRequest;
  const removeLabel = isCommunity ? `Remove ${deck.title} from library` : `Delete ${deck.title}`;

  return (
    <>
      <h3 className="min-w-0 truncate text-sm/6 font-semibold">
        <Link
          href={manageHref}
          className="text-zinc-950 underline decoration-zinc-950/20 underline-offset-2 transition-colors hover:text-indigo-600 hover:decoration-indigo-600/30 dark:text-white dark:decoration-white/20 dark:hover:text-indigo-400 dark:hover:decoration-indigo-400/30"
        >
          {deck.title}
        </Link>
      </h3>
      <span className="min-w-0 truncate text-xs/5 text-zinc-500 dark:text-zinc-400">
        {deck.creator}
      </span>
      <Badge color={visibilityColor} className="w-fit whitespace-nowrap py-px text-[0.6875rem]/4">
        {isCommunity ? "Community" : deck.visibility}
      </Badge>
      <span className="whitespace-nowrap tabular-nums text-xs/5 text-zinc-600 dark:text-zinc-400">
        {deck.terms} terms
      </span>
      <span className="whitespace-nowrap tabular-nums text-xs/5 text-zinc-600 dark:text-zinc-400">
        {deck.cardsInside} cards
      </span>
      <div className="flex items-center justify-end gap-1.5 justify-self-end">
        {showRemove && removeHandler ? (
          <Button
            plain
            onClick={() => removeHandler(deck)}
            className="!inline-flex !h-7 !w-7 !min-h-0 !shrink-0 !items-center !justify-center !rounded-md !px-0 !py-0 !text-xs/5 !text-red-600 hover:!text-red-700 dark:!text-red-400 dark:hover:!text-red-300"
            aria-label={removeLabel}
          >
            <TrashIcon data-slot="icon" className="!size-4" />
          </Button>
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0" aria-hidden="true" />
        )}
        <Button
          color="indigo"
          href={`/decks/${deck.id}/study`}
          className="!inline-flex !h-7 !min-h-0 !items-center !justify-center !gap-x-1 !rounded-md !px-1.5 !py-0 !text-xs/5 !leading-none !font-semibold sm:!h-7 sm:!px-2 sm:!py-0 sm:!text-xs/5 *:data-[slot=icon]:!m-0 *:data-[slot=icon]:!size-3 sm:*:data-[slot=icon]:!size-3"
          aria-label={`Play ${deck.title}`}
        >
          <PlayIcon data-slot="icon" />
          <span className="hidden sm:inline">Play</span>
        </Button>
      </div>
    </>
  );
}

export function DecksLibrary({
  decks,
  onDeckDeleted,
}: {
  decks: Deck[];
  onDeckDeleted?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [pendingDeleteDeck, setPendingDeleteDeck] = useState<Deck | null>(null);
  const [pendingUnsaveDeck, setPendingUnsaveDeck] = useState<Deck | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unsaveLoading, setUnsaveLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [unsaveError, setUnsaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = decks.slice();

    if (tab === "public") {
      list = list.filter((d) => d.visibility === "Public" && !d.isCommunityDeck);
    } else if (tab === "community") {
      list = list.filter((d) => d.isCommunityDeck);
    } else if (tab === "uncategorized") {
      list = list.filter((d) => d.isSystemDeck);
    } else if (tab === "recent") {
      list = [...list].sort((a, b) => a.updatedRank - b.updatedRank);
    }

    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.topic.toLowerCase().includes(q) ||
          d.creator.toLowerCase().includes(q),
      );
    }

    return list;
  }, [decks, query, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / DECKS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [query, tab]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedDecks = useMemo(() => {
    const start = (currentPage - 1) * DECKS_PER_PAGE;
    return filtered.slice(start, start + DECKS_PER_PAGE);
  }, [filtered, currentPage]);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * DECKS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * DECKS_PER_PAGE, filtered.length);

  const handleDeleteCancel = () => {
    if (deleteLoading) return;
    setPendingDeleteDeck(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteDeck || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError(null);

    const result = await deleteDeckAction(pendingDeleteDeck.id);
    setDeleteLoading(false);

    if (!result.ok) {
      setDeleteError(result.error);
      setErrorToast(result.error);
      return;
    }

    setPendingDeleteDeck(null);
    setSuccessMessage(DECK_DELETE_SUCCESS_MESSAGE);
    onDeckDeleted?.();
  };

  const handleUnsaveCancel = () => {
    if (unsaveLoading) return;
    setPendingUnsaveDeck(null);
    setUnsaveError(null);
  };

  const handleUnsaveConfirm = async () => {
    if (!pendingUnsaveDeck || unsaveLoading) return;
    setUnsaveLoading(true);
    setUnsaveError(null);

    const result = await unsaveDeckAction(pendingUnsaveDeck.id);
    setUnsaveLoading(false);

    if (!result.ok) {
      setUnsaveError(result.error);
      setErrorToast(result.error);
      return;
    }

    setPendingUnsaveDeck(null);
    setSuccessMessage(COMMUNITY_DECK_UNSAVE_SUCCESS_MESSAGE);
    onDeckDeleted?.();
  };

  return (
    <>
      <DeckDeleteDialog
        open={pendingDeleteDeck !== null}
        onClose={handleDeleteCancel}
        onConfirm={() => void handleDeleteConfirm()}
        loading={deleteLoading}
        error={deleteError}
      />

      <DeckUnsaveDialog
        open={pendingUnsaveDeck !== null}
        onClose={handleUnsaveCancel}
        onConfirm={() => void handleUnsaveConfirm()}
        deckTitle={pendingUnsaveDeck?.title}
        loading={unsaveLoading}
        error={unsaveError}
      />

      {successMessage ? (
        <DeckToast message={successMessage} tone="success" onDismiss={() => setSuccessMessage(null)} />
      ) : null}

      {errorToast && pendingDeleteDeck === null && pendingUnsaveDeck === null ? (
        <DeckToast message={errorToast} tone="error" onDismiss={() => setErrorToast(null)} />
      ) : null}

      <section className="w-full">
        <header className="mb-8">
          <Heading>Your decks</Heading>
          <Text className="mt-2 max-w-2xl">
            Search, filter, and play a deck to keep momentum. Your library includes personal decks
            and community decks you have saved.
          </Text>
        </header>

        <Fieldset>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-xl lg:flex-1 xl:max-w-2xl">
              <Field>
                <Label>Search</Label>
                <Input
                  type="search"
                  aria-label="Search decks"
                  placeholder="Search by title or topic…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Field>
              <Field>
                <Label>View</Label>
                <Select
                  value={tab}
                  onChange={(e) => setTab(e.target.value as FilterTab)}
                  aria-label="Filter decks by view"
                >
                  <option value="all">All decks</option>
                  <option value="recent">Recently updated</option>
                  <option value="public">Public only</option>
                  <option value="community">Community saved</option>
                  <option value="uncategorized">Uncategorized</option>
                </Select>
              </Field>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button color="indigo" href="/generate">
                New deck
              </Button>
            </div>
          </div>
        </Fieldset>

        {filtered.length === 0 ? (
          <DeckEmptyPanel
            className="mt-10"
            headingId="decks-filter-empty-heading"
            title="No decks match your filters"
            description={
              <>
                Try a different search or switch back to <Strong>All decks</Strong>.
              </>
            }
            actions={
              <Button outline onClick={() => { setQuery(""); setTab("all"); }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <Text className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
              Showing{" "}
              <span className="font-medium text-zinc-950 dark:text-white">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-medium text-zinc-950 dark:text-white">
                {filtered.length}
              </span>{" "}
              deck{filtered.length === 1 ? "" : "s"}
            </Text>

            <ul
              className="mt-5 list-none divide-y divide-zinc-950/10 overflow-x-auto overflow-y-hidden rounded-lg border border-zinc-950/10 bg-white ring-1 ring-zinc-950/5 dark:divide-white/10 dark:border-white/10 dark:bg-zinc-900/40 dark:ring-white/10"
              aria-label="Your decks"
            >
              {pagedDecks.map((deck) => (
                <li
                  key={deck.id}
                  className={
                    deck.isCommunityDeck
                      ? "deck-list-row bg-violet-50/50 dark:bg-violet-950/20"
                      : "deck-list-row"
                  }
                >
                  <DeckStudyCard
                    deck={deck}
                    onDeleteRequest={setPendingDeleteDeck}
                    onRemoveRequest={setPendingUnsaveDeck}
                  />
                </li>
              ))}
            </ul>

            {totalPages > 1 ? (
              <Pagination className="mt-8" aria-label="Deck list pages">
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                />
                <PaginationList>
                  {Array.from({ length: totalPages }, (_, i) => {
                    const n = i + 1;
                    return (
                      <PaginationPage
                        key={n}
                        onClick={() => setPage(n)}
                        current={n === currentPage}
                      >
                        {n}
                      </PaginationPage>
                    );
                  })}
                </PaginationList>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                />
              </Pagination>
            ) : null}
          </>
        )}
    </section>
    </>
  );
}

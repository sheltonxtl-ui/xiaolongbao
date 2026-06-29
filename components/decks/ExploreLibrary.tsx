"use client";

import { useEffect, useMemo, useState } from "react";
import { EyeIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading, Subheading } from "@/components/catalyst/heading";
import {
  Pagination,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from "@/components/catalyst/pagination";
import { Select } from "@/components/catalyst/select";
import { Strong, Text } from "@/components/catalyst/text";
import { DeckEmptyPanel } from "@/components/decks/DeckAsyncState";
import type { ExploreDeck } from "@/lib/decks/types";

const DECKS_PER_PAGE = 6;

type OwnerFilter = "all" | "mine" | "others";

function ExploreDeckCard({ deck }: { deck: ExploreDeck }) {
  return (
    <article className="flex h-56 w-full flex-col rounded-lg border border-zinc-950/10 bg-white p-5 ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-zinc-900/40 dark:ring-white/10">
      <Subheading
        level={3}
        title={deck.title}
        className="line-clamp-2 h-12 shrink-0 overflow-hidden text-base/6"
      >
        {deck.title}
      </Subheading>
      <div className="mt-2 flex h-6 shrink-0 items-center">
        {deck.isOwnDeck ? (
          <Badge color="emerald" className="py-px text-[0.6875rem]/4">
            Your deck
          </Badge>
        ) : null}
      </div>
      <Text className="mt-2 h-5 shrink-0 truncate text-sm text-zinc-500 dark:text-zinc-400">
        by {deck.authorName}
      </Text>
      <div className="flex-1" aria-hidden="true" />
      <div className="mt-4 flex h-8 shrink-0 items-center justify-between gap-3 border-t border-zinc-950/5 pt-4 dark:border-white/5">
        <Badge color="zinc" className="tabular-nums">
          {deck.cardCount} card{deck.cardCount === 1 ? "" : "s"}
        </Badge>
        <Button
          color="indigo"
          href={deck.isOwnDeck ? `/decks/${deck.id}/manage` : `/explore/${deck.id}`}
          className="!inline-flex !h-8 !min-h-0 !shrink-0 !items-center !gap-x-1.5 !px-2.5 !py-0 !text-xs/5"
        >
          <EyeIcon data-slot="icon" className="!size-3.5" />
          {deck.isOwnDeck ? "Manage" : "Preview"}
        </Button>
      </div>
    </article>
  );
}

export function ExploreLibrary({ decks }: { decks: ExploreDeck[] }) {
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (ownerFilter === "mine") {
      return decks.filter((deck) => deck.isOwnDeck);
    }
    if (ownerFilter === "others") {
      return decks.filter((deck) => !deck.isOwnDeck);
    }
    return decks;
  }, [decks, ownerFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / DECKS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const pagedDecks = useMemo(() => {
    const start = (currentPage - 1) * DECKS_PER_PAGE;
    return filtered.slice(start, start + DECKS_PER_PAGE);
  }, [filtered, currentPage]);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * DECKS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * DECKS_PER_PAGE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [ownerFilter]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  return (
    <section className="w-full">
      <header className="mb-8">
        <Heading>Explore community decks</Heading>
        <Text className="mt-2 max-w-2xl">
          Browse flashcard decks shared by the community. Preview a deck and save it to your
          collection to study anytime. Your own public decks appear here too.
        </Text>
      </header>

      <Fieldset>
        <Field className="max-w-xs">
          <Label>Show</Label>
          <Select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value as OwnerFilter)}
            aria-label="Filter community decks by owner"
          >
            <option value="all">All decks</option>
            <option value="mine">My decks</option>
            <option value="others">Others&apos; decks</option>
          </Select>
        </Field>
      </Fieldset>

      {filtered.length === 0 ? (
        <DeckEmptyPanel
          className="mt-10"
          headingId="explore-empty-heading"
          title={
            ownerFilter === "mine"
              ? "No public decks of yours yet"
              : ownerFilter === "others"
                ? "No community decks from others yet"
                : "No public decks yet"
          }
          description={
            ownerFilter === "mine" ? (
              <>
                Make a deck public from your{" "}
                <Link
                  href="/decks"
                  className="font-medium text-indigo-600 underline decoration-indigo-600/30 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
                >
                  deck library
                </Link>{" "}
                to share it here.
              </>
            ) : ownerFilter === "others" ? (
              "No one else has shared a public deck yet. Browse Explore to preview decks from other learners."
            ) : (
              "No public decks have been shared yet. Browse Explore to see community decks."
            )
          }
          actions={
            ownerFilter !== "all" ? (
              <Button outline onClick={() => setOwnerFilter("all")}>
                Show all decks
              </Button>
            ) : undefined
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
            public deck{filtered.length === 1 ? "" : "s"}
            {ownerFilter === "all" ? null : (
              <>
                {" "}
                (<Strong>
                  {ownerFilter === "mine" ? "my decks" : "others' decks"}
                </Strong>
                )
              </>
            )}
          </Text>
          <ul
            className="mt-5 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Community decks"
          >
            {pagedDecks.map((deck) => (
              <li key={deck.id}>
                <ExploreDeckCard deck={deck} />
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <Pagination className="mt-8" aria-label="Community deck pages">
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

      <Text className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
        Want to share your own decks? Toggle <Strong>Share in community</Strong> on any deck from
        your{" "}
        <Link
          href="/decks"
          className="font-medium text-indigo-600 underline decoration-indigo-600/30 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
        >
          deck library
        </Link>
        .
      </Text>
    </section>
  );
}

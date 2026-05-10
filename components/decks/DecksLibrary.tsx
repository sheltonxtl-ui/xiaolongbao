"use client";

import { PlayIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { Text } from "@/components/catalyst/text";

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
};

const DECKS_PER_PAGE = 3;

type FilterTab = "all" | "recent" | "public";

function DeckStudyCard({ deck }: { deck: Deck }) {
  const visibilityColor: Parameters<typeof Badge>[0]["color"] =
    deck.visibility === "Public" ? "emerald" : "zinc";

  return (
    <article className="group flex min-h-9 min-w-0 flex-nowrap items-center gap-x-2 overflow-x-auto bg-white px-2 py-1.5 transition-colors hover:bg-zinc-50 sm:gap-x-3 sm:px-3 dark:bg-transparent dark:hover:bg-white/5">
      <h3 className="min-w-0 flex-1 truncate text-sm/6 font-semibold">
        <Link
          href={`/decks/${deck.id}/manage`}
          className="text-zinc-950 underline decoration-zinc-950/20 underline-offset-2 transition-colors hover:text-indigo-600 hover:decoration-indigo-600/30 dark:text-white dark:decoration-white/20 dark:hover:text-indigo-400 dark:hover:decoration-indigo-400/30"
        >
          {deck.title}
        </Link>
      </h3>
      <span className="max-w-[5.5rem] shrink-0 truncate text-xs/5 text-zinc-500 sm:max-w-[10rem] dark:text-zinc-400">
        {deck.creator}
      </span>
      <Badge color={visibilityColor} className="shrink-0 py-px text-[0.6875rem]/4">
        {deck.visibility}
      </Badge>
      <span className="shrink-0 whitespace-nowrap tabular-nums text-xs/5 text-zinc-600 dark:text-zinc-400">
        {deck.terms} terms
      </span>
      <span className="shrink-0 whitespace-nowrap tabular-nums text-xs/5 text-zinc-600 dark:text-zinc-400">
        {deck.cardsInside} cards
      </span>
      <Button
        color="indigo"
        href={`/decks/${deck.id}/study`}
        className="shrink-0 px-2 py-1 text-xs/5 sm:px-2.5"
        aria-label={`Play ${deck.title}`}
      >
        <PlayIcon data-slot="icon" className="size-3.5 sm:size-4" />
        <span className="hidden sm:inline">Play</span>
      </Button>
    </article>
  );
}

export function DecksLibrary({ decks }: { decks: Deck[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = decks.slice();

    if (tab === "public") {
      list = list.filter((d) => d.visibility === "Public");
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

  return (
    <>
      <section className="w-full">
        <header className="mb-8">
          <Heading>Your decks</Heading>
          <Text className="mt-2 max-w-2xl">
            Search, filter, and play a deck to keep momentum. Narrow rows show title, creator,
            visibility, and counts at a glance.
          </Text>
        </header>

        <Fieldset className="rounded-2xl border border-zinc-950/10 bg-white p-4 shadow-xs ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900/40 dark:ring-white/10 sm:p-5">
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
                </Select>
              </Field>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button outline>Import deck</Button>
              <Button color="indigo" href="/generate">
                New deck
              </Button>
            </div>
          </div>
        </Fieldset>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-16 text-center dark:border-zinc-600 dark:bg-zinc-900/30">
            <p className="text-lg font-semibold text-foreground">No decks match your filters</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Try a different search or switch back to <strong className="font-semibold">All decks</strong>.
            </p>
          </div>
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
              className="mt-5 list-none divide-y divide-zinc-950/10 overflow-hidden rounded-lg border border-zinc-950/10 bg-white ring-1 ring-zinc-950/5 dark:divide-white/10 dark:border-white/10 dark:bg-zinc-900/40 dark:ring-white/10"
              aria-label="Your decks"
            >
              {pagedDecks.map((deck) => (
                <li key={deck.id}>
                  <DeckStudyCard deck={deck} />
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

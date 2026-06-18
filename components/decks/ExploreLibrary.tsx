"use client";

import { EyeIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { DeckEmptyPanel } from "@/components/decks/DeckAsyncState";
import type { ExploreDeck } from "@/lib/decks/types";

function ExploreDeckCard({ deck }: { deck: ExploreDeck }) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-zinc-950/10 bg-white p-5 ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-zinc-900/40 dark:ring-white/10">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base/6 font-semibold text-zinc-950 dark:text-white">
          {deck.title}
        </h3>
        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          by {deck.authorName}
        </Text>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge color="zinc" className="tabular-nums">
          {deck.cardCount} card{deck.cardCount === 1 ? "" : "s"}
        </Badge>
        <Button
          color="indigo"
          href={`/explore/${deck.id}`}
          className="!inline-flex !h-8 !min-h-0 !items-center !gap-x-1.5 !px-2.5 !py-0 !text-xs/5"
        >
          <EyeIcon data-slot="icon" className="!size-3.5" />
          Preview
        </Button>
      </div>
    </article>
  );
}

export function ExploreLibrary({ decks }: { decks: ExploreDeck[] }) {
  return (
    <section className="w-full">
      <header className="mb-8">
        <Heading>Explore community decks</Heading>
        <Text className="mt-2 max-w-2xl">
          Browse flashcard decks shared by other learners. Preview a deck and save it to your
          collection to study anytime.
        </Text>
      </header>

      {decks.length === 0 ? (
        <DeckEmptyPanel
          className="mt-10"
          headingId="explore-empty-heading"
          title="No public decks yet"
          description="No public decks have been shared yet. Check back later."
        />
      ) : (
        <ul
          className="mt-8 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Community decks"
        >
          {decks.map((deck) => (
            <li key={deck.id}>
              <ExploreDeckCard deck={deck} />
            </li>
          ))}
        </ul>
      )}

      <Text className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
        Want to share your own decks? Make a deck public from your{" "}
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

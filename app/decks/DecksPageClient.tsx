"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/catalyst/description-list";
import { Divider } from "@/components/catalyst/divider";
import { Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { DecksLibraryLoader } from "@/components/decks/DecksLibraryLoader";
import { DeckToast } from "@/components/decks/DeckToast";
import type { Deck } from "@/components/decks/DecksLibrary";
import { COMMUNITY_DECK_UNSAVE_SUCCESS_MESSAGE, DECK_DELETE_SUCCESS_MESSAGE } from "@/lib/decks/constants";

function DeckLibrarySuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const deleted = searchParams.get("deleted") === "1";
    const unsaved = searchParams.get("unsaved") === "1";
    if (!deleted && !unsaved) return;

    setMessage(
      unsaved ? COMMUNITY_DECK_UNSAVE_SUCCESS_MESSAGE : DECK_DELETE_SUCCESS_MESSAGE,
    );
    router.replace("/decks");
  }, [router, searchParams]);

  if (!message) return null;

  return <DeckToast message={message} tone="success" onDismiss={() => setMessage(null)} />;
}

export function DecksPageClient() {
  const [decks, setDecks] = useState<Deck[]>([]);

  const totalTerms = decks.reduce((sum, deck) => sum + deck.terms, 0);
  const totalCardsInside = decks.reduce((sum, deck) => sum + deck.cardsInside, 0);
  const publicDecks = decks.filter((deck) => deck.visibility === "Public").length;
  const privateDecks = decks.length - publicDecks;
  const avgMastery = Math.round(
    decks.reduce((sum, deck) => sum + deck.mastery, 0) / Math.max(decks.length, 1),
  );

  return (
    <>
      <DeckLibrarySuccessToast />
      <DecksLibraryLoader onDecksLoaded={setDecks} />

      {decks.length > 0 ? (
        <section className="mt-14" aria-labelledby="library-stats-heading">
          <Divider />
          <Subheading id="library-stats-heading" level={2} className="mt-8">
            Library overview
          </Subheading>
          <Text className="mt-2 max-w-xl">
            Roll-up counts for everything in this workspace. Jump into a deck above whenever you are
            ready to study.
          </Text>
          <DescriptionList className="mt-8">
            <DescriptionTerm>Total decks</DescriptionTerm>
            <DescriptionDetails>
              <span className="tabular-nums text-lg font-semibold text-zinc-950 dark:text-white">
                {decks.length}
              </span>
            </DescriptionDetails>
            <DescriptionTerm>Total terms</DescriptionTerm>
            <DescriptionDetails>
              <span className="tabular-nums text-lg font-semibold text-zinc-950 dark:text-white">
                {totalTerms}
              </span>
            </DescriptionDetails>
            <DescriptionTerm>Cards in decks</DescriptionTerm>
            <DescriptionDetails>
              <span className="tabular-nums text-lg font-semibold text-zinc-950 dark:text-white">
                {totalCardsInside}
              </span>
            </DescriptionDetails>
            <DescriptionTerm>Public / private</DescriptionTerm>
            <DescriptionDetails>
              <span className="tabular-nums text-lg font-semibold text-zinc-950 dark:text-white">
                {publicDecks} / {privateDecks}
              </span>
            </DescriptionDetails>
            <DescriptionTerm>Average mastery</DescriptionTerm>
            <DescriptionDetails>
              <span className="tabular-nums text-lg font-semibold text-zinc-950 dark:text-white">
                {avgMastery}%
              </span>
            </DescriptionDetails>
          </DescriptionList>
        </section>
      ) : null}
    </>
  );
}

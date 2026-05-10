import type { Metadata } from "next";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/catalyst/description-list";
import { Divider } from "@/components/catalyst/divider";
import { Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { DecksLibrary } from "@/components/decks/DecksLibrary";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { mockDecks } from "@/lib/decks-mock-data";

export const metadata: Metadata = {
  title: "Decks — xiaolongbao",
  description: "Browse, organize, and continue studying your flashcard decks.",
};

const decks = mockDecks;

export default function DecksPage() {
  const totalTerms = decks.reduce((sum, deck) => sum + deck.terms, 0);
  const totalCardsInside = decks.reduce((sum, deck) => sum + deck.cardsInside, 0);
  const publicDecks = decks.filter((deck) => deck.visibility === "Public").length;
  const privateDecks = decks.length - publicDecks;
  const avgMastery = Math.round(
    decks.reduce((sum, deck) => sum + deck.mastery, 0) / Math.max(decks.length, 1),
  );

  return (
    <AppDashboardShell>
      <DecksLibrary decks={decks} />

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

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

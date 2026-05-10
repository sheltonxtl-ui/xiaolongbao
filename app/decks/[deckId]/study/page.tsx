import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { DeckStudyMode } from "@/components/decks/DeckStudyMode";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getMockDeck, getMockDeckTerms } from "@/lib/decks-mock-data";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  const deck = getMockDeck(deckId);
  if (!deck) {
    return { title: "Deck not found — xiaolongbao" };
  }
  return {
    title: `${deck.title} — Study — xiaolongbao`,
    description: `Study flashcards in ${deck.title}.`,
  };
}

export default async function DeckStudyPage({ params }: Props) {
  const { deckId } = await params;
  const deck = getMockDeck(deckId);
  if (!deck) {
    notFound();
  }

  const terms = getMockDeckTerms(deckId);

  return (
    <AppDashboardShell>
      <DeckStudyMode deckId={deck.id} deckTitle={deck.title} terms={terms} />

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

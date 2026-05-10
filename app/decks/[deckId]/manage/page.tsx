import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { DeckCardManagement } from "@/components/decks/DeckCardManagement";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/catalyst/button";
import { Text } from "@/components/catalyst/text";
import { getMockDeck, getMockDeckTerms } from "@/lib/decks-mock-data";

type Props = { params: Promise<{ deckId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  const deck = getMockDeck(deckId);
  if (!deck) {
    return { title: "Deck not found — xiaolongbao" };
  }
  return {
    title: `${deck.title} — Manage — xiaolongbao`,
    description: `Edit and review terms in ${deck.title}.`,
  };
}

export default async function DeckManagePage({ params }: Props) {
  const { deckId } = await params;
  const deck = getMockDeck(deckId);
  if (!deck) {
    notFound();
  }

  const terms = getMockDeckTerms(deckId);

  return (
    <AppDashboardShell>
      <div className="mb-6">
        <Button plain href="/decks">
          ← Back to decks
        </Button>
      </div>

      <div className="-mx-4 rounded-3xl bg-zinc-50 p-4 sm:-mx-6 sm:p-6 lg:-mx-8 lg:p-8 dark:bg-zinc-900/40">
        <DeckCardManagement deckId={deck.id} deckTitle={deck.title} terms={terms} />
      </div>

      <Text className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
        Study in{" "}
        <Link href={`/decks/${encodeURIComponent(deck.id)}/study`} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          study mode
        </Link>
        , or keep editing cards above.
      </Text>

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

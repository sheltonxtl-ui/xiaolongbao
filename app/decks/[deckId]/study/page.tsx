import type { Metadata } from "next";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { DeckStudyLoader } from "@/components/decks/DeckStudyLoader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

type Props = { params: Promise<{ deckId: string }> };

export const metadata: Metadata = {
  title: "Study deck — xiaolongbao",
  description: "Study flashcards in your deck.",
};

export default async function DeckStudyPage({ params }: Props) {
  const { deckId } = await params;

  return (
    <AppDashboardShell>
      <DeckStudyLoader deckId={deckId} />

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

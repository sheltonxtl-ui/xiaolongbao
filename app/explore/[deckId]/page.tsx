import type { Metadata } from "next";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { ExploreDeckPreviewLoader } from "@/components/decks/ExploreDeckPreviewLoader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "Deck preview — xiaolongbao",
  description: "Preview a community flashcard deck and save it to your collection.",
};

type PageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function ExploreDeckPage({ params }: PageProps) {
  const { deckId } = await params;

  return (
    <AppDashboardShell>
      <ExploreDeckPreviewLoader deckId={deckId} />

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

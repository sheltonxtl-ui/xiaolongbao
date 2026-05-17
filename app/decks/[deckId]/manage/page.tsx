import type { Metadata } from "next";
import Link from "next/link";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { DeckManageLoader } from "@/components/decks/DeckManageLoader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/catalyst/button";
import { Text } from "@/components/catalyst/text";

type Props = { params: Promise<{ deckId: string }> };

export const metadata: Metadata = {
  title: "Manage deck — xiaolongbao",
  description: "Edit and review terms in your flashcard deck.",
};

export default async function DeckManagePage({ params }: Props) {
  const { deckId } = await params;

  return (
    <AppDashboardShell>
      <div className="mb-6">
        <Button plain href="/decks">
          ← Back to decks
        </Button>
      </div>

      <DeckManageLoader deckId={deckId} />

      <Text className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
        Study in{" "}
        <Link
          href={`/decks/${encodeURIComponent(deckId)}/study`}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
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

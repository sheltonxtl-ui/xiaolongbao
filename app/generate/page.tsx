import type { Metadata } from "next";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { GenerateDeckLoader } from "@/components/decks/GenerateDeckLoader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "New deck — xiaolongbao",
  description: "Generate flashcards from your notes or import an existing deck.",
};

export default function GeneratePage() {
  return (
    <AppDashboardShell>
      <GenerateDeckLoader />

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

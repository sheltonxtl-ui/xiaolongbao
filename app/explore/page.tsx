import type { Metadata } from "next";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { ExploreLibraryLoader } from "@/components/decks/ExploreLibraryLoader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "Explore — xiaolongbao",
  description: "Browse and save community flashcard decks shared by other learners.",
};

export default function ExplorePage() {
  return (
    <AppDashboardShell>
      <ExploreLibraryLoader />

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

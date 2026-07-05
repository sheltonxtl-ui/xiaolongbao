import type { Metadata } from "next";
import { Suspense } from "react";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { DecksPageClient } from "./DecksPageClient";

export const metadata: Metadata = {
  title: "Decks — xiaolongbao",
  description: "Browse, organize, and continue studying your flashcard decks.",
};

export default function DecksPage() {
  return (
    <AppDashboardShell>
      <Suspense fallback={null}>
        <DecksPageClient />
      </Suspense>

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

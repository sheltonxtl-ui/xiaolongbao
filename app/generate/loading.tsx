import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { DeckLoadingPanel } from "@/components/decks/DeckAsyncState";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function GenerateLoading() {
  return (
    <AppDashboardShell>
      <section className="w-full" aria-labelledby="generate-loading-heading">
        <DeckLoadingPanel
          headingId="generate-loading-heading"
          title="Opening new deck"
          description="Getting the generator ready for you."
          className="mt-8"
        />
      </section>

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

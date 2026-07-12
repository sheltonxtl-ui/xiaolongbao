import type { Metadata } from "next";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { HelpCenter } from "@/components/help/HelpCenter";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "Help Center — xiaolongbao",
  description: "Guides for decks, AI generation, studying, community features, and settings.",
};

export default function HelpPage() {
  return (
    <AppDashboardShell>
      <HelpCenter />
      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

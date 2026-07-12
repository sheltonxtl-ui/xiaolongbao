import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export const metadata: Metadata = {
  title: "Settings — xiaolongbao",
  description: "Account settings, tutorial replay, and help shortcuts.",
};

export default async function SettingsPage() {
  const { isConfigured } = getSupabasePublicEnv();
  if (isConfigured) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/sign-in?next=/settings");
    }
  }

  return (
    <AppDashboardShell>
      <SettingsPageClient />
      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

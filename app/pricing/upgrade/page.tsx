import type { Metadata } from "next";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { ProCheckoutPanel } from "@/components/billing/ProCheckoutPanel";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { isActiveSubscription, isProPlan } from "@/lib/billing/plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Upgrade to Pro",
  description: "Upgrade to Pro for unlimited decks, uploads, exports, and sharing.",
};

export default async function UpgradePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAlreadyPro = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profile")
      .select("plan_type, subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();

    isAlreadyPro =
      Boolean(profile) &&
      isProPlan(profile?.plan_type) &&
      isActiveSubscription(profile?.subscription_status);
  }

  return (
    <>
      <SiteHeader />
      <main className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Upgrade to Pro
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Enter your payment details on Stripe&apos;s secure checkout page. Your account upgrades
              automatically after payment.
            </p>
          </div>
          <div className="mt-12">
            <ProCheckoutPanel isSignedIn={Boolean(user)} isAlreadyPro={isAlreadyPro} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

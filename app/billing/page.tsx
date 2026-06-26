import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BillingPageClient } from "@/components/billing/BillingPageClient";
import { AppDashboardShell } from "@/components/dashboard/AppDashboardShell";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getBillingOverviewForCurrentUser } from "@/lib/billing/get-billing-overview";

export const metadata: Metadata = {
  title: "Billing — xiaolongbao",
  description: "View your subscription status, payment history, and manage your plan.",
};

type BillingPageProps = {
  searchParams: Promise<{ session_id?: string; checkout?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const billing = await getBillingOverviewForCurrentUser({
    checkoutSessionId: params.session_id,
  });

  if (!billing) {
    redirect("/sign-in?next=/billing");
  }

  const checkoutSuccess = params.checkout === "success";

  return (
    <AppDashboardShell>
      <BillingPageClient billing={billing} checkoutSuccess={checkoutSuccess} />

      <div className="mt-14">
        <SiteFooter />
      </div>
    </AppDashboardShell>
  );
}

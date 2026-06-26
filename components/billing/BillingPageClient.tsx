"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/catalyst/alert";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/catalyst/description-list";
import { Heading, Subheading } from "@/components/catalyst/heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/catalyst/table";
import { Text, TextLink } from "@/components/catalyst/text";
import { UpgradeToProButton } from "@/components/billing/UpgradeToProButton";
import type { BillingOverview } from "@/lib/billing/get-billing-overview";
import type { PlanType, SubscriptionStatus } from "@/lib/billing/plans";
import { isActiveSubscription, isProPlan } from "@/lib/billing/plans";
import { PRO_INTERVAL, PRO_PRICE_LABEL, planHighlights } from "@/lib/pricing";

type BillingPageClientProps = {
  billing: BillingOverview;
  checkoutSuccess?: boolean;
};

function statusBadgeColor(
  planType: PlanType,
  status: SubscriptionStatus,
  cancelAtPeriodEnd: boolean,
): "green" | "amber" | "red" | "zinc" | "indigo" {
  if (cancelAtPeriodEnd && isActiveSubscription(status)) {
    return "amber";
  }

  if (status === "active" || status === "trialing") {
    return "green";
  }

  if (status === "past_due") {
    return "red";
  }

  if (isProPlan(planType)) {
    return "indigo";
  }

  return "zinc";
}

function statusLabel(
  planType: PlanType,
  status: SubscriptionStatus,
  cancelAtPeriodEnd: boolean,
): string {
  if (cancelAtPeriodEnd && isActiveSubscription(status)) {
    return "Canceling";
  }

  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "canceled":
      return "Canceled";
    case "past_due":
      return "Past due";
    default:
      return isProPlan(planType) ? "Inactive" : "Free";
  }
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(isoDate));
}

export function BillingPageClient({ billing, checkoutSuccess = false }: BillingPageClientProps) {
  const router = useRouter();
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const planName = planHighlights[billing.planType].name;
  const isPro = isProPlan(billing.planType) && isActiveSubscription(billing.subscriptionStatus);

  async function handleCancelConfirm() {
    if (cancelLoading) {
      return;
    }

    setCancelLoading(true);
    setCancelError(null);

    try {
      const response = await fetch("/api/stripe/cancel-subscription", { method: "POST" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setCancelError(data.error ?? "Could not cancel subscription.");
        return;
      }

      setShowCancelAlert(false);
      router.refresh();
    } catch {
      setCancelError("Network error. Check your connection and try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleResumeSubscription() {
    if (resumeLoading) {
      return;
    }

    setResumeLoading(true);
    setResumeError(null);

    try {
      const response = await fetch("/api/stripe/resume-subscription", { method: "POST" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setResumeError(data.error ?? "Could not resume subscription.");
        return;
      }

      router.refresh();
    } catch {
      setResumeError("Network error. Check your connection and try again.");
    } finally {
      setResumeLoading(false);
    }
  }

  return (
    <>
      <Alert
        open={showCancelAlert}
        onClose={() => {
          if (!cancelLoading) {
            setShowCancelAlert(false);
            setCancelError(null);
          }
        }}
        size="lg"
      >
        <AlertTitle>Cancel Pro subscription</AlertTitle>
        <AlertDescription>
          {billing.currentPeriodEnd ? (
            <>
              Your Pro access continues until <strong>{formatDate(billing.currentPeriodEnd)}</strong>.
              After that, your account returns to the Free plan and you will not be charged again.
            </>
          ) : (
            <>
              Your Pro access continues until the end of the current billing period. After that, your
              account returns to the Free plan.
            </>
          )}
        </AlertDescription>
        {cancelError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {cancelError}
          </p>
        ) : null}
        <AlertActions>
          <Button outline onClick={() => setShowCancelAlert(false)} disabled={cancelLoading}>
            Keep subscription
          </Button>
          <Button color="red" onClick={() => void handleCancelConfirm()} disabled={cancelLoading}>
            {cancelLoading ? "Canceling…" : "Confirm cancellation"}
          </Button>
        </AlertActions>
      </Alert>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <Heading>Billing</Heading>
          <Text className="mt-2">
            View your subscription status, payment history, and manage your plan.
          </Text>
          {checkoutSuccess ? (
            <Text role="status" className="mt-3 text-green-700 dark:text-green-400">
              Payment received. Your Pro subscription is now active.
            </Text>
          ) : null}
        </header>

        <section className="mt-10 rounded-2xl border border-zinc-950/10 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Subheading level={2}>Current plan</Subheading>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-semibold text-zinc-950 dark:text-white">
                  {planName}
                </span>
                <Badge
                  color={statusBadgeColor(
                    billing.planType,
                    billing.subscriptionStatus,
                    billing.cancelAtPeriodEnd,
                  )}
                >
                  {statusLabel(
                    billing.planType,
                    billing.subscriptionStatus,
                    billing.cancelAtPeriodEnd,
                  )}
                </Badge>
              </div>
            </div>
            {!isPro ? (
              <UpgradeToProButton label="Upgrade to Pro" className="w-full sm:w-auto" />
            ) : null}
          </div>

          <Divider className="my-8" />

          <DescriptionList>
            <DescriptionTerm>Price</DescriptionTerm>
            <DescriptionDetails>
              {isPro ? `${PRO_PRICE_LABEL}${PRO_INTERVAL}` : planHighlights.free.price}
            </DescriptionDetails>

            <DescriptionTerm>Billing period</DescriptionTerm>
            <DescriptionDetails>{isPro ? "Monthly" : "—"}</DescriptionDetails>

            {billing.currentPeriodEnd ? (
              <>
                <DescriptionTerm>
                  {billing.cancelAtPeriodEnd ? "Access until" : "Next billing date"}
                </DescriptionTerm>
                <DescriptionDetails>{formatDate(billing.currentPeriodEnd)}</DescriptionDetails>
              </>
            ) : null}
          </DescriptionList>

          {!isPro ? (
            <Text className="mt-6 text-sm">
              Need more decks, uploads, and exports?{" "}
              <TextLink href="/pricing/upgrade">Compare Pro features</TextLink>.
            </Text>
          ) : null}
        </section>

        {isPro ? (
          <section className="mt-8 rounded-2xl border border-zinc-950/10 bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10 sm:p-8">
            <Subheading level={2}>Manage subscription</Subheading>

            {billing.cancelAtPeriodEnd ? (
              <>
                <Text className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                  Your subscription is scheduled to cancel
                  {billing.currentPeriodEnd ? ` on ${formatDate(billing.currentPeriodEnd)}` : ""}. Pro
                  features remain available until then.
                </Text>
                <Text className="mt-2 text-sm">
                  Changed your mind? Keep your subscription to continue Pro billing after this period.
                </Text>
                {resumeError ? (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                    {resumeError}
                  </p>
                ) : null}
                {billing.canResume ? (
                  <div className="mt-6">
                    <Button onClick={() => void handleResumeSubscription()} disabled={resumeLoading}>
                      {resumeLoading ? "Updating…" : "Keep Pro subscription"}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <Text className="mt-3 text-sm">
                  Cancel anytime. You keep Pro access until the end of your current billing period, and
                  you will not be charged again after that.
                </Text>
                {billing.canCancel ? (
                  <div className="mt-6">
                    <Button outline onClick={() => setShowCancelAlert(true)}>
                      Cancel subscription
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        <section className="mt-10">
          <Subheading level={2}>Payment history</Subheading>
          <Text className="mt-2 text-sm">
            Invoices from your Pro subscription payments.
          </Text>

          {billing.invoices.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-950/15 px-6 py-10 text-center dark:border-white/15">
              <Text>
                {isPro
                  ? "No invoices found yet. If you just subscribed, refresh this page in a moment."
                  : "No payments yet. Invoices appear here after you subscribe to Pro."}
              </Text>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-zinc-950/10 dark:border-white/10">
              <Table striped>
                <TableHead>
                  <TableRow>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader className="text-right">Invoice</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billing.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>
                        <Badge
                          color={
                            invoice.status === "Paid"
                              ? "green"
                              : invoice.status === "Open"
                                ? "amber"
                                : "zinc"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.invoiceUrl ? (
                          <TextLink
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </TextLink>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

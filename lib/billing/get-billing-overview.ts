import type { PlanType, SubscriptionStatus } from "@/lib/billing/plans";
import { isActiveSubscription, isProPlan } from "@/lib/billing/plans";
import {
  reconcileActiveSubscriptionForProfile,
  syncCheckoutSessionForProfile,
} from "@/lib/billing/sync-checkout-session";
import { getSubscriptionPeriodEndIso } from "@/lib/billing/stripe-subscription";
import { getStripeConfig } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BillingInvoice = {
  id: string;
  date: string;
  amount: string;
  status: string;
  invoiceUrl: string | null;
};

export type BillingOverview = {
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  billingPeriod: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  canCancel: boolean;
  canResume: boolean;
  invoices: BillingInvoice[];
};

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function formatInvoiceStatus(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "open":
      return "Open";
    case "void":
      return "Void";
    case "uncollectible":
      return "Uncollectible";
    case "draft":
      return "Draft";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export async function getBillingOverviewForCurrentUser(options?: {
  checkoutSessionId?: string | null;
}): Promise<BillingOverview | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("id, email, plan_type, subscription_status, billing_period")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const checkoutSessionId = options?.checkoutSessionId?.trim();
  if (checkoutSessionId && getStripeConfig().isConfigured) {
    try {
      await syncCheckoutSessionForProfile(checkoutSessionId, profile.id);
    } catch (error) {
      console.error("Failed to sync checkout session for billing:", error);
    }
  }

  const { data: currentProfile } = await supabase
    .from("profile")
    .select("id, email, plan_type, subscription_status, billing_period")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!currentProfile) {
    return null;
  }

  let planType = (currentProfile.plan_type === "pro" ? "pro" : "free") as PlanType;
  let subscriptionStatus = (currentProfile.subscription_status ?? "inactive") as SubscriptionStatus;
  let billingPeriod = currentProfile.billing_period;

  const { data: subscriptionRow, error: subscriptionRowError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", currentProfile.id)
    .maybeSingle();

  const stripeSchemaMissing =
    subscriptionRowError?.message.includes("stripe_customer_id") ||
    subscriptionRowError?.message.includes("schema cache");

  if (stripeSchemaMissing) {
    console.error(
      "Stripe billing columns are missing from subscriptions. Run `npm run db:migrate:stripe` or apply supabase/migrations/20260618120000_stripe_subscriptions.sql in Supabase SQL editor.",
    );
  }

  const stripeCustomerId = stripeSchemaMissing
    ? null
    : (subscriptionRow?.stripe_customer_id ?? null);
  const stripeSubscriptionId = stripeSchemaMissing
    ? null
    : (subscriptionRow?.stripe_subscription_id ?? null);

  if (getStripeConfig().isConfigured && !stripeSchemaMissing) {
    try {
      const reconciled = await reconcileActiveSubscriptionForProfile({
        profileId: currentProfile.id,
        profileEmail: currentProfile.email,
        stripeCustomerId,
        stripeSubscriptionId,
        planType: currentProfile.plan_type,
        subscriptionStatus: currentProfile.subscription_status ?? "inactive",
      });

      if (reconciled) {
        const { data: refreshedProfile } = await supabase
          .from("profile")
          .select("plan_type, subscription_status, billing_period")
          .eq("id", currentProfile.id)
          .maybeSingle();

        if (refreshedProfile) {
          planType = (refreshedProfile.plan_type === "pro" ? "pro" : "free") as PlanType;
          subscriptionStatus = (refreshedProfile.subscription_status ??
            "inactive") as SubscriptionStatus;
          billingPeriod = refreshedProfile.billing_period;
        }
      }
    } catch (error) {
      console.error("Failed to reconcile Stripe subscription:", error);
    }
  }

  const { data: refreshedSubscriptionRow, error: refreshedSubscriptionRowError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", currentProfile.id)
    .maybeSingle();

  const refreshedStripeSchemaMissing =
    refreshedSubscriptionRowError?.message.includes("stripe_customer_id") ||
    refreshedSubscriptionRowError?.message.includes("schema cache");

  let resolvedStripeCustomerId = refreshedStripeSchemaMissing
    ? null
    : (refreshedSubscriptionRow?.stripe_customer_id ?? stripeCustomerId);
  const resolvedStripeSubscriptionId = refreshedStripeSchemaMissing
    ? null
    : (refreshedSubscriptionRow?.stripe_subscription_id ?? stripeSubscriptionId);

  let cancelAtPeriodEnd = false;
  let currentPeriodEnd: string | null = null;
  const invoices: BillingInvoice[] = [];

  const { isConfigured } = getStripeConfig();

  if (isConfigured && (resolvedStripeCustomerId || resolvedStripeSubscriptionId)) {
    try {
      const stripe = getStripe();

      if (resolvedStripeSubscriptionId) {
        const stripeSubscription = await stripe.subscriptions.retrieve(resolvedStripeSubscriptionId);
        cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
        currentPeriodEnd = getSubscriptionPeriodEndIso(stripeSubscription);

        if (!resolvedStripeCustomerId) {
          resolvedStripeCustomerId =
            typeof stripeSubscription.customer === "string"
              ? stripeSubscription.customer
              : stripeSubscription.customer?.id ?? null;
        }
      }

      const invoiceList = resolvedStripeCustomerId
        ? await stripe.invoices.list({
            customer: resolvedStripeCustomerId,
            limit: 24,
          })
        : await stripe.invoices.list({
            subscription: resolvedStripeSubscriptionId!,
            limit: 24,
          });

      for (const invoice of invoiceList.data) {
        invoices.push({
          id: invoice.id,
          date: new Date(invoice.created * 1000).toISOString(),
          amount: formatCurrency(invoice.amount_paid || invoice.total, invoice.currency),
          status: formatInvoiceStatus(invoice.status ?? "unknown"),
          invoiceUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
        });
      }
    } catch (error) {
      console.error("Failed to fetch Stripe billing data:", error);
    }
  }

  const isActivePro = isProPlan(planType) && isActiveSubscription(subscriptionStatus);
  const canCancel = isActivePro && !cancelAtPeriodEnd;
  const canResume = isActivePro && cancelAtPeriodEnd;

  return {
    planType,
    subscriptionStatus,
    billingPeriod,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    canCancel,
    canResume,
    invoices,
  };
}

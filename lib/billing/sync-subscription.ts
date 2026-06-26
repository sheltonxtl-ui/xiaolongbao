import type { PlanType, SubscriptionStatus } from "@/lib/billing/plans";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getSubscriptionPeriodEndIso } from "@/lib/billing/stripe-subscription";
import { getStripe } from "@/lib/stripe/server";

function toDateColumnValue(isoDate: string | null | undefined): string | null {
  if (!isoDate) {
    return null;
  }

  return isoDate.slice(0, 10);
}

async function resolveBillingPeriodEnd(
  stripeSubscriptionId: string | null | undefined,
  explicitEnd: string | null | undefined,
): Promise<string | null> {
  if (explicitEnd) {
    return toDateColumnValue(explicitEnd);
  }

  if (!stripeSubscriptionId) {
    return null;
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
    return toDateColumnValue(getSubscriptionPeriodEndIso(subscription));
  } catch {
    return null;
  }
}

type SyncSubscriptionInput = {
  profileId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  /** Next billing period end as YYYY-MM-DD for profile.billing_period (date column). */
  billingPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

function isMissingStripeColumnsError(message: string): boolean {
  return (
    message.includes("stripe_customer_id") ||
    message.includes("stripe_subscription_id") ||
    message.includes("schema cache")
  );
}

export async function syncSubscriptionForProfile(input: SyncSubscriptionInput) {
  const supabase = createAdminSupabaseClient();

  const { error: profileError } = await supabase
    .from("profile")
    .update({
      plan_type: input.plan,
      subscription_status: input.status,
      billing_period: input.billingPeriodEnd ?? null,
    })
    .eq("id", input.profileId);

  if (profileError) {
    throw new Error(`Failed to update profile plan: ${profileError.message}`);
  }

  const subscriptionRow = {
    user_id: input.profileId,
    plan: input.plan,
    status: input.status,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .upsert(subscriptionRow, { onConflict: "user_id" });

  if (subscriptionError) {
    if (isMissingStripeColumnsError(subscriptionError.message)) {
      throw new Error(
        "Stripe billing columns are missing from the subscriptions table. Run `npm run db:migrate:stripe` after adding SUPABASE_DB_PASSWORD to .env.local, or apply supabase/migrations/20260618120000_stripe_subscriptions.sql in the Supabase SQL editor.",
      );
    }

    throw new Error(`Failed to upsert subscription row: ${subscriptionError.message}`);
  }
}

export async function activateProSubscription(input: {
  profileId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  billingPeriodEnd?: string | null;
}) {
  const billingPeriodEnd = await resolveBillingPeriodEnd(
    input.stripeSubscriptionId,
    input.billingPeriodEnd,
  );

  await syncSubscriptionForProfile({
    profileId: input.profileId,
    plan: "pro",
    status: "active",
    billingPeriodEnd,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
  });
}

export async function deactivateProSubscription(profileId: string) {
  await syncSubscriptionForProfile({
    profileId,
    plan: "free",
    status: "canceled",
    billingPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });
}

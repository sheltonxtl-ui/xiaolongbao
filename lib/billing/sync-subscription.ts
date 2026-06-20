import type { PlanType, SubscriptionStatus } from "@/lib/billing/plans";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SyncSubscriptionInput = {
  profileId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  billingPeriod?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

export async function syncSubscriptionForProfile(input: SyncSubscriptionInput) {
  const supabase = createAdminSupabaseClient();

  const { error: profileError } = await supabase
    .from("profile")
    .update({
      plan_type: input.plan,
      subscription_status: input.status,
      billing_period: input.billingPeriod ?? (input.plan === "pro" ? "month" : null),
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
    throw new Error(`Failed to upsert subscription row: ${subscriptionError.message}`);
  }
}

export async function activateProSubscription(input: {
  profileId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  await syncSubscriptionForProfile({
    profileId: input.profileId,
    plan: "pro",
    status: "active",
    billingPeriod: "month",
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
  });
}

export async function deactivateProSubscription(profileId: string) {
  await syncSubscriptionForProfile({
    profileId,
    plan: "free",
    status: "canceled",
    billingPeriod: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });
}

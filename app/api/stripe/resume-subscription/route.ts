import { NextResponse } from "next/server";
import { isActiveSubscription } from "@/lib/billing/plans";
import { resolveActiveStripeSubscriptionForProfile } from "@/lib/billing/resolve-stripe-subscription";
import { activateProSubscription } from "@/lib/billing/sync-subscription";
import { getSubscriptionPeriodEndIso } from "@/lib/billing/stripe-subscription";
import { getStripeConfig, stripeConfigErrorMessage } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const config = getStripeConfig();
  if (!config.isConfigured) {
    return NextResponse.json({ error: stripeConfigErrorMessage(config) }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("id, email, subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found for this account." }, { status: 404 });
  }

  if (!isActiveSubscription(profile.subscription_status)) {
    return NextResponse.json({ error: "No active subscription to resume." }, { status: 409 });
  }

  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", profile.id)
    .maybeSingle();

  const resolved = await resolveActiveStripeSubscriptionForProfile({
    profileEmail: profile.email,
    stripeCustomerId: subscriptionRow?.stripe_customer_id ?? null,
    stripeSubscriptionId: subscriptionRow?.stripe_subscription_id ?? null,
  });

  if (!resolved?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No Stripe subscription found for this account." }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(resolved.stripeSubscriptionId);

    if (!stripeSubscription.cancel_at_period_end) {
      return NextResponse.json({
        cancelAtPeriodEnd: false,
        currentPeriodEnd: getSubscriptionPeriodEndIso(stripeSubscription),
      });
    }

    const updated = await stripe.subscriptions.update(resolved.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await activateProSubscription({
      profileId: profile.id,
      stripeCustomerId: resolved.stripeCustomerId,
      stripeSubscriptionId: resolved.stripeSubscriptionId,
    });

    return NextResponse.json({
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: getSubscriptionPeriodEndIso(updated),
    });
  } catch (error) {
    console.error("Stripe subscription resume error:", error);
    return NextResponse.json({ error: "Could not resume subscription. Try again shortly." }, { status: 500 });
  }
}

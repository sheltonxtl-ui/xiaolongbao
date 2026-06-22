import { NextResponse } from "next/server";
import {
  getStripeConfig,
  stripeCheckoutErrorMessage,
  stripeConfigErrorMessage,
} from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const config = getStripeConfig();
  if (!config.isConfigured) {
    return NextResponse.json({ error: stripeConfigErrorMessage(config) }, { status: 503 });
  }

  const { proPriceId, appUrl } = config;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to upgrade to Pro." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("id, email, plan_type, subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found for this account." }, { status: 404 });
  }

  if (profile.plan_type === "pro" && profile.subscription_status === "active") {
    return NextResponse.json({ error: "Your account is already on Pro." }, { status: 409 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: proPriceId, quantity: 1 }],
      managed_payments: { enabled: true },
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing/cancel`,
      client_reference_id: profile.id,
      customer_email: profile.email || user.email || undefined,
      metadata: {
        profile_id: profile.id,
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          profile_id: profile.id,
          supabase_user_id: user.id,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json({ error: stripeCheckoutErrorMessage(error) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { activateProSubscription, deactivateProSubscription } from "@/lib/billing/sync-subscription";
import { getStripeConfig } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

function profileIdFromMetadata(metadata: Stripe.Metadata | null | undefined): string | null {
  const profileId = metadata?.profile_id?.trim();
  return profileId || null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const profileId = profileIdFromMetadata(session.metadata) ?? session.client_reference_id;
  if (!profileId) {
    console.error("checkout.session.completed missing profile_id metadata");
    return;
  }

  await activateProSubscription({
    profileId,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    stripeSubscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const profileId = profileIdFromMetadata(subscription.metadata);
  if (!profileId) {
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  if (isActive) {
    await activateProSubscription({
      profileId,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null,
      stripeSubscriptionId: subscription.id,
    });
    return;
  }

  if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired"
  ) {
    await deactivateProSubscription(profileId);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const profileId = profileIdFromMetadata(subscription.metadata);
  if (!profileId) {
    return;
  }

  await deactivateProSubscription(profileId);
}

export async function POST(request: Request) {
  const { webhookSecret } = getStripeConfig();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

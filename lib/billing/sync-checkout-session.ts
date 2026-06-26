import { activateProSubscription } from "@/lib/billing/sync-subscription";
import { stripeResourceId } from "@/lib/billing/stripe-ids";
import { getStripe } from "@/lib/stripe/server";
import type Stripe from "stripe";

type SyncCheckoutResult =
  | { synced: true }
  | { synced: false; reason: "not_paid" | "not_found" | "wrong_profile" };

async function resolveCheckoutStripeIds(
  session: Stripe.Checkout.Session,
): Promise<{ stripeCustomerId: string | null; stripeSubscriptionId: string | null }> {
  const stripe = getStripe();
  let stripeCustomerId = stripeResourceId(session.customer);
  let stripeSubscriptionId = stripeResourceId(session.subscription);

  if (!stripeSubscriptionId && session.invoice) {
    const invoiceId =
      typeof session.invoice === "string" ? session.invoice : session.invoice.id;
    if (invoiceId) {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      stripeSubscriptionId = stripeResourceId(
        invoice.parent?.subscription_details?.subscription ?? null,
      );
      stripeCustomerId = stripeCustomerId ?? stripeResourceId(invoice.customer);
    }
  }

  if (!stripeSubscriptionId && stripeCustomerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 5,
    });

    const active = subscriptions.data.find(
      (subscription) => subscription.status === "active" || subscription.status === "trialing",
    );

    stripeSubscriptionId = active?.id ?? subscriptions.data[0]?.id ?? null;
  }

  if (stripeSubscriptionId && !stripeCustomerId) {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    stripeCustomerId = stripeResourceId(subscription.customer);
  }

  return { stripeCustomerId, stripeSubscriptionId };
}

async function resolveStripeCustomerByEmail(email: string | null | undefined): Promise<string | null> {
  const normalizedEmail = email?.trim();
  if (!normalizedEmail) {
    return null;
  }

  const customers = await getStripe().customers.list({ email: normalizedEmail, limit: 1 });
  return customers.data[0]?.id ?? null;
}

export async function syncCheckoutSessionForProfile(
  sessionId: string,
  profileId: string,
): Promise<SyncCheckoutResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer", "subscription", "invoice"],
  });

  const sessionProfileId =
    session.metadata?.profile_id?.trim() || session.client_reference_id?.trim() || null;

  if (!sessionProfileId || sessionProfileId !== profileId) {
    return { synced: false, reason: "wrong_profile" };
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return { synced: false, reason: "not_paid" };
  }

  const { stripeCustomerId, stripeSubscriptionId } = await resolveCheckoutStripeIds(session);

  await activateProSubscription({
    profileId,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  return { synced: true };
}

export async function reconcileActiveSubscriptionForProfile(input: {
  profileId: string;
  profileEmail?: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planType: string;
  subscriptionStatus: string;
}): Promise<boolean> {
  const missingStripeLink = !input.stripeCustomerId || !input.stripeSubscriptionId;
  const alreadyActivePro =
    input.planType === "pro" && input.subscriptionStatus === "active";

  if (alreadyActivePro && !missingStripeLink) {
    return false;
  }

  const stripe = getStripe();
  let stripeCustomerId = input.stripeCustomerId;
  let stripeSubscriptionId = input.stripeSubscriptionId;

  if (stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      if (subscription.status === "active" || subscription.status === "trialing") {
        await activateProSubscription({
          profileId: input.profileId,
          stripeCustomerId: stripeResourceId(subscription.customer) ?? stripeCustomerId,
          stripeSubscriptionId: subscription.id,
        });
        return true;
      }
    } catch {
      // Fall through to customer lookup.
    }
  }

  if (!stripeCustomerId) {
    stripeCustomerId = await resolveStripeCustomerByEmail(input.profileEmail);
  }

  if (!stripeCustomerId) {
    return false;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 5,
  });

  const active = subscriptions.data.find(
    (subscription) => subscription.status === "active" || subscription.status === "trialing",
  );

  if (!active) {
    return false;
  }

  await activateProSubscription({
    profileId: input.profileId,
    stripeCustomerId,
    stripeSubscriptionId: active.id,
  });

  return true;
}

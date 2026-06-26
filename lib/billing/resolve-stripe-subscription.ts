import { getStripe } from "@/lib/stripe/server";
import { stripeResourceId } from "@/lib/billing/stripe-ids";

export async function resolveActiveStripeSubscriptionForProfile(input: {
  profileEmail?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<{ stripeCustomerId: string; stripeSubscriptionId: string } | null> {
  const stripe = getStripe();
  let stripeCustomerId = input.stripeCustomerId ?? null;
  let stripeSubscriptionId = input.stripeSubscriptionId ?? null;

  if (stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      if (subscription.status === "active" || subscription.status === "trialing") {
        const customerId = stripeResourceId(subscription.customer) ?? stripeCustomerId;
        if (!customerId) {
          return null;
        }

        return {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
        };
      }
    } catch {
      stripeSubscriptionId = null;
    }
  }

  if (!stripeCustomerId && input.profileEmail) {
    const customers = await stripe.customers.list({
      email: input.profileEmail.trim(),
      limit: 1,
    });
    stripeCustomerId = customers.data[0]?.id ?? null;
  }

  if (!stripeCustomerId) {
    return null;
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
    return null;
  }

  return {
    stripeCustomerId,
    stripeSubscriptionId: active.id,
  };
}

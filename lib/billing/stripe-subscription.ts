import type Stripe from "stripe";

export function getSubscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  const items = subscription.items?.data ?? [];
  if (items.length > 0) {
    return Math.max(...items.map((item) => item.current_period_end));
  }

  return subscription.cancel_at ?? null;
}

export function getSubscriptionPeriodEndIso(subscription: Stripe.Subscription): string | null {
  const unix = getSubscriptionPeriodEndUnix(subscription);
  return unix ? new Date(unix * 1000).toISOString() : null;
}

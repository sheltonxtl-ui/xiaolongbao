import type Stripe from "stripe";

export function stripeResourceId(
  value: string | Stripe.Customer | Stripe.Subscription | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if ("deleted" in value && value.deleted) {
    return null;
  }

  return value.id ?? null;
}

import Stripe from "stripe";
import { getStripeConfig } from "./config";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const { secretKey, isConfigured } = getStripeConfig();
  if (!isConfigured) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID in .env.local.",
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

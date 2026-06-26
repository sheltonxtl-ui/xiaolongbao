import { resolveAppUrl } from "@/lib/app-url";

export type StripeConfig = {
  secretKey: string;
  webhookSecret: string;
  proPriceId: string;
  appUrl: string;
  isTestMode: boolean;
  isConfigured: boolean;
  missing: string[];
};

const STRIPE_PRO_PRICE_ID_TEST = "price_1TkFESAsR6FDM5AlaR0PVZuQ";
const STRIPE_PRO_PRICE_ID_LIVE = "price_1TjoczAsR6FDM5AlxDBaGeaU";

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

function resolveSecretKey(): string {
  return (
    trimEnv(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) ||
    trimEnv(process.env.STRIPE_API_KEY) ||
    (process.env.NODE_ENV === "development"
      ? trimEnv(process.env.STRIPE_TEST_SECRET_KEY)
      : trimEnv(process.env.STRIPE_LIVE_SECRET_KEY))
  );
}

function resolveProPriceId(isTestMode: boolean): string {
  return isTestMode ? STRIPE_PRO_PRICE_ID_TEST : STRIPE_PRO_PRICE_ID_LIVE;
}

export function getStripeConfig(): StripeConfig {
  const secretKey = resolveSecretKey();
  const isTestMode = secretKey.startsWith("sk_test_");
  const webhookSecret = trimEnv(process.env.STRIPE_WEBHOOK_SECRET);
  const proPriceId = resolveProPriceId(isTestMode);
  const appUrl = resolveAppUrl();

  const missing: string[] = [];
  if (!secretKey) {
    missing.push(
      "NEXT_PUBLIC_STRIPE_SECRET_KEY (sk_test_... from https://dashboard.stripe.com/test/apikeys)",
    );
  } else if (!secretKey.startsWith("sk_")) {
    missing.push(
      "NEXT_PUBLIC_STRIPE_SECRET_KEY (must be a secret key starting with sk_)",
    );
  }

  return {
    secretKey,
    webhookSecret,
    proPriceId,
    appUrl: appUrl.replace(/\/$/, ""),
    isTestMode,
    isConfigured: missing.length === 0,
    missing,
  };
}

export function stripeCheckoutErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Could not start checkout. Try again shortly.";
  }

  const stripeError = error as { message?: string; param?: string };
  const message = stripeError.message?.trim();
  if (!message) {
    return "Could not start checkout. Try again shortly.";
  }

  if (message.includes("a similar object exists in live mode, but a test mode key was used")) {
    return "Stripe test keys require a test-mode price. Update STRIPE_PRO_PRICE_ID_TEST in lib/stripe/config.ts.";
  }

  if (message.includes("a similar object exists in test mode, but a live mode key was used")) {
    return "Stripe live keys require a live-mode price. Update STRIPE_PRO_PRICE_ID_LIVE in lib/stripe/config.ts.";
  }

  if (message.includes("product tax code is missing")) {
    return "This subscription product is missing a Managed Payments tax code in Stripe. Edit the product in Stripe and choose a tax code labeled “Eligible for Managed Payments”.";
  }

  return message;
}

export function stripeConfigErrorMessage(config: StripeConfig): string {
  if (config.isConfigured) {
    return "";
  }

  if (config.missing.length === 0) {
    return "Stripe is not configured on this server.";
  }

  return `Stripe is not configured. Add to .env.local: ${config.missing.join(", ")}. Restart the dev server after saving.`;
}

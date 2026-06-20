export type StripeConfig = {
  secretKey: string;
  webhookSecret: string;
  proPriceId: string;
  appUrl: string;
  isConfigured: boolean;
  missing: string[];
};

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

function resolveSecretKey(): string {
  return (
    trimEnv(process.env.STRIPE_SECRET_KEY) ||
    trimEnv(process.env.STRIPE_API_KEY) ||
    (process.env.NODE_ENV === "development"
      ? trimEnv(process.env.STRIPE_TEST_SECRET_KEY)
      : trimEnv(process.env.STRIPE_LIVE_SECRET_KEY))
  );
}

export function getStripeConfig(): StripeConfig {
  const secretKey = resolveSecretKey();
  const webhookSecret = trimEnv(process.env.STRIPE_WEBHOOK_SECRET);
  const proPriceId = trimEnv(process.env.STRIPE_PRO_PRICE_ID);
  const appUrl =
    trimEnv(process.env.NEXT_PUBLIC_APP_URL) ||
    trimEnv(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  const missing: string[] = [];
  if (!secretKey) {
    missing.push(
      "STRIPE_SECRET_KEY (sk_test_... from https://dashboard.stripe.com/test/apikeys)",
    );
  } else if (!secretKey.startsWith("sk_")) {
    missing.push("STRIPE_SECRET_KEY (must be a secret key starting with sk_)");
  }
  if (!proPriceId) {
    missing.push("STRIPE_PRO_PRICE_ID");
  } else if (!proPriceId.startsWith("price_")) {
    missing.push("STRIPE_PRO_PRICE_ID (must start with price_)");
  }

  return {
    secretKey,
    webhookSecret,
    proPriceId,
    appUrl: appUrl.replace(/\/$/, ""),
    isConfigured: missing.length === 0,
    missing,
  };
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

export type PlanType = "free" | "pro";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";

export const PRO_FEATURES = [
  "Unlimited decks & cards",
  "Document upload (RAG)",
  "Export: PDF & Anki",
  "Public sharing",
  "Analytics",
  "Higher-quality AI model",
] as const;

export function isProPlan(planType: string | null | undefined): boolean {
  return planType === "pro";
}

export function isActiveSubscription(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

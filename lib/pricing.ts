export const PRO_PRICE_LABEL = "$9";
export const PRO_INTERVAL = "/month";

export type PlanId = "free" | "pro";

export const planHighlights: Record<
  PlanId,
  { name: string; price: string; interval: string; blurb: string; cta: string; href: string }
> = {
  free: {
    name: "Free",
    price: "$0",
    interval: "",
    blurb: "Start studying today—no card required.",
    cta: "Get started free",
    href: "/signup",
  },
  pro: {
    name: "Pro",
    price: PRO_PRICE_LABEL,
    interval: PRO_INTERVAL,
    blurb: "Unlimited decks, uploads, and exports.",
    cta: "Upgrade to Pro",
    href: "/signup",
  },
};

export const comparisonRows: {
  feature: string;
  free: string;
  pro: string;
  proOnly?: boolean;
}[] = [
  { feature: "Decks", free: "3 total", pro: "Unlimited" },
  { feature: "Cards per deck", free: "20", pro: "Unlimited" },
  { feature: "Paste notes → flashcards", free: "Yes", pro: "Yes" },
  {
    feature: "Document upload (RAG)",
    free: "—",
    pro: "Yes",
    proOnly: true,
  },
  { feature: "Export (PDF / Anki)", free: "—", pro: "Yes", proOnly: true },
  { feature: "Public sharing", free: "—", pro: "Yes", proOnly: true },
  { feature: "Analytics", free: "—", pro: "Yes", proOnly: true },
  { feature: "AI model quality", free: "Standard", pro: "Higher quality" },
];

export const faqItems: { q: string; a: string }[] = [
  {
    q: "What happens when I hit the free limits?",
    a: "You can keep studying existing decks, but you won’t be able to create new decks beyond three, or add more than 20 cards per deck. Upgrade to Pro anytime for unlimited decks and cards.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Yes. If you cancel, you keep Pro until the end of the billing period, then your workspace moves back to Free limits.",
  },
  {
    q: "Do you train on my notes?",
    a: "We use your content only to generate and improve your flashcards within the product. See our privacy policy for details (placeholder).",
  },
  {
    q: "Is there a student discount?",
    a: "We’re exploring verified student pricing—email us from your .edu address (placeholder link).",
  },
];

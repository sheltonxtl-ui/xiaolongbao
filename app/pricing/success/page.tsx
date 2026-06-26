import type { Metadata } from "next";
import { redirect } from "next/navigation";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export const metadata: Metadata = {
  title: "Welcome to Pro",
  description: "Your Pro subscription is active.",
};

export default async function PricingSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim();

  if (sessionId) {
    redirect(`/billing?session_id=${encodeURIComponent(sessionId)}&checkout=success`);
  }

  redirect("/billing");
}

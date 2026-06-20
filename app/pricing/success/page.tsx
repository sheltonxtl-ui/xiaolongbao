import type { Metadata } from "next";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text, TextLink } from "@/components/catalyst/text";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Welcome to Pro",
  description: "Your Pro subscription is active.",
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PricingSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id?.trim();

  return (
    <>
      <SiteHeader />
      <main className="py-16 sm:py-24">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-950/10 bg-white p-8 text-center shadow-sm ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10">
            <CheckCircleIcon className="mx-auto size-14 text-indigo-600 dark:text-indigo-400" />
            <Heading level={1} className="mt-6">
              Thanks for subscribing!
            </Heading>
            <Text className="mt-3">
              Your payment was received. Pro features unlock as soon as Stripe confirms your
              subscription—usually within a few seconds.
            </Text>
            {sessionId ? (
              <Text className="mt-2 text-xs">
                Reference: <span className="font-mono">{sessionId}</span>
              </Text>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button href="/decks" color="indigo">
                Go to my decks
              </Button>
              <Button href="/generate" outline>
                Generate flashcards
              </Button>
            </div>
            <Text className="mt-6 text-sm">
              Questions? Email{" "}
              <TextLink href="mailto:support@xiaolongbao.app">support@xiaolongbao.app</TextLink>
            </Text>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

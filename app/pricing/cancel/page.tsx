import type { Metadata } from "next";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text, TextLink } from "@/components/catalyst/text";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Checkout canceled",
  description: "Your checkout was canceled.",
};

export default function PricingCancelPage() {
  return (
    <>
      <SiteHeader />
      <main className="py-16 sm:py-24">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-950/10 bg-white p-8 text-center shadow-sm ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10">
            <Heading level={1}>Checkout canceled</Heading>
            <Text className="mt-3">
              No worries—you weren&apos;t charged. You can upgrade whenever you&apos;re ready.
            </Text>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button href="/pricing/upgrade" color="indigo">
                Try again
              </Button>
              <Button href="/pricing" outline>
                Compare plans
              </Button>
            </div>
            <Text className="mt-6 text-sm">
              Continue on the free plan or{" "}
              <TextLink href="/decks">return to your decks</TextLink>.
            </Text>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

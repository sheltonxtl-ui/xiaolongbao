import { CheckIcon } from "@heroicons/react/20/solid";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text, TextLink } from "@/components/catalyst/text";
import { UpgradeToProButton } from "@/components/billing/UpgradeToProButton";
import { PRO_FEATURES } from "@/lib/billing/plans";
import { PRO_INTERVAL, PRO_PRICE_LABEL } from "@/lib/pricing";

type ProCheckoutPanelProps = {
  isSignedIn: boolean;
  isAlreadyPro: boolean;
};

export function ProCheckoutPanel({ isSignedIn, isAlreadyPro }: ProCheckoutPanelProps) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-950/10 bg-white p-8 shadow-sm ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Subheading level={2}>Pro plan</Subheading>
          <Heading level={1} className="mt-2">
            {PRO_PRICE_LABEL}
            <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
              {PRO_INTERVAL}
            </span>
          </Heading>
        </div>
        <Badge color="indigo">Managed Payments</Badge>
      </div>

      <Text className="mt-4">
        Unlimited decks, document uploads, exports, and sharing. Tax and compliance are handled
        through Stripe Managed Payments at checkout.
      </Text>

      <Divider className="my-8" />

      <ul className="space-y-3">
        {PRO_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <CheckIcon className="mt-0.5 size-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        {isAlreadyPro ? (
          <>
            <Button href="/decks" color="indigo" className="w-full">
              You&apos;re on Pro — open decks
            </Button>
            <Text className="text-center text-sm">
              Your subscription is active. Manage billing from your Stripe receipt or account
              settings when available.
            </Text>
          </>
        ) : isSignedIn ? (
          <UpgradeToProButton label="Continue to secure checkout" className="w-full" />
        ) : (
          <>
            <Button href="/sign-in?next=/pricing/upgrade" color="indigo" className="w-full">
              Sign in to upgrade
            </Button>
            <Text className="text-center text-sm">
              New here?{" "}
              <TextLink href="/signup?next=/pricing/upgrade">Create a free account</TextLink> first.
            </Text>
          </>
        )}
      </div>

      <Text className="mt-6 text-center text-xs">
        You&apos;ll enter payment details on Stripe&apos;s hosted checkout page. Cancel anytime from
        your billing portal when connected.
      </Text>
    </div>
  );
}

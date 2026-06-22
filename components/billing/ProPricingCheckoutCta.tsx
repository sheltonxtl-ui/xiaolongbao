"use client";

import Link from "next/link";
import { UpgradeToProButton } from "@/components/billing/UpgradeToProButton";

type ProPricingCheckoutCtaProps = {
  isSignedIn: boolean;
  label?: string;
};

export function ProPricingCheckoutCta({
  isSignedIn,
  label = "Upgrade to Pro",
}: ProPricingCheckoutCtaProps) {
  if (!isSignedIn) {
    return (
      <div className="mt-8 space-y-2">
        <Link
          href="/sign-in?next=/pricing"
          className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Sign in to upgrade
        </Link>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          New here?{" "}
          <Link
            href="/signup?next=/pricing"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Create a free account
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <UpgradeToProButton
        label={label}
        className="[&_button]:w-full [&_button]:rounded-full [&_button]:py-3"
      />
    </div>
  );
}

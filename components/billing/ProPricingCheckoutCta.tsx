"use client";

import { UpgradeToProButton } from "@/components/billing/UpgradeToProButton";

type ProPricingCheckoutCtaProps = {
  label?: string;
};

export function ProPricingCheckoutCta({ label = "Upgrade to Pro" }: ProPricingCheckoutCtaProps) {
  return (
    <div className="mt-8">
      <UpgradeToProButton
        label={label}
        className="[&_button]:w-full [&_button]:rounded-full [&_button]:py-3"
      />
    </div>
  );
}

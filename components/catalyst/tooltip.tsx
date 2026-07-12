"use client";

import clsx from "clsx";
import { Tooltip } from "@/components/onboarding/FeatureTip";

export { Tooltip };

/** Catalyst-aligned re-export helpers for onboarding tooltips. */
export function HelpTooltip({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex size-4 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300",
        className,
      )}
      title={label}
      aria-label={label}
    >
      ?
    </span>
  );
}

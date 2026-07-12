"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
} from "react";
import clsx from "clsx";
import { useOnboardingOptional } from "@/components/onboarding/onboarding-context";
import {
  CONTEXTUAL_TIPS,
  type ContextualTipId,
} from "@/lib/onboarding/tooltips";

type TooltipProps = {
  content: string;
  children: ReactElement;
  className?: string;
  side?: "top" | "bottom";
};

/** Lightweight hover/focus tooltip for ongoing help. */
export function Tooltip({ content, children, className, side = "top" }: TooltipProps) {
  const tooltipId = useId();

  if (!isValidElement(children)) {
    return children;
  }

  const child = children as ReactElement<{
    "aria-describedby"?: string;
    className?: string;
  }>;

  return (
    <span className={clsx("group relative inline-flex", className)}>
      {cloneElement(child, {
        "aria-describedby": tooltipId,
      })}
      <span
        id={tooltipId}
        role="tooltip"
        className={clsx(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          "invisible group-hover:visible group-focus-within:visible",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          "dark:bg-white dark:text-zinc-950",
        )}
      >
        {content}
      </span>
    </span>
  );
}

type FeatureTipProps = {
  tipId: ContextualTipId;
  children: ReactElement;
  className?: string;
  delayMs?: number;
};

/**
 * Shows at most one first-time callout app-wide, and only after the guided tour
 * is finished. Hover/focus tooltips remain available always.
 */
export function FeatureTip({ tipId, children, className, delayMs = 700 }: FeatureTipProps) {
  const onboarding = useOnboardingOptional();
  const tip = CONTEXTUAL_TIPS[tipId];
  const [dismissed, setDismissed] = useState(false);
  const [delayPassed, setDelayPassed] = useState(false);

  const seen = onboarding?.hasSeenTooltip(tipId) ?? true;
  const tourOpen = onboarding?.isTourOpen ?? false;
  const hasCompletedTutorial = onboarding?.hasCompletedTutorial ?? false;
  const isActiveTip = onboarding?.activeFeatureTipId === tipId;
  const canClaim =
    Boolean(onboarding) && hasCompletedTutorial && !tourOpen && !seen && !dismissed;

  useEffect(() => {
    if (!canClaim || !onboarding) return;

    const claimedOk = onboarding.claimFeatureTip(tipId);
    if (!claimedOk) return;

    const timer = window.setTimeout(() => setDelayPassed(true), delayMs);
    return () => {
      window.clearTimeout(timer);
      onboarding.releaseFeatureTip(tipId);
    };
  }, [canClaim, delayMs, onboarding, tipId]);

  function dismiss() {
    setDismissed(true);
    setDelayPassed(false);
    onboarding?.markTooltipSeen(tipId);
    onboarding?.releaseFeatureTip(tipId);
  }

  const showFirstTime = canClaim && isActiveTip && delayPassed;

  return (
    <span className={clsx("relative inline-flex max-w-full", className)}>
      <Tooltip content={tip.hoverLabel} className="w-full max-w-full">
        {children}
      </Tooltip>

      {showFirstTime ? (
        <div
          role="status"
          className="absolute top-full left-1/2 z-[60] mt-3 w-64 -translate-x-1/2 rounded-xl bg-white p-3 text-left shadow-xl ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10"
        >
          <div className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-white ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10" />
          <p className="relative text-sm font-semibold text-zinc-950 dark:text-white">{tip.title}</p>
          <p className="relative mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            {tip.body}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="relative mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Got it
          </button>
        </div>
      ) : null}
    </span>
  );
}

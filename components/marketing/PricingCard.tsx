import Link from "next/link";
import type { ReactNode } from "react";

export type PricingCardProps = {
  name: string;
  price: string;
  interval?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  cta?: ReactNode;
  emphasized?: boolean;
  badge?: string;
};

export function PricingCard({
  name,
  price,
  interval = "",
  description,
  features,
  ctaLabel,
  ctaHref,
  cta,
  emphasized,
  badge,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 transition hover:shadow-lg ${
        emphasized
          ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-950/30"
          : "border-zinc-200 bg-background dark:border-zinc-800"
      }`}
    >
      {badge ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-foreground">{name}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          {price}
        </span>
        {interval ? (
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {interval}
          </span>
        ) : null}
      </p>
      <ul className="mt-8 flex-1 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
        {features.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-0.5 text-indigo-600 dark:text-indigo-400" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {cta ?? (
        <Link
          href={ctaHref}
          className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
            emphasized
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "border border-zinc-300 bg-background text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
          }`}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

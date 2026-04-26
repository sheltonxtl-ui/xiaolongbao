import type { ReactNode } from "react";

type FeatureItem = {
  title: string;
  description: string;
  icon: ReactNode;
};

type FeatureSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  features: FeatureItem[];
};

export function FeatureSection({
  id,
  eyebrow,
  title,
  subtitle,
  features,
}: FeatureSectionProps) {
  return (
    <section id={id} className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        <ul className="mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 transition hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-indigo-500/40"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

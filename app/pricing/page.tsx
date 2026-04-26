import type { Metadata } from "next";
import Link from "next/link";
import { FAQSection } from "@/components/marketing/FAQSection";
import { PricingCard } from "@/components/marketing/PricingCard";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { comparisonRows, faqItems, planHighlights } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free for getting started. Pro for unlimited decks, document upload, exports, sharing, and analytics.",
};

export default function PricingPage() {
  const free = planHighlights.free;
  const pro = planHighlights.pro;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-zinc-200 py-16 dark:border-zinc-800 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              Pricing
            </p>
            <h1 className="mx-auto mt-3 max-w-3xl text-center text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Start free. Upgrade when Recall is saving you real time.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-600 dark:text-zinc-400">
              Value-based limits: use the free tier to learn the product—then unlock Pro when you
              hit deck caps or need uploads and exports.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-24" aria-labelledby="plans-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 id="plans-heading" className="sr-only">
              Plans
            </h2>
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
              <PricingCard
                name={free.name}
                price={free.price}
                description={free.blurb}
                features={[
                  "3 decks total",
                  "20 cards per deck",
                  "Paste notes → AI flashcards",
                  "Study mode",
                ]}
                ctaLabel={free.cta}
                ctaHref={free.href}
              />
              <PricingCard
                name={pro.name}
                price={pro.price}
                interval={pro.interval}
                description={pro.blurb}
                features={[
                  "Unlimited decks & cards",
                  "Document upload (RAG)",
                  "Export: PDF & Anki",
                  "Public sharing",
                  "Analytics",
                  "Higher-quality AI model",
                ]}
                ctaLabel={pro.cta}
                ctaHref={pro.href}
                emphasized
                badge="Best for exam season"
              />
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50/80 py-16 dark:border-zinc-800 dark:bg-zinc-900/40 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Compare plans
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
              Scan the differences in seconds—everything else works the same.
            </p>
            <div className="mt-12 overflow-x-auto rounded-2xl border border-zinc-200 bg-background dark:border-zinc-800">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <caption className="sr-only">Feature comparison for Free and Pro</caption>
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th scope="col" className="px-6 py-4 font-semibold text-foreground">
                      Feature
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold text-foreground">
                      Free
                    </th>
                    <th scope="col" className="bg-indigo-50/80 px-6 py-4 font-semibold text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                    >
                      <th
                        scope="row"
                        className="px-6 py-4 font-medium text-foreground"
                      >
                        {row.feature}
                        {row.proOnly ? (
                          <span className="ml-2 rounded-md bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                            Pro
                          </span>
                        ) : null}
                      </th>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{row.free}</td>
                      <td className="bg-indigo-50/50 px-6 py-4 text-foreground dark:bg-indigo-950/20">
                        {row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24" aria-labelledby="why-upgrade-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              id="why-upgrade-heading"
              className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Why students upgrade
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-600 dark:text-zinc-400">
              Pro isn’t about removing ads—it’s the moment free stops fitting your semester.
            </p>
            <ul className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
              {[
                {
                  title: "You hit the 3-deck ceiling",
                  body: "Separate courses, labs, and review weeks need space. Pro removes the “which deck do I delete?” decision.",
                },
                {
                  title: "A dense PDF is the source of truth",
                  body: "When notes live in slides or papers, upload + RAG keeps cards grounded in the actual document.",
                },
                {
                  title: "You need Anki or PDF for the way you study",
                  body: "Export meets you where you already review—without retyping cards by hand.",
                },
                {
                  title: "You’re studying with others",
                  body: "Public sharing and analytics help groups align on what to drill before the midterm.",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800"
                >
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FAQSection
          subtitle="Straight answers about limits, privacy, and billing."
          items={faqItems.map((f) => ({ question: f.q, answer: f.a }))}
        />

        <section className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-indigo-600 px-8 py-12 text-center text-white sm:px-12">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Ready for unlimited decks?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-indigo-100">
                Start on Free, invite your study group, and upgrade when you need uploads or exports.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-3.5 font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:w-auto"
                >
                  Get started free
                </Link>
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-indigo-300/60 px-8 py-3.5 font-semibold text-white transition hover:bg-indigo-500/30 sm:w-auto"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

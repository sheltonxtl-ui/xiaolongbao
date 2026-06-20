import type { Metadata } from "next";
import Link from "next/link";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { PricingCard } from "@/components/marketing/PricingCard";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { PRO_INTERVAL, PRO_PRICE_LABEL } from "@/lib/pricing";

export const metadata: Metadata = {
  title: { absolute: "xiaolongbao — AI flashcards from your notes" },
  description:
    "Paste notes, get flashcards in seconds. Built for students who want to study smarter, not longer.",
};

function IconSpark() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />

        <section className="border-y border-zinc-200 bg-zinc-50/80 py-16 dark:border-zinc-800 dark:bg-zinc-900/40 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Manual flashcards steal your night before the exam
                </h2>
                <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                  Rewriting slides into cards is slow, error-prone, and easy to quit. You already
                  did the hard part—taking notes.
                </p>
                <ul className="mt-6 space-y-3 text-zinc-700 dark:text-zinc-300">
                  <li className="flex gap-2">
                    <span className="text-red-500" aria-hidden>
                      ✕
                    </span>
                    <span>30+ minutes per chapter formatting Q&amp;A</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500" aria-hidden>
                      ✕
                    </span>
                    <span>Inconsistent cards that don’t match how you think</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-background p-8 shadow-sm dark:border-indigo-500/30">
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  The xiaolongbao way
                </p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">Paste → generate → study</h3>
                <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                  Drop in a chunk of notes. We structure clear front/back cards you can review
                  immediately—no fluff, no formatting rabbit holes.
                </p>
                <ul className="mt-6 space-y-3 font-medium text-foreground">
                  <li className="flex gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400" aria-hidden>
                      ✓
                    </span>
                    <span>Keep momentum: from notes to deck in under a minute</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400" aria-hidden>
                      ✓
                    </span>
                    <span>Cards tuned for recall, not copy-paste</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <HowItWorksSection />

        <FeatureSection
          eyebrow="Built for busy weeks"
          title="Everything you need to prep faster"
          subtitle="Start free. Upgrade when you outgrow the basics—or when one PDF would save your weekend."
          features={[
            {
              title: "AI generation",
              description:
                "Turn walls of text into balanced cards—definitions, applications, and edge cases.",
              icon: <IconSpark />,
            },
            {
              title: "Study mode",
              description:
                "Focus on recall with a clean flip experience designed for short, repeatable sessions.",
              icon: <IconBook />,
            },
            {
              title: "Sharing",
              description:
                "Share decks with your study group so everyone stops rebuilding the same Anki stack.",
              icon: <IconShare />,
            },
            {
              title: "Document upload",
              description:
                "Pro: upload docs for RAG-backed cards when your notes alone aren’t enough.",
              icon: <IconDoc />,
            },
          ]}
        />

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-14 text-center text-white shadow-xl sm:px-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Reclaim the half-hour you’d spend making ten cards
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
                Students tell us the hardest part isn’t studying—it’s starting. Xiaolongbao removes the
                setup tax so your first review happens today, not “after I finish the cards.”
              </p>
              <p className="mt-6 text-2xl font-bold sm:text-3xl">30 minutes → ~30 seconds</p>
              <p className="mt-2 text-sm text-indigo-200">
                Typical time to first deck for a dense notes page (your mileage may vary).
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24" aria-labelledby="social-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              id="social-heading"
              className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Students are switching to AI-first study flows
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
              Social proof coming soon—placeholder for logos, quotes, or exam results.
            </p>
            <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
              {["Campus pilot", "Study Discord", "STEM society"].map((label) => (
                <figure
                  key={label}
                  className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700"
                >
                  <blockquote className="text-sm text-zinc-500 dark:text-zinc-400">
                    “Quote placeholder—swap with a real student story.”
                  </blockquote>
                  <figcaption className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 py-16 dark:border-zinc-800 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Simple pricing when you’re ready for more
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                Free is generous enough to learn the workflow. Pro unlocks the moments that matter
                mid-semester.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-2">
              <PricingCard
                name="Free"
                price="$0"
                description="Get exam-ready without pulling out a card."
                features={[
                  "3 decks total",
                  "20 cards per deck",
                  "Paste notes → instant cards",
                ]}
                ctaLabel="Get started free"
                ctaHref="/signup"
              />
              <PricingCard
                name="Pro"
                price={PRO_PRICE_LABEL}
                interval={PRO_INTERVAL}
                description="For heavy courseloads and group study."
                features={[
                  "Unlimited decks & cards",
                  "Document upload (RAG)",
                  "Export to PDF & Anki",
                  "Public sharing & analytics",
                  "Higher-quality AI model",
                ]}
                ctaLabel="See Pro details"
                ctaHref="/pricing"
                emphasized
                badge="Most popular"
              />
            </div>
            <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/pricing" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Compare all features
              </Link>
            </p>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-8 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50 sm:px-12">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Your notes are already written. Let’s make them memorable.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
                Join free, build three decks, and upgrade only if xiaolongbao becomes your default before
                finals.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-8 py-3.5 font-semibold text-white transition hover:bg-indigo-500 sm:w-auto"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex w-full items-center justify-center rounded-full border border-zinc-300 px-8 py-3.5 font-semibold text-foreground transition hover:bg-white dark:border-zinc-600 dark:hover:bg-zinc-800 sm:w-auto"
                >
                  View pricing
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

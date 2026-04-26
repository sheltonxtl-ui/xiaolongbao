import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-200">
            AI flashcards for exam week
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Turn Your Notes Into Flashcards in Seconds
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-zinc-600 dark:text-zinc-400">
            Paste lecture notes or readings—get clean Q&amp;A cards instantly.
            Skip the busywork and spend your time actually studying.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/30 sm:w-auto"
            >
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-full border border-zinc-300 bg-background px-8 py-3.5 text-base font-semibold text-foreground transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 sm:w-auto"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Free forever · 3 decks · 20 cards per deck
          </p>
        </div>
      </div>
    </section>
  );
}

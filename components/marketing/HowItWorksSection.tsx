import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ClipboardPaste,
  Sparkles,
} from "lucide-react";

function FlowPreview() {
  return (
    <div
      className="mx-auto mt-12 max-w-xl rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900/50 sm:px-6"
      aria-hidden
    >
      <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        In one flow
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="how-flow-pill how-flow-pill-delay-0 inline-flex items-center rounded-lg border border-zinc-200 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm dark:border-zinc-700">
          Your text
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} />
        <span className="how-flow-pill how-flow-pill-delay-1 inline-flex items-center rounded-lg border border-zinc-200 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm dark:border-zinc-700">
          Q&amp;A cards
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} />
        <span className="how-flow-pill how-flow-pill-delay-2 inline-flex items-center rounded-lg border border-zinc-200 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm dark:border-zinc-700">
          Study
        </span>
      </div>
    </div>
  );
}

const steps = [
  {
    step: 1,
    headline: "Paste Your Notes",
    icon: ClipboardPaste,
    lines: [
      "Paste lecture notes, textbook excerpts, or articles—messy bullets welcome.",
      "Any text works: if you can copy it, we can turn it into cards.",
    ],
  },
  {
    step: 2,
    headline: "AI Generates Flashcards Instantly",
    icon: Sparkles,
    lines: [
      "GPT-4o reads your input and pulls out the ideas worth memorizing.",
      "You get structured question-and-answer flashcards in seconds—not a wall of highlights.",
    ],
  },
  {
    step: 3,
    headline: "Study or Export",
    icon: BookOpen,
    lines: [
      "Study in-app with a simple flip experience; spaced repetition is on the roadmap for Phase 2.",
      "Need Anki or a handout? Export to PDF or Anki on Pro.",
    ],
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-zinc-200 bg-zinc-50/50 py-16 dark:border-zinc-800 dark:bg-zinc-900/30 sm:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How to Generate AI Flashcards in 3 Simple Steps
          </h2>
          <p className="mt-4 text-pretty text-lg text-zinc-600 dark:text-zinc-400">
            No templates. No tedious formatting. From raw notes to review-ready cards before your
            coffee cools.
          </p>
        </div>

        <FlowPreview />

        <ol className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="relative flex flex-col rounded-2xl border border-zinc-200 bg-background p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-indigo-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white"
                    aria-hidden
                  >
                    {item.step}
                  </span>
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  {item.headline}
                </h3>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Jump to the generator, paste a paragraph, and see cards appear in seconds.
          </p>
          <Link
            href="/generate#flashcard-generator"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Try It Now
          </Link>
        </div>
      </div>
    </section>
  );
}

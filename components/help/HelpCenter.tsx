"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Input, InputGroup } from "@/components/catalyst/input";
import { Text, TextLink } from "@/components/catalyst/text";
import { Button } from "@/components/catalyst/button";
import { useOnboardingOptional } from "@/components/onboarding/onboarding-context";

type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  body: string[];
};

type HelpSection = {
  id: string;
  title: string;
  articles: HelpArticle[];
};

const HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    articles: [
      {
        id: "welcome",
        title: "What is Xiaolongbao?",
        summary: "AI-assisted flashcards for focused study.",
        body: [
          "Xiaolongbao helps you turn notes into flashcard decks, study them in-app, and discover community decks.",
          "After your first sign-in, an interactive tutorial walks through the main surfaces. You can skip it and replay anytime from Settings.",
        ],
      },
      {
        id: "first-deck",
        title: "Your first deck",
        summary: "Create, generate, then study.",
        body: [
          "Open Generate from the sidebar, paste notes or import a file, then review the AI draft before saving.",
          "Saved decks appear in Your decks, where you can search, filter, and press Play to study.",
        ],
      },
    ],
  },
  {
    id: "creating-decks",
    title: "Creating Decks",
    articles: [
      {
        id: "new-deck",
        title: "Creating a new deck",
        summary: "Use New Deck or Generate.",
        body: [
          "From Your decks, choose New Deck to open the generation workspace.",
          "You can also start from Generate in the sidebar. Empty libraries show the same call to action.",
        ],
      },
      {
        id: "import",
        title: "Importing existing material",
        summary: "CSV, JSON, PDF, Anki, and more.",
        body: [
          "On the Generate page, switch to Import deck to upload supported files or paste a shared link when available.",
          "After import, review extracted cards the same way you review AI-generated drafts.",
        ],
      },
    ],
  },
  {
    id: "ai-generation",
    title: "AI Generation",
    articles: [
      {
        id: "notes-flow",
        title: "Generating from notes",
        summary: "Paste notes, generate, then edit.",
        body: [
          "Keep notes under the word limit shown on the Generate page so the model stays within context.",
          "Generation streams a draft deck. Edit any card before you save it to your library.",
        ],
      },
      {
        id: "limits",
        title: "Plans and limits",
        summary: "Free and Pro usage.",
        body: [
          "Generation and billing limits depend on your plan. Visit Pricing or Billing for current entitlements.",
        ],
      },
    ],
  },
  {
    id: "studying",
    title: "Studying",
    articles: [
      {
        id: "play",
        title: "Study mode",
        summary: "Flip cards at your pace.",
        body: [
          "Press Play on a deck to enter study mode. Choose term-first or definition-first when prompted.",
          "Use Study options during a session to change orientation. Spaced repetition is planned for a later phase.",
        ],
      },
    ],
  },
  {
    id: "community",
    title: "Community Features",
    articles: [
      {
        id: "explore",
        title: "Browsing Explore",
        summary: "Find and save public decks.",
        body: [
          "Explore lists public decks from the community. Preview a deck, then save it to your library if it helps.",
          "Filter by your decks vs others to focus the list.",
        ],
      },
      {
        id: "sharing",
        title: "Sharing your decks",
        summary: "Publish from the manage page.",
        body: [
          "On a deck’s manage page, enable Share in community to publish. Optionally share anonymously.",
          "You can turn sharing off later; saved copies in other libraries may still exist until removed.",
        ],
      },
    ],
  },
  {
    id: "deck-management",
    title: "Deck Management",
    articles: [
      {
        id: "edit",
        title: "Editing cards",
        summary: "Inline edits on the manage page.",
        body: [
          "Open a deck title from Your decks to manage cards. Add, edit, or remove terms and definitions.",
          "Changes persist as you work so the deck stays ready for study.",
        ],
      },
      {
        id: "delete",
        title: "Deleting and removing",
        summary: "Owned vs saved community decks.",
        body: [
          "Owned decks can be deleted from the library or manage page after confirmation.",
          "Community decks you saved can be removed from your library without deleting the original public deck.",
        ],
      },
    ],
  },
  {
    id: "progress",
    title: "Progress Tracking",
    articles: [
      {
        id: "library-signals",
        title: "Reading your library",
        summary: "Card counts and activity cues.",
        body: [
          "Each deck row shows term and card counts so you can see depth at a glance.",
          "Use Recently updated and search filters to prioritize what to study next.",
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    articles: [
      {
        id: "account",
        title: "Account and billing",
        summary: "Profile, plans, and invoices.",
        body: [
          "Settings covers tutorial replay and help shortcuts. Billing manages your subscription.",
          "Pricing compares Free and Pro features before you upgrade.",
        ],
      },
      {
        id: "replay",
        title: "Replay the tutorial",
        summary: "Restart the interactive tour.",
        body: [
          "Open Settings and choose Replay Interactive Tutorial to walk through the product again.",
          "Progress is saved if you refresh mid-tour, and Skip always exits cleanly.",
        ],
      },
    ],
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    articles: [
      {
        id: "skip-tour",
        title: "Can I skip the tutorial?",
        summary: "Yes — Skip anytime.",
        body: [
          "Use Skip on any step. We’ll mark the tour complete so it won’t auto-start again until you replay it.",
        ],
      },
      {
        id: "mobile",
        title: "Does the tour work on mobile?",
        summary: "Yes, with centered fallbacks.",
        body: [
          "On smaller screens some spotlight targets fall back to a centered coachmark so the explanation stays readable.",
        ],
      },
      {
        id: "data",
        title: "Where is my progress stored?",
        summary: "Profile + local resume cache.",
        body: [
          "Tutorial completion lives on your profile. Active step progress is also cached locally so a refresh can resume mid-tour.",
        ],
      },
    ],
  },
];

function articleMatches(query: string, article: HelpArticle, sectionTitle: string): boolean {
  if (!query) return true;
  const haystack = [sectionTitle, article.title, article.summary, ...article.body]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const onboarding = useOnboardingOptional();
  const normalized = query.trim().toLowerCase();

  const sections = useMemo(() => {
    return HELP_SECTIONS.map((section) => ({
      ...section,
      articles: section.articles.filter((article) =>
        articleMatches(normalized, article, section.title),
      ),
    })).filter((section) => section.articles.length > 0);
  }, [normalized]);

  return (
    <section className="w-full">
      <header className="mb-8">
        <Heading>Help Center</Heading>
        <Text className="mt-2 max-w-2xl">
          Guides for decks, AI generation, studying, community, and account settings. Search or
          expand a section to dig in.
        </Text>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            color="indigo"
            onClick={() => onboarding?.startTutorial({ replay: true })}
            disabled={!onboarding}
          >
            Replay interactive tutorial
          </Button>
          <Button outline href="/settings">
            Open settings
          </Button>
        </div>
      </header>

      <div className="mb-8 max-w-xl">
        <InputGroup>
          <MagnifyingGlassIcon data-slot="icon" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help articles…"
            aria-label="Search help articles"
          />
        </InputGroup>
      </div>

      {sections.length === 0 ? (
        <Text>
          No articles match “{query}”. Try another keyword or{" "}
          <button
            type="button"
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            onClick={() => setQuery("")}
          >
            clear search
          </button>
          .
        </Text>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <details
              key={section.id}
              open={Boolean(normalized) || section.id === "getting-started"}
              className="group rounded-2xl border border-zinc-950/10 bg-white px-5 py-2 dark:border-white/10 dark:bg-zinc-900/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-left [&::-webkit-details-marker]:hidden">
                <Subheading level={2} className="!text-base">
                  {section.title}
                </Subheading>
                <span className="text-zinc-400 transition group-open:rotate-180" aria-hidden="true">
                  ▼
                </span>
              </summary>
              <div className="space-y-4 border-t border-zinc-950/5 pb-4 dark:border-white/5">
                {section.articles.map((article) => (
                  <details
                    key={article.id}
                    className="group/article pt-4 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-white">{article.title}</p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {article.summary}
                        </p>
                      </div>
                      <span
                        className="mt-1 text-zinc-400 transition group-open/article:rotate-180"
                        aria-hidden="true"
                      >
                        ▼
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {article.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      <Text className="mt-10 text-sm">
        Still stuck? Visit{" "}
        <TextLink href="/billing">Billing</TextLink> for plan questions or{" "}
        <TextLink href="/settings">Settings</TextLink> to replay the product tour.
      </Text>
    </section>
  );
}

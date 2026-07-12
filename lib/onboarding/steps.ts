import type { TutorialStep } from "@/lib/onboarding/types";

/**
 * Spotlight tour steps only (welcome + completion are separate dialogs).
 * Add or reorder entries here — the tour UI reads this list at runtime.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "dashboard",
    title: "Your deck library",
    body: "This is your home base. Every deck you create or save from the community appears here so you can search, filter, and jump into study mode.",
    route: "/decks",
    target: "decks-library",
    placement: "bottom",
  },
  {
    id: "nav-decks",
    title: "My Decks",
    body: "Use Decks in the sidebar anytime you want to return to your library.",
    route: "/decks",
    target: "nav-decks",
    placement: "right",
  },
  {
    id: "nav-community",
    title: "Community",
    body: "Explore is where you browse public decks from other learners and save useful sets to your library.",
    route: "/decks",
    target: "nav-explore",
    placement: "right",
  },
  {
    id: "sidebar",
    title: "Navigation sidebar",
    body: "The sidebar is your map of Xiaolongbao — decks, community, AI generate, billing, settings, and help.",
    route: "/decks",
    target: "nav-sidebar",
    placement: "right",
  },
  {
    id: "new-deck",
    title: "Create a new deck",
    body: "Start here when you want a fresh set of flashcards. New Deck opens the generation workspace.",
    route: "/decks",
    target: "cta-new-deck",
    placement: "bottom",
  },
  {
    id: "ai-generate",
    title: "AI flashcard generation",
    body: "Paste your notes (or import a file), then generate a draft deck. Review the cards before saving — you stay in control.",
    route: "/generate",
    target: "cta-generate",
    placement: "top",
  },
  {
    id: "edit-cards",
    title: "Editing flashcards",
    body: "Open any deck from your library to edit terms and definitions, add cards, or tweak visibility. Changes save as you go.",
    route: "/decks",
    target: "decks-library",
    placement: "bottom",
  },
  {
    id: "study",
    title: "Studying a deck",
    body: "Hit Play on a deck to flip through cards. Choose term-first or definition-first before you begin.",
    route: "/decks",
    target: "cta-study",
    placement: "left",
  },
  {
    id: "community",
    title: "Browsing community decks",
    body: "Preview public decks, then save useful ones into your library. Share your own decks when you’re ready.",
    route: "/explore",
    target: "explore-library",
    placement: "bottom",
  },
  {
    id: "manage",
    title: "Deck management",
    body: "From a deck’s manage page you can share publicly, add cards, or delete. Library actions also let you remove saved community decks.",
    route: "/decks",
    target: "decks-library",
    placement: "bottom",
  },
  {
    id: "search",
    title: "Search and filtering",
    body: "Find decks by title or topic, then narrow the list with filters like public, community-saved, or uncategorized.",
    route: "/decks",
    target: "search-decks",
    placement: "bottom",
  },
  {
    id: "settings",
    title: "Settings and profile",
    body: "Manage account preferences here. You can also replay this tutorial whenever you want a refresher.",
    route: "/settings",
    target: "nav-settings",
    placement: "right",
  },
];

export function getTutorialStepCount(): number {
  return TUTORIAL_STEPS.length;
}

export function getTutorialStep(index: number): TutorialStep | undefined {
  return TUTORIAL_STEPS[index];
}

export function findTutorialStepIndex(stepId: string): number {
  return TUTORIAL_STEPS.findIndex((step) => step.id === stepId);
}

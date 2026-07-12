export type ContextualTipId =
  | "generate-ai"
  | "new-deck"
  | "study"
  | "community"
  | "search"
  | "settings";

export const CONTEXTUAL_TIPS: Record<
  ContextualTipId,
  { title: string; body: string; hoverLabel: string }
> = {
  "generate-ai": {
    title: "Generate with AI",
    body: "Paste notes or import a file, then let AI draft flashcards you can edit before saving.",
    hoverLabel: "Generate flashcards from your notes with AI",
  },
  "new-deck": {
    title: "New Deck",
    body: "Create a blank workspace for AI generation or file import.",
    hoverLabel: "Create a new flashcard deck",
  },
  study: {
    title: "Study",
    body: "Open study mode to flip through cards at your own pace.",
    hoverLabel: "Start studying this deck",
  },
  community: {
    title: "Community",
    body: "Browse public decks and save useful sets to your library.",
    hoverLabel: "Browse community decks",
  },
  search: {
    title: "Search",
    body: "Filter your library by title, topic, or creator.",
    hoverLabel: "Search your decks",
  },
  settings: {
    title: "Settings",
    body: "Update account preferences, replay the tutorial, or open the Help Center.",
    hoverLabel: "Open settings",
  },
};

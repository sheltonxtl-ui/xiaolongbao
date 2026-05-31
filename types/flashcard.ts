import type { FlashcardDifficulty } from "@/lib/flashcards/types";

/** @deprecated Prefer GeneratedFlashcard from @/lib/flashcards/types */
export interface Flashcard {
  question: string;
  answer: string;
  difficulty?: FlashcardDifficulty;
  topic?: string;
}

export type { FlashcardDifficulty, GeneratedFlashcard } from "@/lib/flashcards/types";

import { buildFlashcardUserMessage } from "@/lib/flashcards/system-prompt";

/** @deprecated Use FLASHCARD_GENERATOR_SYSTEM_PROMPT with generateFlashcardsFromNotes instead. */
export function buildFlashcardPrompt(text: string) {
  return buildFlashcardUserMessage(text);
}

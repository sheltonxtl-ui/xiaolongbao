export type FlashcardDifficulty = "easy" | "medium" | "hard";

export type GeneratedFlashcard = {
  front: string;
  back: string;
  difficulty: FlashcardDifficulty;
  topic: string;
};

export type GenerateFlashcardsSuccess = {
  ok: true;
  flashcards: GeneratedFlashcard[];
};

export type GenerateFlashcardsFailure = {
  ok: false;
  error: string;
  code?: "NOT_CONFIGURED" | "INVALID_INPUT" | "UNSUPPORTED_FILE" | "EXTRACTION_FAILED" | "GENERATION_FAILED";
};

export type GenerateFlashcardsResult = GenerateFlashcardsSuccess | GenerateFlashcardsFailure;

export type SourceContent =
  | { kind: "text"; text: string }
  | { kind: "image"; base64: string; mimeType: "image/jpeg" | "image/png" };

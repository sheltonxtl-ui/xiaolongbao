import type {
  FlashcardDifficulty,
  GeneratedFlashcard,
  GenerateFlashcardsFailure,
  GenerateFlashcardsResult,
} from "@/lib/flashcards/types";

const DIFFICULTIES = new Set<FlashcardDifficulty>(["easy", "medium", "hard"]);

function extractJsonPayload(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFlashcard(value: unknown): GeneratedFlashcard | null {
  if (!isRecord(value)) return null;

  const front = typeof value.front === "string" ? value.front.trim() : "";
  const back = typeof value.back === "string" ? value.back.trim() : "";
  const difficulty = value.difficulty;
  const topic = typeof value.topic === "string" ? value.topic.trim() : "";

  if (
    front.length < 5 ||
    front.length > 100 ||
    back.length < 15 ||
    back.length > 300 ||
    !DIFFICULTIES.has(difficulty as FlashcardDifficulty) ||
    !topic
  ) {
    return null;
  }

  return {
    front,
    back,
    difficulty: difficulty as FlashcardDifficulty,
    topic,
  };
}

export function parseFlashcardGenerationResponse(content: string): GenerateFlashcardsResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonPayload(content));
  } catch {
    return {
      ok: false,
      error: "The AI returned an invalid response. Please try again.",
      code: "GENERATION_FAILED",
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      error: "The AI returned an invalid response. Please try again.",
      code: "GENERATION_FAILED",
    };
  }

  if (typeof parsed.error === "string" && parsed.error.trim()) {
    return {
      ok: false,
      error: parsed.error.trim(),
      code: "INVALID_INPUT",
    };
  }

  if (!Array.isArray(parsed.flashcards)) {
    return {
      ok: false,
      error: "The AI returned an invalid response. Please try again.",
      code: "GENERATION_FAILED",
    };
  }

  const flashcards = parsed.flashcards
    .map(parseFlashcard)
    .filter((card): card is GeneratedFlashcard => card !== null);

  if (flashcards.length === 0) {
    return {
      ok: false,
      error: "No valid flashcards were generated. Try adding more detailed notes.",
      code: "GENERATION_FAILED",
    };
  }

  return { ok: true, flashcards };
}

export function failureFromError(
  error: unknown,
  fallback = "Failed to generate flashcards.",
): GenerateFlashcardsFailure {
  if (error instanceof Error && error.message.trim()) {
    return { ok: false, error: error.message.trim(), code: "GENERATION_FAILED" };
  }
  return { ok: false, error: fallback, code: "GENERATION_FAILED" };
}

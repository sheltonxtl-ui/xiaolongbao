import { parseFlashcard } from "@/lib/flashcards/parse-response";
import type { GeneratedFlashcard } from "@/lib/flashcards/types";

export type FlashcardStreamEvent =
  | { type: "card"; card: GeneratedFlashcard }
  | { type: "done"; total: number }
  | { type: "error"; error: string };

function unescapeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
}

function extractStreamError(buffer: string): string | null {
  const match = buffer.match(/"error"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (!match?.[1]) return null;
  return unescapeJsonString(match[1]).trim() || null;
}

function extractCompleteObjects(buffer: string, skip: number): {
  objects: string[];
  nextSkip: number;
} {
  const arrayKey = buffer.indexOf('"flashcards"');
  if (arrayKey === -1) return { objects: [], nextSkip: skip };

  const bracketStart = buffer.indexOf("[", arrayKey);
  if (bracketStart === -1) return { objects: [], nextSkip: skip };

  const objects: string[] = [];
  let i = bracketStart + 1;
  let objectIndex = 0;

  while (i < buffer.length) {
    while (i < buffer.length && /[\s,]/.test(buffer[i]!)) i += 1;
    if (i >= buffer.length || buffer[i] === "]") break;
    if (buffer[i] !== "{") break;

    const start = i;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let complete = false;

    for (; i < buffer.length; i += 1) {
      const char = buffer[i]!;

      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          complete = true;
          if (objectIndex >= skip) {
            objects.push(buffer.slice(start, i));
          }
          objectIndex += 1;
          break;
        }
      }
    }

    if (!complete) break;
  }

  return { objects, nextSkip: objectIndex };
}

export class FlashcardStreamParser {
  private buffer = "";
  private parsedObjectCount = 0;
  private emittedCards = 0;
  private streamError: string | null = null;

  push(chunk: string): GeneratedFlashcard[] {
    if (this.streamError) return [];

    this.buffer += chunk;

    const error = extractStreamError(this.buffer);
    if (error) {
      this.streamError = error;
      return [];
    }

    const { objects, nextSkip } = extractCompleteObjects(
      this.buffer,
      this.parsedObjectCount,
    );
    this.parsedObjectCount = nextSkip;

    const cards: GeneratedFlashcard[] = [];
    for (const objectText of objects) {
      try {
        const parsed = JSON.parse(objectText) as unknown;
        const card = parseFlashcard(parsed);
        if (card) {
          cards.push(card);
          this.emittedCards += 1;
        }
      } catch {
        // Wait for a complete object on the next chunk.
      }
    }

    return cards;
  }

  getError(): string | null {
    return this.streamError;
  }

  getEmittedCount(): number {
    return this.emittedCards;
  }

  finalize(): FlashcardStreamEvent {
    if (this.streamError) {
      return { type: "error", error: this.streamError };
    }

    const error = extractStreamError(this.buffer);
    if (error) {
      return { type: "error", error };
    }

    if (this.emittedCards === 0) {
      return {
        type: "error",
        error: "No valid flashcards were generated. Try adding more detailed notes.",
      };
    }

    return { type: "done", total: this.emittedCards };
  }
}

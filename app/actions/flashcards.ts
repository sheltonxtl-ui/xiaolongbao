"use server";

import { extractContentFromUpload } from "@/lib/flashcards/extract-text.server";
import { generateFlashcardsFromContent, generateFlashcardsFromNotes } from "@/lib/flashcards/generate";
import type { GenerateFlashcardsResult } from "@/lib/flashcards/types";

export async function generateFlashcardsAction(
  notes: string,
): Promise<GenerateFlashcardsResult> {
  return generateFlashcardsFromNotes(notes);
}

export async function generateFlashcardsFromUploadAction(
  formData: FormData,
): Promise<GenerateFlashcardsResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      ok: false,
      error: "Choose a file to upload.",
      code: "INVALID_INPUT",
    };
  }

  const extracted = await extractContentFromUpload(file);
  if (!extracted.ok) {
    return {
      ok: false,
      error: extracted.error,
      code: extracted.code,
    };
  }

  return generateFlashcardsFromContent(extracted.content);
}

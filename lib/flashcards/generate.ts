import { getOpenAI } from "@/lib/openai";
import { countWords, MAX_NOTES_WORDS } from "@/lib/decks/wordCount";
import { failureFromError, parseFlashcardGenerationResponse } from "@/lib/flashcards/parse-response";
import { FlashcardStreamParser } from "@/lib/flashcards/stream-parser";
import {
  buildFlashcardImageUserMessage,
  buildFlashcardUserMessage,
  FLASHCARD_GENERATOR_SYSTEM_PROMPT,
} from "@/lib/flashcards/system-prompt";
import type {
  GenerateFlashcardsFailure,
  GenerateFlashcardsResult,
  SourceContent,
} from "@/lib/flashcards/types";

const DEFAULT_CARD_COUNT = 10;
const MIN_MEANINGFUL_WORDS = 10;

function getTextModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

function getVisionModel(): string {
  return process.env.OPENAI_VISION_MODEL ?? getTextModel();
}

function validateNotesText(text: string): GenerateFlashcardsFailure | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Please provide study material or notes to generate flashcards.",
      code: "INVALID_INPUT",
    };
  }

  const words = countWords(trimmed);
  if (words < MIN_MEANINGFUL_WORDS) {
    return {
      ok: false,
      error: "Input too short. Please provide more study material or notes.",
      code: "INVALID_INPUT",
    };
  }

  if (words > MAX_NOTES_WORDS) {
    return {
      ok: false,
      error: `Input exceeds the ${MAX_NOTES_WORDS.toLocaleString()}-word limit.`,
      code: "INVALID_INPUT",
    };
  }

  return null;
}

function notConfiguredError(): GenerateFlashcardsFailure {
  return {
    ok: false,
    error: "AI generation is not configured yet. Set OPENAI_API_KEY when you are ready.",
    code: "NOT_CONFIGURED",
  };
}

type StreamMessages =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

export async function createFlashcardCompletionStream(content: SourceContent) {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error(notConfiguredError().error);
  }

  let model = getTextModel();
  let messages: StreamMessages[] = [
    { role: "system", content: FLASHCARD_GENERATOR_SYSTEM_PROMPT },
  ];

  if (content.kind === "text") {
    const validationError = validateNotesText(content.text);
    if (validationError) {
      throw new Error(validationError.error);
    }

    messages.push({
      role: "user",
      content: buildFlashcardUserMessage(content.text, DEFAULT_CARD_COUNT),
    });
  } else {
    model = getVisionModel();
    messages.push({
      role: "user",
      content: [
        { type: "text", text: buildFlashcardImageUserMessage(DEFAULT_CARD_COUNT) },
        {
          type: "image_url",
          image_url: {
            url: `data:${content.mimeType};base64,${content.base64}`,
          },
        },
      ],
    });
  }

  return openai.chat.completions.create({
    model,
    temperature: 0.3,
    stream: true,
    response_format: { type: "json_object" },
    messages,
  });
}

export async function generateFlashcardsFromContent(
  content: SourceContent,
  cardCount = DEFAULT_CARD_COUNT,
): Promise<GenerateFlashcardsResult> {
  const openai = getOpenAI();
  if (!openai) {
    return notConfiguredError();
  }

  try {
    if (content.kind === "text") {
      const validationError = validateNotesText(content.text);
      if (validationError) return validationError;

      const completion = await openai.chat.completions.create({
        model: getTextModel(),
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: FLASHCARD_GENERATOR_SYSTEM_PROMPT },
          { role: "user", content: buildFlashcardUserMessage(content.text, cardCount) },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      return parseFlashcardGenerationResponse(raw);
    }

    const completion = await openai.chat.completions.create({
      model: getVisionModel(),
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: FLASHCARD_GENERATOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: buildFlashcardImageUserMessage(cardCount) },
            {
              type: "image_url",
              image_url: {
                url: `data:${content.mimeType};base64,${content.base64}`,
              },
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    return parseFlashcardGenerationResponse(raw);
  } catch (error) {
    return failureFromError(error);
  }
}

export async function streamFlashcardsToWriter(
  content: SourceContent,
  write: (line: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const stream = await createFlashcardCompletionStream(content);
  const parser = new FlashcardStreamParser();

  for await (const chunk of stream) {
    if (signal?.aborted) {
      throw new DOMException("Generation cancelled.", "AbortError");
    }

    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (!delta) continue;

    const newCards = parser.push(delta);
    if (parser.getError()) {
      write(JSON.stringify({ type: "error", error: parser.getError() }));
      return;
    }

    for (const card of newCards) {
      write(JSON.stringify({ type: "card", card }));
    }
  }

  const finalEvent = parser.finalize();
  write(JSON.stringify(finalEvent));
}

export async function generateFlashcardsFromNotes(
  notes: string,
  cardCount = DEFAULT_CARD_COUNT,
): Promise<GenerateFlashcardsResult> {
  return generateFlashcardsFromContent({ kind: "text", text: notes }, cardCount);
}

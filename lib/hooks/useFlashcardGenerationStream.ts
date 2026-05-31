"use client";

import { useCallback, useRef, useState } from "react";
import type { FlashcardStreamEvent } from "@/lib/flashcards/stream-parser";
import type { GeneratedFlashcard } from "@/lib/flashcards/types";

export type GenerationSource =
  | { type: "notes"; text: string }
  | { type: "file"; file: File }
  | { type: "link"; url: string };

export type StreamGenerationState =
  | { status: "idle" }
  | { status: "generating"; cards: GeneratedFlashcard[] }
  | { status: "complete"; cards: GeneratedFlashcard[] }
  | { status: "error"; error: string; cards: GeneratedFlashcard[] };

function parseSseChunk(chunk: string): FlashcardStreamEvent | null {
  const line = chunk.trim();
  if (!line.startsWith("data:")) return null;
  const payload = line.slice(5).trim();
  if (!payload) return null;

  try {
    return JSON.parse(payload) as FlashcardStreamEvent;
  } catch {
    return null;
  }
}

export function useFlashcardGenerationStream() {
  const [state, setState] = useState<StreamGenerationState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ status: "idle" });
  }, [cancel]);

  const start = useCallback(async (source: GenerationSource) => {
    cancel();

    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "generating", cards: [] });

    try {
      let response: Response;

      if (source.type === "file") {
        const formData = new FormData();
        formData.append("file", source.file);
        response = await fetch("/api/generate-flashcards/stream", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } else if (source.type === "link") {
        response = await fetch("/api/generate-flashcards/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: source.url }),
          signal: controller.signal,
        });
      } else {
        response = await fetch("/api/generate-flashcards/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: source.text }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        let message = "Failed to start generation.";
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // Ignore JSON parse errors.
        }
        setState({ status: "error", error: message, cards: [] });
        return;
      }

      if (!response.body) {
        setState({
          status: "error",
          error: "Streaming is not supported in this browser.",
          cards: [],
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const cards: GeneratedFlashcard[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const event = parseSseChunk(part);
          if (!event) continue;

          if (event.type === "card") {
            cards.push(event.card);
            setState({ status: "generating", cards: [...cards] });
          } else if (event.type === "error") {
            setState({ status: "error", error: event.error, cards: [...cards] });
            return;
          } else if (event.type === "done") {
            setState({ status: "complete", cards: [...cards] });
            return;
          }
        }
      }

      if (cards.length === 0) {
        setState({
          status: "error",
          error: "No flashcards were generated. Try again with more detailed notes.",
          cards: [],
        });
        return;
      }

      setState({ status: "complete", cards: [...cards] });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setState({ status: "idle" });
        return;
      }

      setState({
        status: "error",
        error: error instanceof Error ? error.message : "Failed to generate flashcards.",
        cards: [],
      });
    } finally {
      abortRef.current = null;
    }
  }, [cancel]);

  return { state, start, cancel, reset };
}

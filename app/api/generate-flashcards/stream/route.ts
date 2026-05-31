import { extractContentFromUpload } from "@/lib/flashcards/extract-text.server";
import { extractContentFromUrl } from "@/lib/flashcards/extract-url.server";
import { streamFlashcardsToWriter } from "@/lib/flashcards/generate";
import type { SourceContent } from "@/lib/flashcards/types";

export const runtime = "nodejs";

function encodeSse(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${data}\n\n`);
}

async function streamFromContent(
  content: SourceContent,
  signal: AbortSignal,
): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamFlashcardsToWriter(
          content,
          (line) => controller.enqueue(encodeSse(line)),
          signal,
        );
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === "AbortError"
            ? "Generation cancelled."
            : error instanceof Error
              ? error.message
              : "Failed to generate flashcards.";
        controller.enqueue(
          encodeSse(JSON.stringify({ type: "error", error: message })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  const signal = req.signal;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Choose a file to upload." },
        { status: 400 },
      );
    }

    const extracted = await extractContentFromUpload(file);
    if (!extracted.ok) {
      return Response.json({ error: extracted.error }, { status: 400 });
    }

    return streamFromContent(extracted.content, signal);
  }

  let body: { text?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (url) {
    const extracted = await extractContentFromUrl(url);
    if (!extracted.ok) {
      return Response.json({ error: extracted.error }, { status: 400 });
    }
    return streamFromContent(extracted.content, signal);
  }

  const text = typeof body.text === "string" ? body.text : "";
  return streamFromContent({ kind: "text", text }, signal);
}

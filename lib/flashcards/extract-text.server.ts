import "server-only";

import mammoth from "mammoth";
import "pdf-parse/worker";
import { PDFParse, VerbosityLevel } from "pdf-parse";
import {
  getFileExtension,
  isAllowedUploadExtension,
  MAX_UPLOAD_BYTES,
} from "@/lib/flashcards/constants";
import type { SourceContent } from "@/lib/flashcards/types";

const TEXT_EXTENSIONS = new Set([".csv", ".json", ".txt", ".tsv"]);
const IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png"]);
type ImageMimeType = Extract<SourceContent, { kind: "image" }>["mimeType"];
const IMAGE_MIME: Record<string, ImageMimeType> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

export type ExtractUploadResult =
  | { ok: true; content: SourceContent; filename: string }
  | { ok: false; error: string; code: "INVALID_INPUT" | "UNSUPPORTED_FILE" | "EXTRACTION_FAILED" };

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    verbosity: VerbosityLevel.WARNINGS,
  });
  try {
    const result = await parser.getText();
    return result.text?.trim() ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? "";
}

function decodeText(buffer: Buffer): string {
  return buffer.toString("utf8").trim();
}

export async function extractContentFromBuffer(
  buffer: Buffer,
  filename: string,
): Promise<ExtractUploadResult> {
  if (!isAllowedUploadExtension(filename)) {
    return {
      ok: false,
      error: "Unsupported file type. Choose a supported format and try again.",
      code: "UNSUPPORTED_FILE",
    };
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: "File is too large. Maximum size is 15 MB.",
      code: "INVALID_INPUT",
    };
  }

  if (buffer.length === 0) {
    return {
      ok: false,
      error: "The file is empty.",
      code: "INVALID_INPUT",
    };
  }

  const ext = getFileExtension(filename);

  if (ext === ".apkg") {
    return {
      ok: false,
      error:
        "Anki .apkg import is not supported yet. Export your deck as CSV or paste the notes instead.",
      code: "UNSUPPORTED_FILE",
    };
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    const mimeType = IMAGE_MIME[ext];
    if (!mimeType) {
      return { ok: false, error: "Unsupported image type.", code: "UNSUPPORTED_FILE" };
    }

    return {
      ok: true,
      filename,
      content: {
        kind: "image",
        base64: buffer.toString("base64"),
        mimeType,
      },
    };
  }

  try {
    let text = "";

    if (TEXT_EXTENSIONS.has(ext)) {
      text = decodeText(buffer);
    } else if (ext === ".pdf") {
      text = await extractPdfText(buffer);
    } else if (ext === ".docx") {
      text = await extractDocxText(buffer);
    } else {
      return {
        ok: false,
        error: "Unsupported file type.",
        code: "UNSUPPORTED_FILE",
      };
    }

    if (!text) {
      return {
        ok: false,
        error: "Could not extract readable text from that file.",
        code: "EXTRACTION_FAILED",
      };
    }

    return {
      ok: true,
      filename,
      content: { kind: "text", text },
    };
  } catch {
    return {
      ok: false,
      error: "Could not read that file. Check the format and try again.",
      code: "EXTRACTION_FAILED",
    };
  }
}

export async function extractContentFromUpload(
  file: Pick<File, "name" | "size" | "arrayBuffer">,
): Promise<ExtractUploadResult> {
  if (!isAllowedUploadExtension(file.name)) {
    return {
      ok: false,
      error: "Unsupported file type. Choose a supported format and try again.",
      code: "UNSUPPORTED_FILE",
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: "File is too large. Maximum size is 15 MB.",
      code: "INVALID_INPUT",
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      error: "The selected file is empty.",
      code: "INVALID_INPUT",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return extractContentFromBuffer(buffer, file.name);
}

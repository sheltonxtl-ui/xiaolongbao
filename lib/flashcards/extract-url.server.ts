import "server-only";

import {
  getFileExtension,
  isAllowedUploadExtension,
  MAX_UPLOAD_BYTES,
} from "@/lib/flashcards/constants";
import {
  extractContentFromBuffer,
  type ExtractUploadResult,
} from "@/lib/flashcards/extract-text.server";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 6;

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Xiaolongbao/1.0)",
  Accept:
    "text/plain,text/html,application/xhtml+xml,application/pdf,application/json,text/csv,*/*;q=0.8",
};

export type ExtractUrlResult = ExtractUploadResult;

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  return false;
}

function assertSafeFetchUrl(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links are supported.");
  }

  if (url.username || url.password) {
    throw new Error("Links with embedded credentials are not supported.");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host.endsWith(".local")
  ) {
    throw new Error("That link points to a local address and cannot be imported.");
  }

  const ipVersion = url.hostname.includes(":") ? 6 : 4;
  if (ipVersion === 4 && isPrivateIpv4(host)) {
    throw new Error("That link points to a private network address and cannot be imported.");
  }
  if (ipVersion === 6 && isPrivateIpv6(host)) {
    throw new Error("That link points to a private network address and cannot be imported.");
  }
}

/** Normalize known document hosts (e.g. Google Docs edit URLs) to fetchable export URLs. */
export function resolveImportUrl(input: string): URL {
  const trimmed = input.trim();
  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid URL starting with http:// or https://.");
  }

  assertSafeFetchUrl(url);

  const host = url.hostname.toLowerCase();

  const docId = url.pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (host === "docs.google.com" && docId) {
    const exportUrl = new URL(`https://docs.google.com/document/d/${docId}/export`);
    exportUrl.searchParams.set("format", "txt");
    assertSafeFetchUrl(exportUrl);
    return exportUrl;
  }

  const fileId = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (host === "drive.google.com" && fileId) {
    const exportUrl = new URL("https://drive.google.com/uc");
    exportUrl.searchParams.set("export", "download");
    exportUrl.searchParams.set("id", fileId);
    assertSafeFetchUrl(exportUrl);
    return exportUrl;
  }

  return url;
}

function filenameFromUrl(url: URL, contentType: string | null): string {
  const pathName = url.pathname.split("/").pop() ?? "";
  if (pathName && pathName.includes(".")) {
    return decodeURIComponent(pathName);
  }

  const type = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (type === "application/pdf") return "document.pdf";
  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document.docx";
  }
  if (type === "text/plain") return "document.txt";
  if (type === "text/csv") return "document.csv";
  if (type === "application/json") return "document.json";
  return "document.html";
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeGoogleSignInPage(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("accounts.google.com") &&
    (lower.includes("sign in") || lower.includes("signin") || lower.includes("servicelogin"))
  );
}

async function readLimitedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error("That file is too large. Maximum size is 15 MB.");
  }

  if (!response.body) {
    return Buffer.from(await response.arrayBuffer());
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("That file is too large. Maximum size is 15 MB.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

async function safeFetch(initialUrl: URL): Promise<{ response: Response; finalUrl: URL }> {
  let current = initialUrl;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    assertSafeFetchUrl(current);

    const response = await fetch(current.toString(), {
      method: "GET",
      headers: FETCH_HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("The link redirected to an invalid location.");
      }
      current = new URL(location, current);
      continue;
    }

    return { response, finalUrl: current };
  }

  throw new Error("Too many redirects while fetching that link.");
}

export async function extractContentFromUrl(input: string): Promise<ExtractUrlResult> {
  let fetchUrl: URL;

  try {
    fetchUrl = resolveImportUrl(input);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid URL.",
      code: "INVALID_INPUT",
    };
  }

  let response: Response;
  let finalUrl: URL;

  try {
    ({ response, finalUrl } = await safeFetch(fetchUrl));
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not reach that link. Check the URL and try again.",
      code: "EXTRACTION_FAILED",
    };
  }

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      return {
        ok: false,
        error:
          "That document is not publicly accessible. Share it as “Anyone with the link can view” and try again.",
        code: "EXTRACTION_FAILED",
      };
    }

    return {
      ok: false,
      error: `Could not fetch that link (HTTP ${response.status}).`,
      code: "EXTRACTION_FAILED",
    };
  }

  let buffer: Buffer;
  try {
    buffer = await readLimitedBody(response, MAX_UPLOAD_BYTES);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not read the response.",
      code: "EXTRACTION_FAILED",
    };
  }

  if (buffer.length === 0) {
    return {
      ok: false,
      error: "That link returned an empty document.",
      code: "EXTRACTION_FAILED",
    };
  }

  const contentType = response.headers.get("content-type");
  const filename = filenameFromUrl(finalUrl, contentType);
  const ext = getFileExtension(filename);

  if (isAllowedUploadExtension(filename) && ext !== ".apkg") {
    return extractContentFromBuffer(buffer, filename);
  }

  const asText = buffer.toString("utf8");

  if (looksLikeGoogleSignInPage(asText)) {
    return {
      ok: false,
      error:
        "That Google document is not publicly accessible. Share it as “Anyone with the link can view” and try again.",
      code: "EXTRACTION_FAILED",
    };
  }

  const isHtml =
    contentType?.includes("text/html") ||
    asText.includes("<html") ||
    asText.includes("<!DOCTYPE");

  const text = isHtml ? htmlToText(asText) : asText.trim();

  if (!text) {
    return {
      ok: false,
      error: "Could not extract readable text from that page.",
      code: "EXTRACTION_FAILED",
    };
  }

  return {
    ok: true,
    filename,
    content: { kind: "text", text },
  };
}

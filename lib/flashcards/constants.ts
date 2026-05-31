export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".csv",
  ".json",
  ".txt",
  ".tsv",
  ".apkg",
  ".pdf",
  ".docx",
  ".jpeg",
  ".jpg",
  ".png",
] as const;

export type AllowedUploadExtension = (typeof ALLOWED_UPLOAD_EXTENSIONS)[number];

export const DECK_FILE_ACCEPT = ALLOWED_UPLOAD_EXTENSIONS.join(",");

const EXTENSION_LABELS: Record<AllowedUploadExtension, string> = {
  ".csv": "CSV",
  ".json": "JSON",
  ".txt": "plain text",
  ".tsv": "TSV",
  ".apkg": "Anki (.apkg)",
  ".pdf": "PDF",
  ".docx": "Word (.docx)",
  ".jpeg": "JPEG",
  ".jpg": "JPEG",
  ".png": "PNG",
};

export function formatAllowedUploadTypes(): string {
  const labels = [...new Set(ALLOWED_UPLOAD_EXTENSIONS.map((ext) => EXTENSION_LABELS[ext]))];
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")}, or ${labels.at(-1)}`;
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

export function isAllowedUploadExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_UPLOAD_EXTENSIONS.includes(ext as AllowedUploadExtension);
}

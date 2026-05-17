"use client";

import {
  ArrowUpTrayIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/catalyst/dialog";
import { Divider } from "@/components/catalyst/divider";
import {
  Description,
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "@/components/catalyst/fieldset";
import { Input, InputGroup } from "@/components/catalyst/input";
import { Radio, RadioField, RadioGroup } from "@/components/catalyst/radio";
import { Text } from "@/components/catalyst/text";

export type ImportDeckSource =
  | { type: "link"; url: string }
  | { type: "file"; file: File };

const DECK_FILE_ACCEPT = ".csv,.json,.txt,.tsv,.apkg";
const MAX_FILE_BYTES = 15 * 1024 * 1024;

type ImportMethod = "link" | "file";

export type ImportDeckDialogProps = {
  open: boolean;
  onClose: () => void;
  onImport?: (source: ImportDeckSource) => void | Promise<void>;
};

function isValidDeckUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportDeckDialog({ open, onClose, onImport }: ImportDeckDialogProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<ImportMethod>("link");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setMethod("link");
    setLinkUrl("");
    setSelectedFile(null);
    setIsDragging(false);
    setError(null);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const applyFile = useCallback((file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(`File must be ${formatFileSize(MAX_FILE_BYTES)} or smaller.`);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) applyFile(file);
    },
    [applyFile],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const canSubmit =
    method === "link"
      ? linkUrl.trim().length > 0
      : selectedFile !== null;

  const handleImport = useCallback(async () => {
    if (method === "link") {
      const trimmed = linkUrl.trim();
      if (!trimmed) {
        setError("Enter a deck link to continue.");
        return;
      }
      if (!isValidDeckUrl(trimmed)) {
        setError("Enter a valid URL starting with http:// or https://.");
        return;
      }
      setError(null);
      setIsSubmitting(true);
      try {
        await onImport?.({ type: "link", url: trimmed });
        handleClose();
      } catch {
        setError("Could not import from that link. Try again or use a file instead.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedFile) {
      setError("Choose a deck file to upload.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onImport?.({ type: "file", file: selectedFile });
      handleClose();
    } catch {
      setError("Could not import that file. Check the format and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [handleClose, linkUrl, method, onImport, selectedFile]);

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <DialogTitle>Import deck</DialogTitle>
      <DialogDescription>
        Bring in a deck from a shared link or upload a file. Supported formats include CSV,
        JSON, TSV, and Anki packages (.apkg).
      </DialogDescription>

      <DialogBody>
        <Fieldset>
          <RadioGroup
            value={method}
            onChange={(value) => {
              setMethod(value as ImportMethod);
              setError(null);
            }}
            aria-label="Import source"
          >
            <RadioField>
              <Radio value="link" color="indigo" />
              <Label>Deck link</Label>
              <Description>
                Paste a public or shared URL to a deck in xiaolongbao or a supported export.
              </Description>
            </RadioField>
            <RadioField>
              <Radio value="file" color="indigo" />
              <Label>Upload file</Label>
              <Description>
                CSV, JSON, TSV, plain text, or Anki .apkg — up to{" "}
                {formatFileSize(MAX_FILE_BYTES)}.
              </Description>
            </RadioField>
          </RadioGroup>

          <Divider soft className="my-8" />

          {method === "link" ? (
            <Field>
              <Label htmlFor={`${fileInputId}-url`}>Deck URL</Label>
              <InputGroup>
                <LinkIcon data-slot="icon" aria-hidden />
                <Input
                  id={`${fileInputId}-url`}
                  type="url"
                  name="deck-url"
                  placeholder="https://…"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </InputGroup>
              <Description>
                Use a link someone shared with you, or an export URL from another study tool if
                supported.
              </Description>
            </Field>
          ) : (
            <Field>
              <Label htmlFor={fileInputId}>Deck file</Label>
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept={DECK_FILE_ACCEPT}
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isSubmitting}
                tabIndex={-1}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label={selectedFile ? "Change deck file" : "Choose deck file"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
                onClick={openFilePicker}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (!isSubmitting) setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isSubmitting) e.dataTransfer.dropEffect = "copy";
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setIsDragging(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (!isSubmitting) handleFiles(e.dataTransfer.files);
                }}
                className={clsx(
                  "mt-3 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
                  isDragging
                    ? "border-indigo-400 bg-indigo-50/80 dark:border-indigo-400/60 dark:bg-indigo-500/10"
                    : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100/60 dark:border-white/15 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10",
                  isSubmitting && "pointer-events-none opacity-60",
                )}
              >
                <ArrowUpTrayIcon
                  className="size-10 text-indigo-600 dark:text-indigo-400"
                  aria-hidden
                />
                {selectedFile ? (
                  <>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <Text className="text-sm">{formatFileSize(selectedFile.size)}</Text>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      Choose a different file
                    </span>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Drag and drop your deck file here
                    </p>
                    <Text className="text-sm">or click to browse</Text>
                  </>
                )}
              </div>
            </Field>
          )}

          {error ? <ErrorMessage className="mt-4">{error}</ErrorMessage> : null}
        </Fieldset>
      </DialogBody>

      <DialogActions>
        <Button outline onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          color="indigo"
          disabled={!canSubmit || isSubmitting}
          onClick={() => void handleImport()}
        >
          {isSubmitting ? "Importing…" : "Import deck"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

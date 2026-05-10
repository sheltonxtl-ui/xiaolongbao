"use client";

import clsx from "clsx";
import {
  ArrowUpTrayIcon,
  EllipsisHorizontalIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/catalyst/dropdown";

/** Values emitted from `onChange` whenever the term or definition is edited. */
export type FlashcardRowValue = {
  term: string;
  definition: string;
};

export type FlashcardRowProps = {
  /** Stable identifier used by parent lists and accessibility labels. */
  id: string;
  /** Display index shown in the top-left corner; usually 1-based. */
  index: number;
  term: string;
  definition: string;
  /** Preview URL (`URL.createObjectURL`) or stored image URL; `null` when empty. */
  image: string | null;
  onChange: (value: FlashcardRowValue) => void;
  onImageUpload: (file: File) => void;
  /** Invoked when the user picks "Delete card" from the kebab menu. */
  onDelete: () => void;
  className?: string;
};

const cardClassName = clsx(
  "group/card relative rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm",
  "transition-[box-shadow,border-color] duration-200 ease-out",
  "hover:border-gray-300 hover:shadow-md",
  "focus-within:border-gray-300 focus-within:shadow-md",
  "dark:border-white/10 dark:bg-zinc-900/40 dark:hover:border-white/15"
);

const inputClassName = clsx(
  "block w-full rounded-xl border-0 bg-gray-50 px-4 text-base text-zinc-900 ring-1 ring-inset ring-transparent",
  "placeholder:text-zinc-400",
  "h-[52px] min-h-[52px] py-0 leading-normal",
  "transition-[background-color,box-shadow,color] duration-150 ease-out",
  "hover:bg-gray-100/80",
  "focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15",
  "dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500",
  "dark:hover:bg-white/[0.08] dark:focus:bg-white/10 dark:focus:ring-white/20"
);

const labelClassName = clsx(
  "mt-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400",
  "dark:text-zinc-500"
);

function pickSingleImageFile(fileList: FileList | null): File | null {
  if (!fileList || fileList.length === 0) return null;
  const file = fileList[0];
  if (!file.type.startsWith("image/")) return null;
  return file;
}

export function FlashcardRow({
  id,
  index,
  term,
  definition,
  image,
  onChange,
  onImageUpload,
  onDelete,
  className,
}: FlashcardRowProps) {
  const reactId = useId();
  const termId = `${reactId}-${id}-term`;
  const defId = `${reactId}-${id}-definition`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emitFile = useCallback(
    (file: File | null) => {
      if (file) onImageUpload(file);
    },
    [onImageUpload]
  );

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const file = pickSingleImageFile(list);
      emitFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [emitFile]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onUploadKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFilePicker();
      }
    },
    [openFilePicker]
  );

  return (
    <article className={clsx(cardClassName, className)} aria-labelledby={termId}>
      <header className="mb-3 flex items-center justify-between">
        <span
          className="select-none text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500"
          aria-label={`Card ${index}`}
        >
          {index}
        </span>

        <Dropdown>
          <DropdownButton
            as="button"
            type="button"
            aria-label={`Card ${index} options`}
            className={clsx(
              "inline-flex size-8 items-center justify-center rounded-lg text-zinc-400",
              "opacity-60 transition-[opacity,background-color,color] duration-150",
              "hover:bg-zinc-100 hover:text-zinc-600 hover:opacity-100",
              "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15",
              "group-hover/card:opacity-100",
              "dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            )}
          >
            <EllipsisHorizontalIcon className="size-5" aria-hidden />
          </DropdownButton>
          <DropdownMenu anchor="bottom end" className="min-w-44">
            <DropdownItem onClick={onDelete}>
              <TrashIcon data-slot="icon" />
              <DropdownLabel>Delete card</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={termId} className="sr-only">
              Term
            </label>
            <input
              id={termId}
              type="text"
              value={term}
              onChange={(e) =>
                onChange({ term: e.target.value, definition })
              }
              placeholder="Enter term"
              className={inputClassName}
              autoComplete="off"
              spellCheck
            />
            <span className={labelClassName}>Term</span>
          </div>

          <div className="min-w-0">
            <label htmlFor={defId} className="sr-only">
              Definition
            </label>
            <input
              id={defId}
              type="text"
              value={definition}
              onChange={(e) =>
                onChange({ term, definition: e.target.value })
              }
              placeholder="Enter definition"
              className={inputClassName}
              autoComplete="off"
              spellCheck
            />
            <span className={labelClassName}>Definition</span>
          </div>
        </div>

        <div className="flex shrink-0 items-start justify-center lg:w-[100px] lg:justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            aria-hidden
            tabIndex={-1}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label={image ? "Change card image" : "Upload card image"}
            onKeyDown={onUploadKeyDown}
            onClick={openFilePicker}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
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
              handleFiles(e.dataTransfer.files);
            }}
            className={clsx(
              "flex h-[52px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-white p-2 text-center lg:size-[52px]",
              "text-[11px] font-medium text-zinc-500",
              "transition-[border-color,background-color,box-shadow,color] duration-200 ease-out",
              "hover:border-gray-400 hover:bg-gray-50 hover:text-zinc-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15",
              "dark:border-white/15 dark:bg-transparent dark:text-zinc-400 dark:hover:border-white/25 dark:hover:bg-white/5",
              isDragging &&
                "border-zinc-900/40 bg-zinc-50 text-zinc-700 dark:border-white/40 dark:bg-white/10 dark:text-zinc-100"
            )}
          >
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="size-9 rounded-md object-cover ring-1 ring-zinc-950/10"
                />
                <span className="flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-zinc-400">
                  <ArrowUpTrayIcon className="size-2.5" aria-hidden />
                  Replace
                </span>
              </>
            ) : (
              <>
                <PhotoIcon
                  className="size-5 text-zinc-300 dark:text-zinc-600"
                  aria-hidden
                />
                <span className="leading-tight">Image</span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

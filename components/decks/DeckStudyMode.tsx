"use client";

import clsx from "clsx";
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/catalyst/dialog";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { DeckEmptyPanel } from "@/components/decks/DeckAsyncState";
import type { DeckTerm } from "@/lib/decks/types";

export type StudyFaceOrder = "term-first" | "definition-first";

type DeckStudyModeProps = {
  deckId: string;
  deckTitle: string;
  terms: DeckTerm[];
};

export function DeckStudyMode({ deckId, deckTitle, terms }: DeckStudyModeProps) {
  const router = useRouter();
  const total = terms.length;
  /** Avoid treating a successful face-order choice like a dismiss (onClose can run before faceOrder state updates). */
  const closedAfterPickRef = useRef(false);

  const [orientationOpen, setOrientationOpen] = useState(total > 0);
  const [faceOrder, setFaceOrder] = useState<StudyFaceOrder | null>(null);
  /** Selection inside the study-options dialog before Confirm. */
  const [pendingFaceOrder, setPendingFaceOrder] = useState<StudyFaceOrder | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = terms[index];

  useEffect(() => {
    if (orientationOpen) {
      setPendingFaceOrder(faceOrder);
    }
  }, [orientationOpen, faceOrder]);

  useEffect(() => {
    setFlipped(false);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (orientationOpen || !faceOrder || total === 0) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => Math.min(total - 1, i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [orientationOpen, faceOrder, total]);

  const handleOrientationClose = useCallback(() => {
    setOrientationOpen(false);
    router.push(`/decks/${deckId}/manage`);
  }, [deckId, router]);

  const handleDialogClose = useCallback(() => {
    setOrientationOpen(false);
    if (closedAfterPickRef.current) {
      closedAfterPickRef.current = false;
      return;
    }
    if (faceOrder === null) {
      router.push(`/decks/${deckId}/manage`);
    }
  }, [deckId, faceOrder, router]);

  const confirmOrder = useCallback(() => {
    if (pendingFaceOrder === null) return;
    closedAfterPickRef.current = true;
    setFaceOrder(pendingFaceOrder);
    setFlipped(false);
    setOrientationOpen(false);
  }, [pendingFaceOrder]);

  const openStudyOptions = useCallback(() => {
    closedAfterPickRef.current = false;
    setOrientationOpen(true);
  }, []);

  const termFirst = faceOrder === "term-first";
  const frontLabel = termFirst ? "Term" : "Definition";
  const backLabel = termFirst ? "Definition" : "Term";
  const frontText = termFirst ? current?.question : current?.answer;
  const backText = termFirst ? current?.answer : current?.question;

  const flipHint = useMemo(() => {
    if (!current || !faceOrder) return "";
    return flipped
      ? `Showing ${backLabel.toLowerCase()}. Click to show ${frontLabel.toLowerCase()}.`
      : `Showing ${frontLabel.toLowerCase()}. Click to show ${backLabel.toLowerCase()}.`;
  }, [backLabel, current, faceOrder, flipped, frontLabel]);

  if (total === 0) {
    return (
      <section className="w-full" aria-labelledby="study-empty-heading">
        <Button plain href={`/decks/${deckId}/manage`} className="mb-6">
          ← Back to deck
        </Button>
        <div className="-mx-4 rounded-3xl bg-zinc-50 p-4 sm:-mx-6 sm:p-6 lg:-mx-8 lg:p-8 dark:bg-zinc-900/40">
          <DeckEmptyPanel
            headingId="study-empty-heading"
            title="No cards to study"
            description={
              <>
                Add terms in{" "}
                <span className="font-medium text-zinc-950 dark:text-white">{deckTitle}</span>{" "}
                before starting study mode.
              </>
            }
            actions={
              <Button color="indigo" href={`/decks/${deckId}/manage`}>
                Edit deck
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <>
      <Dialog open={orientationOpen} onClose={handleDialogClose} size="2xl">
        <DialogTitle>How do you want to study?</DialogTitle>
        <DialogDescription>
          Pick which face of the card you want to see first, then confirm to begin.
        </DialogDescription>
        <DialogBody className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPendingFaceOrder("term-first")}
              className={clsx(
                "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
                pendingFaceOrder === "term-first"
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30 dark:border-indigo-400 dark:bg-indigo-500/15 dark:ring-indigo-400/25"
                  : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-white/15 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10"
              )}
              aria-pressed={pendingFaceOrder === "term-first"}
            >
              <DocumentTextIcon
                className="size-14 shrink-0 text-indigo-600 dark:text-indigo-400"
                aria-hidden
              />
              <div>
                <p className="text-base font-semibold text-zinc-950 dark:text-white">Term on top</p>
                <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  See the term first; tap the card to reveal the definition.
                </Text>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPendingFaceOrder("definition-first")}
              className={clsx(
                "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
                pendingFaceOrder === "definition-first"
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30 dark:border-indigo-400 dark:bg-indigo-500/15 dark:ring-indigo-400/25"
                  : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-white/15 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10"
              )}
              aria-pressed={pendingFaceOrder === "definition-first"}
            >
              <BookOpenIcon
                className="size-14 shrink-0 text-indigo-600 dark:text-indigo-400"
                aria-hidden
              />
              <div>
                <p className="text-base font-semibold text-zinc-950 dark:text-white">
                  Definition on top
                </p>
                <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  See the definition first; tap the card to reveal the term.
                </Text>
              </div>
            </button>
          </div>
        </DialogBody>
        <DialogActions>
          <Button outline onClick={handleOrientationClose}>
            Cancel
          </Button>
          <Button color="indigo" disabled={pendingFaceOrder === null} onClick={confirmOrder}>
            Confirm and start
          </Button>
        </DialogActions>
        <div className="mt-6 border-t border-zinc-950/10 pt-6 dark:border-white/10">
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-950 dark:text-white">Tips:</span> Tap the study
            card to flip between term and definition. Use the on-screen arrows or the{" "}
            <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:border-white/20 dark:bg-white/10">
              ←
            </kbd>{" "}
            and{" "}
            <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:border-white/20 dark:bg-white/10">
              →
            </kbd>{" "}
            keys to move between cards. You can reopen this dialog anytime with{" "}
            <span className="font-medium text-zinc-950 dark:text-white">Study options</span>.
          </Text>
        </div>
      </Dialog>

      {faceOrder && current ? (
        <section className="w-full" aria-labelledby="study-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button plain href={`/decks/${deckId}/manage`}>
              ← Back to deck
            </Button>
            <Button outline onClick={openStudyOptions}>
              Study options
            </Button>
          </div>

          <div className="-mx-4 rounded-3xl bg-zinc-50 p-4 sm:-mx-6 sm:p-6 lg:-mx-8 lg:p-8 dark:bg-zinc-900/40">
            <header className="mb-4 text-center sm:text-left">
              <Heading id="study-heading">{deckTitle}</Heading>
              <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Study mode</Text>
            </header>

            <div className="mx-auto flex w-full max-w-md flex-col items-stretch gap-3">
              <button
                type="button"
                data-study-flip-card
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipHint}
                className="group relative h-[clamp(10.5rem,min(34svh,15rem),15rem)] w-full cursor-pointer rounded-2xl border border-zinc-950/10 bg-zinc-50 text-left shadow-sm ring-1 ring-zinc-950/5 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-[clamp(10rem,min(30svh,14rem),14rem)] dark:border-white/10 dark:bg-zinc-900/60 dark:ring-white/10 dark:focus-visible:ring-offset-zinc-950"
                style={{ perspective: "1200px" }}
              >
                <span
                  className="relative block size-full min-h-0 transition-transform duration-500 ease-out motion-reduce:transition-none [transform-style:preserve-3d]"
                  style={{
                    transform: flipped ? "rotateX(180deg)" : "rotateX(0deg)",
                  }}
                >
                  <span
                    className="absolute inset-0 flex min-h-0 flex-col rounded-2xl bg-white p-4 shadow-inner dark:bg-zinc-900 [backface-visibility:hidden]"
                    aria-hidden={flipped}
                  >
                    <span className="shrink-0 text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
                      {frontLabel}
                    </span>
                    <span className="mt-2 min-h-0 flex-1 overflow-y-auto text-left text-sm/6 font-medium whitespace-pre-wrap text-zinc-950 sm:text-base/7 dark:text-white">
                      {frontText}
                    </span>
                  </span>
                  <span
                    className="absolute inset-0 flex min-h-0 flex-col rounded-2xl bg-white p-4 shadow-inner dark:bg-zinc-900 [backface-visibility:hidden] [transform:rotateX(180deg)]"
                    aria-hidden={!flipped}
                  >
                    <span className="shrink-0 text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
                      {backLabel}
                    </span>
                    <span className="mt-2 min-h-0 flex-1 overflow-y-auto text-left text-sm/6 font-medium whitespace-pre-wrap text-zinc-950 sm:text-base/7 dark:text-white">
                      {backText}
                    </span>
                  </span>
                </span>
              </button>

              <Text className="text-center text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
                {flipHint}
              </Text>

              <nav
                className="flex w-full items-center justify-center gap-2 self-center"
                aria-label="Card navigation"
              >
                <Button
                  plain
                  disabled={index <= 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  aria-label="Previous card"
                  className="min-h-11 min-w-11 shrink-0 px-2 py-2 !text-zinc-950 data-disabled:opacity-35 dark:!text-white"
                >
                  <ChevronLeftIcon data-slot="icon" className="!size-7 stroke-2 sm:!size-8" />
                  <span className="sr-only">Previous card</span>
                </Button>
                <Text
                  className="min-w-[4.5rem] shrink-0 text-center tabular-nums text-base font-semibold text-zinc-950 sm:min-w-[5rem] sm:text-lg dark:text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {index + 1} / {total}
                </Text>
                <Button
                  plain
                  disabled={index >= total - 1}
                  onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                  aria-label="Next card"
                  className="min-h-11 min-w-11 shrink-0 px-2 py-2 !text-zinc-950 data-disabled:opacity-35 dark:!text-white"
                >
                  <ChevronRightIcon data-slot="icon" className="!size-7 stroke-2 sm:!size-8" />
                  <span className="sr-only">Next card</span>
                </Button>
              </nav>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

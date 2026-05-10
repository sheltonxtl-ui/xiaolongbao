"use client";

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
import {
  Pagination,
  PaginationNext,
  PaginationPrevious,
} from "@/components/catalyst/pagination";
import { Text } from "@/components/catalyst/text";
import type { DeckTerm } from "@/lib/decks-mock-data";

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
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = terms[index];

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

  const chooseOrder = useCallback((order: StudyFaceOrder) => {
    closedAfterPickRef.current = true;
    setFaceOrder(order);
    setFlipped(false);
    setOrientationOpen(false);
  }, []);

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
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-600 dark:bg-zinc-900/30">
          <Heading id="study-empty-heading">No cards to study</Heading>
          <Text className="mt-2">
            Add terms in{" "}
            <span className="font-medium text-zinc-950 dark:text-white">{deckTitle}</span>{" "}
            before starting study mode.
          </Text>
          <div className="mt-6 flex justify-center">
            <Button color="indigo" href={`/decks/${deckId}/manage`}>
              Edit deck
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Dialog open={orientationOpen} onClose={handleDialogClose} size="md">
        <DialogTitle>How do you want to study?</DialogTitle>
        <DialogDescription>
          Choose which side of the card you see first. You can tap the card anytime to flip between
          term and definition.
        </DialogDescription>
        <DialogBody>
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            Tip: use arrow keys on your keyboard to move between cards once you start.
          </Text>
        </DialogBody>
        <DialogActions>
          <Button outline onClick={handleOrientationClose}>
            Cancel
          </Button>
          <Button outline onClick={() => chooseOrder("definition-first")}>
            Definition on top
          </Button>
          <Button color="indigo" onClick={() => chooseOrder("term-first")}>
            Term on top
          </Button>
        </DialogActions>
      </Dialog>

      {faceOrder && current ? (
        <section className="w-full" aria-labelledby="study-heading">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button plain href={`/decks/${deckId}/manage`}>
              ← Back to deck
            </Button>
            <Button outline onClick={openStudyOptions}>
              Study options
            </Button>
          </div>

          <header className="mb-8 text-center sm:text-left">
            <Heading id="study-heading">{deckTitle}</Heading>
            <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Study mode</Text>
          </header>

          <div className="mx-auto flex max-w-2xl flex-col items-stretch gap-8">
            <button
              type="button"
              data-study-flip-card
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipHint}
              className="group relative aspect-[4/3] w-full cursor-pointer rounded-2xl border border-zinc-950/10 bg-zinc-50 text-left shadow-sm ring-1 ring-zinc-950/5 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-900/60 dark:ring-white/10 dark:focus-visible:ring-offset-zinc-950 max-sm:aspect-[3/4]"
              style={{ perspective: "1200px" }}
            >
              <span
                className="relative block size-full transition-transform duration-500 ease-out motion-reduce:transition-none [transform-style:preserve-3d]"
                style={{
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <span
                  className="absolute inset-0 flex flex-col justify-center overflow-auto rounded-2xl bg-white p-6 shadow-inner dark:bg-zinc-900 [backface-visibility:hidden]"
                  aria-hidden={flipped}
                >
                  <span className="text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
                    {frontLabel}
                  </span>
                  <span className="mt-3 text-lg/7 font-medium text-zinc-950 whitespace-pre-wrap dark:text-white sm:text-xl/8">
                    {frontText}
                  </span>
                </span>
                <span
                  className="absolute inset-0 flex flex-col justify-center overflow-auto rounded-2xl bg-white p-6 shadow-inner dark:bg-zinc-900 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  aria-hidden={!flipped}
                >
                  <span className="text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
                    {backLabel}
                  </span>
                  <span className="mt-3 text-lg/7 font-medium text-zinc-950 whitespace-pre-wrap dark:text-white sm:text-xl/8">
                    {backText}
                  </span>
                </span>
              </span>
            </button>

            <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">{flipHint}</Text>

            <Pagination className="w-full max-w-2xl items-center gap-4" aria-label="Card navigation">
              <PaginationPrevious
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index <= 0}
                aria-label="Previous card"
              >
                <span className="sr-only">Previous card</span>
              </PaginationPrevious>
              <Text
                className="shrink-0 grow text-center tabular-nums text-sm font-semibold text-zinc-950 dark:text-white"
                aria-live="polite"
                aria-atomic="true"
              >
                {index + 1} / {total}
              </Text>
              <PaginationNext
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                disabled={index >= total - 1}
                aria-label="Next card"
              >
                <span className="sr-only">Next card</span>
              </PaginationNext>
            </Pagination>
          </div>
        </section>
      ) : null}
    </>
  );
}

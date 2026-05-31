"use client";

import clsx from "clsx";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { ErrorMessage, Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Text } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import { DeckErrorPanel, DeckLoadingPanel } from "@/components/decks/DeckAsyncState";
import type { GeneratedFlashcard } from "@/lib/flashcards/types";

const DIFFICULTY_COLOR: Record<
  GeneratedFlashcard["difficulty"],
  Parameters<typeof Badge>[0]["color"]
> = {
  easy: "emerald",
  medium: "amber",
  hard: "rose",
};

export type DraftGeneratedCard = GeneratedFlashcard & {
  clientId: string;
};

function StreamingFlashcardItem({
  card,
  index,
  isNew,
}: {
  card: GeneratedFlashcard;
  index: number;
  isNew?: boolean;
}) {
  return (
    <li
      className={clsx(
        "rounded-lg border border-zinc-950/10 bg-white p-4 shadow-xs ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900/40 dark:ring-white/10",
        isNew && "ring-2 ring-indigo-500/30 dark:ring-indigo-400/30",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
          {index}
        </span>
        <Badge color={DIFFICULTY_COLOR[card.difficulty]}>{card.difficulty}</Badge>
        <Badge color="zinc">{card.topic}</Badge>
      </div>
      <p className="mt-3 text-sm/6 font-semibold text-zinc-950 dark:text-white">{card.front}</p>
      <p className="mt-2 text-sm/6 text-zinc-600 dark:text-zinc-400">{card.back}</p>
    </li>
  );
}

function EditableGeneratedCard({
  card,
  index,
  onChange,
}: {
  card: DraftGeneratedCard;
  index: number;
  onChange: (clientId: string, value: { front: string; back: string }) => void;
}) {
  const frontId = `${card.clientId}-front`;
  const backId = `${card.clientId}-back`;

  return (
    <li className="rounded-lg border border-zinc-950/10 bg-white p-4 shadow-xs ring-1 ring-zinc-950/5 dark:border-white/10 dark:bg-zinc-900/40 dark:ring-white/10">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
          {index}
        </span>
        <Badge color={DIFFICULTY_COLOR[card.difficulty]}>{card.difficulty}</Badge>
        <Badge color="zinc">{card.topic}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor={frontId}>Front</Label>
          <Textarea
            id={frontId}
            name={frontId}
            rows={3}
            resizable={false}
            value={card.front}
            onChange={(e) =>
              onChange(card.clientId, { front: e.target.value, back: card.back })
            }
            placeholder="Question or term"
          />
        </Field>

        <Field>
          <Label htmlFor={backId}>Back</Label>
          <Textarea
            id={backId}
            name={backId}
            rows={3}
            resizable={false}
            value={card.back}
            onChange={(e) =>
              onChange(card.clientId, { front: card.front, back: e.target.value })
            }
            placeholder="Answer or definition"
          />
        </Field>
      </div>
    </li>
  );
}

export function GenerateDeckStreamingView({
  cards,
  draftCards,
  isGenerating,
  isComplete,
  error,
  deckTitle,
  saveError,
  isSaving,
  onCancel,
  onStartOver,
  onDeckTitleChange,
  onDraftCardChange,
  onSave,
}: {
  cards: GeneratedFlashcard[];
  draftCards: DraftGeneratedCard[];
  isGenerating: boolean;
  isComplete: boolean;
  error: string | null;
  deckTitle: string;
  saveError: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onStartOver: () => void;
  onDeckTitleChange: (title: string) => void;
  onDraftCardChange: (clientId: string, value: { front: string; back: string }) => void;
  onSave: () => void;
}) {
  const latestIndex = cards.length;
  const displayCards = isComplete ? draftCards : cards;
  const canEdit = isComplete && !error;

  return (
    <section className="w-full" aria-live="polite">
      <header className="mb-8">
        <Heading>{isComplete ? "Flashcards ready" : "Generating flashcards"}</Heading>
        <Text className="mt-2 max-w-2xl">
          {isComplete
            ? "Edit any card below, then save the deck to your library."
            : "Your cards are being created in the background and will appear here as they are ready."}
        </Text>
      </header>

      {isGenerating ? (
        <DeckLoadingPanel
          headingId="generate-stream-loading-heading"
          title="Generating your deck"
          description={
            cards.length === 0
              ? "Analyzing your notes and drafting flashcards…"
              : `${cards.length} card${cards.length === 1 ? "" : "s"} ready so far — still generating…`
          }
          className="mb-8"
        />
      ) : null}

      {error ? (
        <DeckErrorPanel
          headingId="generate-stream-error-heading"
          title="Generation stopped"
          message={error}
          onRetry={onStartOver}
          retryLabel="Start over"
          className="mb-8"
        />
      ) : null}

      {isComplete && !error ? (
        <div className="mb-8 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <SparklesIcon
            className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <Subheading level={2}>Generation complete</Subheading>
            <Text className="mt-1">
              {draftCards.length} flashcard{draftCards.length === 1 ? "" : "s"} generated. Adjust
              the front and back of any card before saving.
            </Text>
          </div>
        </div>
      ) : null}

      {displayCards.length > 0 ? (
        <div>
          <Subheading level={2} className="mb-4">
            {isGenerating ? "Streaming preview" : "Generated cards"}
          </Subheading>
          <ul className="list-none space-y-4">
            {canEdit
              ? draftCards.map((card, index) => (
                  <EditableGeneratedCard
                    key={card.clientId}
                    card={card}
                    index={index + 1}
                    onChange={onDraftCardChange}
                  />
                ))
              : cards.map((card, index) => (
                  <StreamingFlashcardItem
                    key={`${card.front}-${index}`}
                    card={card}
                    index={index + 1}
                    isNew={isGenerating && index + 1 === latestIndex}
                  />
                ))}
          </ul>
        </div>
      ) : null}

      {isGenerating ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button outline onClick={onCancel}>
            Cancel generation
          </Button>
        </div>
      ) : null}

      {canEdit && draftCards.length > 0 ? (
        <footer className="mt-10">
          <Divider className="mb-8" />
          <Fieldset disabled={isSaving}>
            <Field>
              <Label htmlFor="generated-deck-title">Deck title</Label>
              <Input
                id="generated-deck-title"
                name="generated-deck-title"
                value={deckTitle}
                onChange={(e) => onDeckTitleChange(e.target.value)}
                placeholder="e.g. Biology midterm review"
              />
              {saveError ? <ErrorMessage>{saveError}</ErrorMessage> : null}
            </Field>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button outline onClick={onStartOver} disabled={isSaving}>
                Start over
              </Button>
              <Button color="indigo" disabled={isSaving} onClick={onSave}>
                {isSaving ? "Saving deck…" : "Save deck to library"}
              </Button>
            </div>
          </Fieldset>
        </footer>
      ) : null}
    </section>
  );
}

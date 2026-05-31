"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeGeneratedDeckAction } from "@/app/actions/decks";
import { Button } from "@/components/catalyst/button";
import {
  Description,
  ErrorMessage,
  Field,
  Fieldset,
  Label,
} from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/catalyst/tabs";
import { Text } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import {
  GenerateDeckStreamingView,
  type DraftGeneratedCard,
} from "@/components/decks/GenerateDeckStreamingView";
import {
  ImportDeckForm,
  type ImportDeckSource,
} from "@/components/decks/ImportDeckForm";
import { countWords, MAX_NOTES_WORDS } from "@/lib/decks/wordCount";
import { suggestTitleFromUrl } from "@/lib/flashcards/suggest-title";
import { useFlashcardGenerationStream } from "@/lib/hooks/useFlashcardGenerationStream";
import type { GeneratedFlashcard } from "@/lib/flashcards/types";

type CreationMethod = "notes" | "import";

const TAB_INDEX: Record<CreationMethod, number> = {
  notes: 0,
  import: 1,
};

function suggestDeckTitle(notes: string): string {
  const firstLine = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return `Generated deck — ${new Date().toLocaleDateString()}`;
  }

  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine;
}

function toDraftCards(cards: GeneratedFlashcard[]): DraftGeneratedCard[] {
  return cards.map((card, index) => ({
    ...card,
    clientId: `draft_${index}_${card.front.slice(0, 12)}`,
  }));
}

export function GenerateDeckPage() {
  const router = useRouter();
  const [method, setMethod] = useState<CreationMethod>("notes");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [draftCards, setDraftCards] = useState<DraftGeneratedCard[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { state, start, cancel, reset } = useFlashcardGenerationStream();
  const prevStatusRef = useRef(state.status);

  const wordCount = useMemo(() => countWords(notes), [notes]);
  const isOverLimit = wordCount > MAX_NOTES_WORDS;
  const canGenerate = notes.trim().length > 0 && !isOverLimit;

  const isGenerating = state.status === "generating";
  const isSessionActive =
    state.status === "generating" || state.status === "complete" || state.status === "error";

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (prevStatus !== "complete" && state.status === "complete") {
      setDraftCards(toDraftCards(state.cards));
      setDeckTitle(suggestedTitle);
      setSaveError(null);
    }
    prevStatusRef.current = state.status;
  }, [state, suggestedTitle]);

  const beginGeneration = useCallback(
    async (source: Parameters<typeof start>[0], titleHint: string) => {
      setFormError(null);
      setSuggestedTitle(titleHint);
      setDeckTitle(titleHint);
      setDraftCards([]);
      setSaveError(null);
      setIsSaving(false);
      await start(source);
    },
    [start],
  );

  const handleGenerate = () => {
    if (!canGenerate || isGenerating) return;
    void beginGeneration({ type: "notes", text: notes }, suggestDeckTitle(notes));
  };

  const handleImport = useCallback(
    async (source: ImportDeckSource) => {
      if (source.type === "link") {
        await beginGeneration(
          { type: "link", url: source.url },
          suggestTitleFromUrl(source.url),
        );
        return;
      }

      const baseName = source.file.name.replace(/\.[^.]+$/, "");
      await beginGeneration({ type: "file", file: source.file }, baseName || "Imported deck");
    },
    [beginGeneration],
  );

  const handleStartOver = () => {
    reset();
    setDraftCards([]);
    setDeckTitle("");
    setSaveError(null);
    setIsSaving(false);
    setFormError(null);
  };

  const handleDraftCardChange = useCallback(
    (clientId: string, value: { front: string; back: string }) => {
      setDraftCards((prev) =>
        prev.map((card) =>
          card.clientId === clientId
            ? { ...card, front: value.front, back: value.back }
            : card,
        ),
      );
      if (saveError) setSaveError(null);
    },
    [saveError],
  );

  const handleSave = useCallback(async () => {
    const trimmedTitle = deckTitle.trim();
    const validCards = draftCards.filter(
      (card) => card.front.trim().length > 0 && card.back.trim().length > 0,
    );

    if (!trimmedTitle) {
      setSaveError("Enter a deck title before saving.");
      return;
    }

    if (validCards.length === 0) {
      setSaveError("Add at least one card with a front and back.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const result = await finalizeGeneratedDeckAction(
      trimmedTitle,
      validCards.map((card) => ({
        question: card.front.trim(),
        answer: card.back.trim(),
      })),
    );

    if (!result.ok) {
      setSaveError(result.error);
      setIsSaving(false);
      return;
    }

    router.push(`/decks/${result.deckId}/manage`);
  }, [deckTitle, draftCards, router]);

  if (isSessionActive) {
    return (
      <GenerateDeckStreamingView
        cards={state.cards}
        draftCards={draftCards}
        isGenerating={state.status === "generating"}
        isComplete={state.status === "complete"}
        error={state.status === "error" ? state.error : null}
        deckTitle={deckTitle}
        saveError={saveError}
        isSaving={isSaving}
        onCancel={cancel}
        onStartOver={handleStartOver}
        onDeckTitleChange={(title) => {
          setDeckTitle(title);
          if (saveError) setSaveError(null);
        }}
        onDraftCardChange={handleDraftCardChange}
        onSave={() => void handleSave()}
      />
    );
  }

  return (
    <>
      <section className="w-full">
        <header className="mb-8">
          <Heading>New deck</Heading>
          <Text className="mt-2 max-w-2xl">
            Paste your notes to generate flashcards, or import an existing deck from a link or file.
          </Text>
        </header>

        <Fieldset>
          <Tabs
            selectedIndex={TAB_INDEX[method]}
            onChange={(index) => setMethod(index === 0 ? "notes" : "import")}
          >
            <TabList aria-label="How to create your deck">
              <Tab>Paste notes</Tab>
              <Tab>Import deck</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Field>
                  <Label htmlFor="deck-notes">Your notes</Label>
                  <Description>
                    Paste everything you want turned into cards. Keep it under{" "}
                    {MAX_NOTES_WORDS.toLocaleString()} words so generation stays within the context
                    window.
                  </Description>
                  <div
                    className={clsx(
                      "mt-3 overflow-hidden rounded-lg ring-1 ring-zinc-950/10 dark:ring-white/10",
                      isOverLimit && "ring-red-500/50 dark:ring-red-500/40",
                    )}
                  >
                    <Textarea
                      id="deck-notes"
                      name="deck-notes"
                      rows={14}
                      resizable={false}
                      placeholder="Paste your notes here…"
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      aria-describedby="deck-notes-word-count"
                      invalid={isOverLimit || undefined}
                      className="[&_[data-slot=control]]:before:rounded-none [&_[data-slot=control]]:after:rounded-none [&_[data-slot=control]]:rounded-none [&_textarea]:min-h-72 [&_textarea]:rounded-none [&_textarea]:border-0 [&_textarea]:pb-2"
                    />
                    <div
                      id="deck-notes-word-count"
                      className={clsx(
                        "flex items-center justify-end border-t border-zinc-950/10 bg-zinc-50/80 px-4 py-2 text-sm tabular-nums dark:border-white/10 dark:bg-white/5",
                        isOverLimit
                          ? "font-medium text-red-600 dark:text-red-400"
                          : wordCount > MAX_NOTES_WORDS * 0.9
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-500 dark:text-zinc-400",
                      )}
                      aria-live="polite"
                    >
                      {wordCount.toLocaleString()} words out of{" "}
                      {MAX_NOTES_WORDS.toLocaleString()} words
                    </div>
                  </div>
                  {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}
                </Field>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button outline href="/decks">
                    Back to decks
                  </Button>
                  <Button
                    color="indigo"
                    disabled={!canGenerate || isGenerating}
                    onClick={handleGenerate}
                  >
                    Generate deck
                  </Button>
                </div>
              </TabPanel>

              <TabPanel>
                <Text className="mb-6 max-w-2xl">
                  Upload study material and we will extract the content and generate flashcards.
                  Supported formats include CSV, JSON, TSV, PDF, Word, images, plain text, and Anki
                  packages.
                </Text>
                <ImportDeckForm
                  showCancel
                  cancelLabel="Back to decks"
                  cancelHref="/decks"
                  submitLabel="Generate deck"
                  onImport={handleImport}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Fieldset>
      </section>
    </>
  );
}

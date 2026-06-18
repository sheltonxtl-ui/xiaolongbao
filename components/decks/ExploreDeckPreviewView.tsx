"use client";

import { useState, useTransition } from "react";
import { BookmarkIcon, CheckIcon } from "@heroicons/react/16/solid";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/catalyst/description-list";
import { Divider } from "@/components/catalyst/divider";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { saveDeckAction } from "@/app/actions/decks";
import type { ExploreDeckPreview } from "@/lib/decks/types";

function PreviewCard({
  index,
  question,
  answer,
}: {
  index: number;
  question: string;
  answer: string;
}) {
  return (
    <article className="rounded-lg border border-zinc-950/10 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-zinc-800/50">
      <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Card {index}
      </Text>
      <Subheading level={3} className="mt-2 text-sm/6">
        {question}
      </Subheading>
      <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{answer}</Text>
    </article>
  );
}

export function ExploreDeckPreviewView({
  preview,
  onSaved,
}: {
  preview: ExploreDeckPreview;
  onSaved?: () => void;
}) {
  const [isSaved, setIsSaved] = useState(preview.isSaved);
  const [saveMessage, setSaveMessage] = useState<string | null>(
    preview.isSaved ? "Already saved to your collection." : null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (isSaved || isPending) return;

    setSaveError(null);
    startTransition(async () => {
      const result = await saveDeckAction(preview.id);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setIsSaved(true);
      setSaveMessage(
        result.alreadySaved
          ? "Already saved to your collection."
          : "Saved to your collection!",
      );
      onSaved?.();
    });
  }

  return (
    <section className="w-full">
      <header>
        <Heading>{preview.title}</Heading>
        {preview.description ? (
          <Text className="mt-3 max-w-2xl">{preview.description}</Text>
        ) : null}
      </header>

      <DescriptionList className="mt-8">
        <DescriptionTerm>Author</DescriptionTerm>
        <DescriptionDetails>{preview.authorName}</DescriptionDetails>
        <DescriptionTerm>Cards</DescriptionTerm>
        <DescriptionDetails>
          <Badge color="zinc" className="tabular-nums">
            {preview.cardCount} card{preview.cardCount === 1 ? "" : "s"}
          </Badge>
        </DescriptionDetails>
      </DescriptionList>

      <Divider className="my-8" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            color="indigo"
            onClick={handleSave}
            disabled={isSaved || isPending}
            className="!inline-flex !items-center !gap-x-2"
          >
            {isSaved ? (
              <CheckIcon data-slot="icon" className="!size-4" />
            ) : (
              <BookmarkIcon data-slot="icon" className="!size-4" />
            )}
            {isPending ? "Saving…" : isSaved ? "Saved" : "Save to My Collection"}
          </Button>
          {saveMessage ? (
            <Text
              className="mt-2 text-sm text-emerald-600 dark:text-emerald-400"
              role="status"
              aria-live="polite"
            >
              {saveMessage}
            </Text>
          ) : null}
          {saveError ? (
            <Text className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {saveError}
            </Text>
          ) : null}
        </div>
        <Button outline href="/explore">
          Back to explore
        </Button>
      </div>

      {preview.previewCards.length > 0 ? (
        <>
          <Subheading level={2} className="mt-10">
            Preview
          </Subheading>
          <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            First {preview.previewCards.length} of {preview.cardCount} cards
          </Text>
          <ul className="mt-6 grid list-none gap-4 sm:grid-cols-2">
            {preview.previewCards.map((card, index) => (
              <li key={card.id}>
                <PreviewCard index={index + 1} question={card.question} answer={card.answer} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Text className="mt-10 text-sm text-zinc-500 dark:text-zinc-400">
          This deck has no cards to preview yet.
        </Text>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import FlashcardForm from "@/components/FlashcardForm";
import FlashcardList from "@/components/FlashcardList";

/** Original flashcard demo — marketing home is now `/`. */
export default function GeneratePage() {
  const [cards, setCards] = useState([]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <FlashcardForm onResult={setCards} />
      <FlashcardList cards={cards} />
    </main>
  );
}

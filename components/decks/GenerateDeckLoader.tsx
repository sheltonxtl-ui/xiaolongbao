"use client";

import { useEffect, useState } from "react";
import { DeckLoadingPanel } from "@/components/decks/DeckAsyncState";
import { GenerateDeckPage } from "@/components/decks/GenerateDeckPage";

export function GenerateDeckLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <section className="w-full" aria-labelledby="generate-page-loading-heading">
        <DeckLoadingPanel
          headingId="generate-page-loading-heading"
          title="Opening new deck"
          description="Getting the generator ready for you."
          className="mt-8"
        />
      </section>
    );
  }

  return <GenerateDeckPage />;
}

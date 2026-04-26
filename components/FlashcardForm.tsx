"use client";

import { useState } from "react";

export default function FlashcardForm({ onResult }: any) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const res = await fetch("/api/generate-flashcards", {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    onResult(data.flashcards);

    setLoading(false);
  };

  return (
    <div id="flashcard-generator" className="scroll-mt-28">
      <textarea
        id="flashcard-generator-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your notes..."
      />

      <button onClick={handleSubmit}>
        {loading ? "Generating..." : "Generate Flashcards"}
      </button>
    </div>
  );
}
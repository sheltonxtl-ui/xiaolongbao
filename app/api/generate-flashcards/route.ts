import { NextResponse } from "next/server";
import { generateFlashcardsFromNotes } from "@/lib/flashcards/generate";

/** Legacy route — prefer `generateFlashcardsAction` server action. */
export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const result = await generateFlashcardsFromNotes(typeof text === "string" ? text : "");

    if (!result.ok) {
      const status = result.code === "NOT_CONFIGURED" ? 503 : 400;
      return NextResponse.json({ error: result.error, flashcards: [] }, { status });
    }

    const flashcards = result.flashcards.map((card) => ({
      question: card.front,
      answer: card.back,
      difficulty: card.difficulty,
      topic: card.topic,
    }));

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}

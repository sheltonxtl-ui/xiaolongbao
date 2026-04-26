import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { buildFlashcardPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const prompt = buildFlashcardPrompt(text);

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content;

    const flashcards = JSON.parse(content || "[]");

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}
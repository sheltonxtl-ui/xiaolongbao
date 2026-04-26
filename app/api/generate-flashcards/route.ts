import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { buildFlashcardPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        {
          error:
            "AI generation is not configured yet. Set OPENAI_API_KEY when you are ready.",
          flashcards: [],
        },
        { status: 503 }
      );
    }

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

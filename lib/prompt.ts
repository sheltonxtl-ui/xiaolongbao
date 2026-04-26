export function buildFlashcardPrompt(text: string) {
    return `
  Convert the following text into concise flashcards.
  
  Rules:
  - Each flashcard must have a clear question and answer
  - Keep answers short and precise
  - Focus on key concepts
  
  Return ONLY JSON in this format:
  [
    { "question": "...", "answer": "..." }
  ]
  
  Text:
  ${text}
  `;
  }
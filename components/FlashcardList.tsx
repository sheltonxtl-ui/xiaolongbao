import { Flashcard } from "@/types/flashcard";

export default function FlashcardList({ cards }: { cards: Flashcard[] }) {
  return (
    <div>
      {cards.map((card, i) => (
        <div key={i}>
          <h3>{card.question}</h3>
          <p>{card.answer}</p>
        </div>
      ))}
    </div>
  );
}
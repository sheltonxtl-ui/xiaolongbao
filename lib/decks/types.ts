export type DeckTerm = {
  id: string;
  question: string;
  answer: string;
};

export type DeckDetail = {
  id: string;
  title: string;
  isPublic: boolean;
  description?: string;
  authorName?: string;
};

export type ExploreDeck = {
  id: string;
  title: string;
  authorName: string;
  cardCount: number;
};

export type ExploreDeckPreview = {
  id: string;
  title: string;
  description: string;
  authorName: string;
  cardCount: number;
  previewCards: DeckTerm[];
  isSaved: boolean;
};

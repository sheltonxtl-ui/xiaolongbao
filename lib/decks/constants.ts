export const UNCATEGORIZED_DECK_TITLE = "Uncategorized";

export const DECK_DELETE_SUCCESS_MESSAGE =
  "Deck deleted. All flashcards were moved to Uncategorized.";

export const COMMUNITY_DECK_UNSAVE_SUCCESS_MESSAGE =
  "Deck removed from your library. You can still find it in Explore.";

export function canDeleteDeck(deck: {
  isCommunityDeck?: boolean;
  isSystemDeck?: boolean;
}): boolean {
  return deck.isCommunityDeck !== true && deck.isSystemDeck !== true;
}

export function canUnsaveCommunityDeck(deck: { isCommunityDeck?: boolean }): boolean {
  return deck.isCommunityDeck === true;
}

export function canRemoveFromLibrary(deck: {
  isCommunityDeck?: boolean;
  isSystemDeck?: boolean;
  canDelete?: boolean;
  canUnsave?: boolean;
}): boolean {
  return deck.canDelete === true || deck.canUnsave === true;
}

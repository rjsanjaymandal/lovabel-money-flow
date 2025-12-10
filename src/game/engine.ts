import { UnoCard, CardColor, CardType } from "./types";

// Standard Uno Deck Composition (108 cards adjusted)
// We need to support 163 cards as requested, or flexible size.

export const createDeck = (includeExtensions: boolean = false): UnoCard[] => {
  const cards: UnoCard[] = [];
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];

  colors.forEach(color => {
    // 1 zero
    cards.push({ id: crypto.randomUUID(), color, type: 'number', value: 0 });

    // 2 of each 1-9
    for (let i = 1; i <= 9; i++) {
      cards.push({ id: crypto.randomUUID(), color, type: 'number', value: i });
      cards.push({ id: crypto.randomUUID(), color, type: 'number', value: i });
    }

    // 2 Skips, 2 Reverses, 2 Draw Two
    ['skip', 'reverse', 'draw2'].forEach(type => {
      cards.push({ id: crypto.randomUUID(), color, type: type as CardType });
      cards.push({ id: crypto.randomUUID(), color, type: type as CardType });
    });
  });

  // Wild Cards
  for (let i = 0; i < 4; i++) {
    cards.push({ id: crypto.randomUUID(), color: 'black', type: 'wild' });
    cards.push({ id: crypto.randomUUID(), color: 'black', type: 'wild_draw4' });
  }

  // If extensions requested (for 163 cards), add more decks or special cards
  if (includeExtensions) {
    // Adding another half deck to bulk it up
    const extraCards = createDeck(false).slice(0, 55);
    extraCards.forEach(c => cards.push({ ...c, id: crypto.randomUUID() }));
  }

  return shuffleDeck(cards);
};

export const shuffleDeck = (deck: UnoCard[]): UnoCard[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const isValidMove = (card: UnoCard, topCard: UnoCard): boolean => {
  if (card.type === 'wild' || card.type === 'wild_draw4') return true;
  if (card.color === topCard.color) return true;
  if (card.value !== undefined && card.value === topCard.value) return true;
  if (card.type === topCard.type && card.type !== 'number') return true;
  
  // Special Case: Wild that has been played (has color)
  if ((topCard.type === 'wild' || topCard.type === 'wild_draw4') && topCard.color) {
      if (card.color === topCard.color) return true;
  }

  return false;
};

export const getNextPlayerIndex = (current: number, total: number, direction: 1 | -1): number => {
  let next = current + direction;
  if (next >= total) next = 0;
  if (next < 0) next = total - 1;
  return next;
};

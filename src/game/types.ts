export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4';

export interface UnoCard {
  id: string; // Unique ID for React keys
  color: CardColor;
  type: CardType;
  value?: number; // 0-9
  score?: number; // For keeping score if needed
}

export interface Player {
  id: string;
  name: string;
  hand: UnoCard[];
  isReady: boolean;
  avatarUrl?: string;
  isUno?: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentPlayerIndex: number;
  direction: 1 | -1; // 1 = Clockwise, -1 = Counter-Clockwise
  status: 'waiting' | 'playing' | 'finished';
  winner?: Player | null;
  lastAction?: string; // "Player X played Red 5"
  version: number;
  turnStartTime: number;
}

export interface GameSettings {
  startingCards: number; // 1-10
  allowStacking: boolean; // Can stack +2 on +2?
}

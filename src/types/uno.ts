export type UnoCardColor = "red" | "blue" | "green" | "yellow" | "wild" | "black";
export type UnoCardType = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild_draw4";

export interface UnoCard {
  id: string;
  color: UnoCardColor;
  type: UnoCardType;
  value?: number;
  score?: number;
}

export interface Player {
  id: string;
  name: string;
  hand: UnoCard[];
  isReady: boolean;
  avatarUrl?: string;
  isUno?: boolean;
}

export interface GameSettings {
  startingCards: number;
  allowStacking: boolean;
  isPublic: boolean;
  maxPlayers: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  status: "waiting" | "playing" | "finished";
  version: number;
  turnStartTime: number;
  hasDrawnThisTurn: boolean;
  winner?: Player;
  settings?: GameSettings;
  lastAction?: string;
}

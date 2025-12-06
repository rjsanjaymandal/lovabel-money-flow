import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UnoTable } from "@/components/uno/UnoTable";
import { GameState, UnoCard, Player } from "@/game/types";
import { createDeck, isValidMove, getNextPlayerIndex, shuffleDeck } from "@/game/engine";
import { useToast } from "@/hooks/use-toast";
import { Bot, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnoBotPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isBotTurn, setIsBotTurn] = useState(false);

  // Initialize Game
  useEffect(() => {
    startLocalGame();
  }, []);

  const startLocalGame = () => {
    const deck = createDeck(true); // 163 cards for fun
    
    // Player Hand
    const playerHand = deck.splice(0, 7);
    
    // Bot Hand
    const botHand = deck.splice(0, 7);

    // Initial discard
    let firstCard = deck.pop()!;
    while(firstCard.type !== 'number') {
         deck.unshift(firstCard);
         firstCard = deck.pop()!;
    }

    const humanPlayer: Player = {
        id: "human",
        name: "You",
        hand: playerHand,
        isReady: true,
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
    };

    const botPlayer: Player = {
        id: "bot",
        name: "Bot 3000",
        hand: botHand,
        isReady: true,
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Bot3000"
    };

    setGameState({
        roomId: "local-bot-match",
        players: [humanPlayer, botPlayer],
        deck,
        discardPile: [firstCard],
        currentPlayerIndex: 0,
        direction: 1,
        status: 'playing',
        version: 1,
        lastAction: "Game Started"
    });
  };

  // Bot Logic Loop
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id === 'bot') {
        setIsBotTurn(true);
        const timer = setTimeout(() => {
            playBotTurn();
        }, 1500); // 1.5s thinking time
        return () => clearTimeout(timer);
    } else {
        setIsBotTurn(false);
    }
  }, [gameState?.currentPlayerIndex, gameState?.version]);

  const playBotTurn = () => {
     if (!gameState) return;
     
     const botIndex = gameState.players.findIndex(p => p.id === 'bot');
     const bot = gameState.players[botIndex];
     const topCard = gameState.discardPile[gameState.discardPile.length - 1];
     
     // 1. Find Valid Move
     const validCardIndex = bot.hand.findIndex(c => isValidMove(c, topCard));

     if (validCardIndex !== -1) {
         // Play Card
         const card = bot.hand[validCardIndex];
         handlePlayCard(card, 'bot');
         // Call Uno?
         if (bot.hand.length === 2) { // Will be 1 after play
             toast({ title: "Bot says: UNO!", icon: <Bot className="w-4 h-4"/> });
         }
     } else {
         // Draw Card
         handleDrawCard('bot');
     }
  };

  const handlePlayCard = (card: UnoCard, playerId: string) => {
    if (!gameState) return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!isValidMove(card, topCard)) {
        if (playerId === 'human') toast({ title: "Invalid Move", variant: "destructive" });
        return;
    }

    const nextState = { ...gameState };
    const playerIndex = nextState.players.findIndex(p => p.id === playerId);
    const player = nextState.players[playerIndex];

    // Remove card
    player.hand = player.hand.filter(c => c.id !== card.id);
    nextState.discardPile.push(card);

    // Apply Effects
    let direction = nextState.direction;
    let nextIndex = nextState.currentPlayerIndex;

    if (card.type === 'reverse') direction *= -1;
    if (card.type === 'skip') {
        nextIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
        toast({ title: playerId === 'bot' ? "Bot Skipped You!" : "You Skipped Bot!" });
    }
    if (card.type === 'draw2') {
         const victimIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
         const victim = nextState.players[victimIndex];
         const drawn = nextState.deck.splice(0, 2);
         victim.hand.push(...drawn);
         toast({ title: `${victim.name} drew 2 cards!` });
         // In simple rules, draw 2 also skips turn usually, or we can keep it simple. 
         // Standard Uno: Next player loses turn.
         if(nextState.players.length === 2) {
             // In 2 player, skip is effectively implied if we don't advance index twice? 
             // Actually Standard Rules: Draw 2 -> Next player draws and forfeits turn.
             nextIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
         }
    }
    
    // Wild Draw 4
    if (card.type === 'wild_draw4') {
        const victimIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
        const victim = nextState.players[victimIndex];
        const drawn = nextState.deck.splice(0, 4);
        victim.hand.push(...drawn);
        toast({ title: `${victim.name} drew 4 cards!` });
        if(nextState.players.length === 2) {
             nextIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
        }
    }

    // Advance Turn
    if (card.type !== 'skip') { // Skip already advanced once
        nextIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
    } else if (nextState.players.length === 2) {
        // In 2 player, Skip means play again.
        // Logic: current is 0. Next was 1. Skip makes next 1+1=0? 
        // Engine's getNext just does +1.
        // Let's stick to simple: If skip, we already advanced. If 2 player, skip means *I* play again. 
        // Current index is still me? No, engine logic needs care.
        // Let's rely on standard loop:
        // 1. Play card.
        // 2. Calc next index.
        // If Skip: next = next + 1. 
    }
    
    // Simple 2-Player Skip Fix
    if (card.type === 'reverse' && nextState.players.length === 2) {
         // Reverse in 2p acts like skip
         nextIndex = playerIndex; // It's my turn again
         toast({ title: "Reverse! Play Again!" });
    } else if (card.type === 'skip' && nextState.players.length === 2) {
         nextIndex = playerIndex; // Play again
    }


    nextState.currentPlayerIndex = nextIndex;
    nextState.direction = direction as 1 | -1;
    nextState.version += 1;

    // Check Win
    if (player.hand.length === 0) {
        nextState.status = 'finished';
        nextState.winner = player;
    }

    setGameState(nextState);
  };

  const handleDrawCard = (playerId?: string) => {
    if (!gameState) return;
    const activeId = playerId || 'human'; // default to human if called from UI

    const nextState = { ...gameState };
    const playerIndex = nextState.players.findIndex(p => p.id === activeId);
    const player = nextState.players[playerIndex];

    // Reshuffle check
    if (nextState.deck.length === 0) {
        if (nextState.discardPile.length > 1) {
            const top = nextState.discardPile.pop()!;
            nextState.deck = shuffleDeck([...nextState.discardPile]);
            nextState.discardPile = [top];
        } else {
            toast({ title: "No more cards!", variant: "destructive" });
            return;
        }
    }

    const newCard = nextState.deck.pop();
    if (newCard) {
        player.hand.push(newCard);
        
        // Pass Turn
        nextState.currentPlayerIndex = getNextPlayerIndex(nextState.currentPlayerIndex, nextState.players.length, nextState.direction);
        nextState.version += 1;
        setGameState(nextState);
    }
  };

  if (!gameState) return null;

  if (gameState.status === 'finished') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-black/90 text-white p-4">
              <div className="text-center space-y-6 animate-in zoom-in">
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto" />
                  <h1 className="text-5xl font-black">{gameState.winner?.name} Wins!</h1>
                  <Button size="lg" onClick={startLocalGame} className="text-xl">Play Again</Button>
                  <Button variant="outline" onClick={() => navigate('/uno')} className="ml-4">Exit</Button>
              </div>
          </div>
      );
  }

  return (
    <UnoTable 
        gameState={gameState}
        currentPlayerId="human"
        onPlayCard={(card) => handlePlayCard(card, 'human')}
        onDrawCard={() => handleDrawCard('human')}
        onCallUno={() => toast({ title: "You called UNO!" })}
        onExit={() => navigate("/uno")}
    />
  );
}

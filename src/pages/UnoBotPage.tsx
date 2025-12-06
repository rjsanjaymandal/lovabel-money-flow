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
        lastAction: "Game Started",
        turnStartTime: Date.now(),
        hasDrawnThisTurn: false
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

    // Timer Logic
    useEffect(() => {
        if (!gameState || gameState.status !== 'playing') return;
        
        // Only enforce for Human
        const isHumanTurn = gameState.players[gameState.currentPlayerIndex].id === 'human';
        if (!isHumanTurn) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - gameState.turnStartTime;
            if (elapsed > 120000) { // 2 minutes
                 toast({ title: "Time's up!", description: "Auto-drawing card...", variant: "destructive" });
                 handleDrawCard('human');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState]);

    const playBotTurn = () => {
     if (!gameState) return;
     
     const botIndex = gameState.players.findIndex(p => p.id === 'bot');
     const bot = gameState.players[botIndex];
     const topCard = gameState.discardPile[gameState.discardPile.length - 1];
     
     // 1. Find Valid Move
     const validCardIndex = bot.hand.findIndex(c => isValidMove(c, topCard));

     if (validCardIndex !== -1) {
         // Play Card
         let card = bot.hand[validCardIndex];
         
         // Bot Logic for Wilds: Pick most frequent color
         if (card.type === 'wild' || card.type === 'wild_draw4') {
             const colors = ['red', 'blue', 'green', 'yellow'] as const;
             // Simple random for now, or could count hand
             const randomColor = colors[Math.floor(Math.random() * colors.length)];
             card = { ...card, color: randomColor };
             toast({ title: `Bot chose ${randomColor.toUpperCase()}` });
         }

         handlePlayCard(card, 'bot');
         // Call Uno?
         if (bot.hand.length === 2) { // Will be 1 after play
             toast({ title: "Bot says: UNO!", description: "🤖 The bot is about to win!" });
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
    let skipTurn = false; // logic flag

    if (card.type === 'reverse') direction *= -1;
    if (card.type === 'skip') {
        skipTurn = true;
        toast({ title: playerId === 'bot' ? "Bot Skipped You!" : "You Skipped Bot!" });
    }
    if (card.type === 'draw2') {
         // Standard Uno: Victim draws 2 AND loses turn
         const victimIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
         const victim = nextState.players[victimIndex];
         const drawn = nextState.deck.splice(0, 2);
         victim.hand.push(...drawn);
         toast({ title: `${victim.name} drew 2 cards!` });
         
         // Victim loses turn
         skipTurn = true; 
    }
    
    // Wild Draw 4
    if (card.type === 'wild_draw4') {
        // Standard Uno: Victim draws 4 AND loses turn
        const victimIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
        const victim = nextState.players[victimIndex];
        const drawn = nextState.deck.splice(0, 4);
        victim.hand.push(...drawn);
        toast({ title: `${victim.name} drew 4 cards!` });
        
        // Victim loses turn
        skipTurn = true;
    }

    // Advance Turn
    // 1. Move to next player (always)
    nextIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
    
    // 2. If skip/draw2/draw4 was played, skip that next player
    if (skipTurn) {
        nextIndex = getNextPlayerIndex(nextIndex, nextState.players.length, direction);
    }

    nextState.currentPlayerIndex = nextIndex;
    nextState.direction = direction as 1 | -1;
    nextState.version += 1;
    // Reset draw flag
    nextState.hasDrawnThisTurn = false;
    // Update Turn Start Time
    nextState.turnStartTime = Date.now();

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
    
    // If Human already drew, prevent double draw (handled in UI, but safe here)
    if (activeId === 'human' && gameState.hasDrawnThisTurn) {
        toast({ title: "Already drew!", description: "Play a card or Pass." });
        return;
    }

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
        
        // LOGIC CHANGE: 
        // If Bot, it just continues turn logic (re-evaluates or passes).
        // If Human, we DO NOT advance turn immediately. We set hasDrawnThisTurn = true.
        
        if (activeId === 'bot') {
            // Check if playable immediately? simpler: just pass for now or re-eval
            // For this simpler bot, let's just end turn to keep it speedy, 
            // OR we could check if newCard is valid.
            const topCard = nextState.discardPile[nextState.discardPile.length - 1];
            if (isValidMove(newCard, topCard)) {
                 // Bot plays immediately if valid (simple heuristic)
                 // Recursive call isn't easy here due to state update batching. 
                 // We'll let the bot turn end for now.
                 // Actually, let's just pass turn for Bot always to be safe/simple.
                 nextState.currentPlayerIndex = getNextPlayerIndex(nextState.currentPlayerIndex, nextState.players.length, nextState.direction);
                 nextState.hasDrawnThisTurn = false;
                 nextState.turnStartTime = Date.now();
            } else {
                 nextState.currentPlayerIndex = getNextPlayerIndex(nextState.currentPlayerIndex, nextState.players.length, nextState.direction);
                 nextState.hasDrawnThisTurn = false;
                 nextState.turnStartTime = Date.now();
            }
        } else {
            // Human: Mark as drawn, waiting for Play or Pass
            nextState.hasDrawnThisTurn = true;
            nextState.lastAction = "You drew a card.";
            // Don't change currentPlayerIndex!
        }
        
        nextState.version += 1;
        setGameState(nextState);
    }
  };

  const handlePassTurn = () => {
      if (!gameState) return;
      const nextState = { ...gameState };
      
      nextState.currentPlayerIndex = getNextPlayerIndex(nextState.currentPlayerIndex, nextState.players.length, nextState.direction);
      nextState.hasDrawnThisTurn = false; // Reset flags
      nextState.turnStartTime = Date.now();
      nextState.version += 1;
      nextState.lastAction = "You passed.";
      
      setGameState(nextState);
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
        onPassTurn={handlePassTurn}
        onExit={() => navigate("/uno")}
        hideRoomCode={true}
    />
  );
}

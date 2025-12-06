import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnoLobby } from "@/components/uno/UnoLobby";
import { UnoTable } from "@/components/uno/UnoTable";
import { GameState, UnoCard, Player } from "@/game/types";
import { createDeck, isValidMove, getNextPlayerIndex, shuffleDeck } from "@/game/engine";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function UnoPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
  }, []);

  // Mapper: DB (snake_case) -> Frontend (camelCase)
  // Note: JSONB columns (players, deck, discard_pile) store data AS IS.
  // We assume we store them as camelCase inside the JSON.
  // We only map Top Level columns.
  // Mapper: DB (snake_case) -> Frontend (camelCase)
  const mapDbToGame = (row: { [key: string]: any }): GameState => ({
    roomId: row.room_id,
    players: row.players || [],
    deck: row.deck || [],
    discardPile: row.discard_pile || [],
    currentPlayerIndex: row.current_player_index || 0,
    direction: row.direction || 1,
    status: 'playing', // Derived
    version: row.version || 0,
    lastAction: "Synced"
  });

  // Fetch or Subscribe
  useEffect(() => {
    if (!roomCode) return;

    let channel: any;

    const fetchAndSubscribe = async () => {
        setLoading(true);
        // 1. Get Room ID from Code
        const { data: room, error: roomError } = await supabase
            .from('uno_rooms')
            .select('id, status')
            .eq('code', roomCode)
            .single();

        if (roomError || !room) {
            console.error("Room Error:", roomError);
            toast({ title: "Room not found", description: "This room code doesn't exist or the database tables are missing.", variant: "destructive" });
            setLoading(false);
            return;
        }

        // 2. Get Game State
        const { data: stateData, error: stateError } = await supabase
            .from('uno_game_states')
            .select('*')
            .eq('room_id', room.id)
            .single();

        if (stateData) {
            const parsedState = mapDbToGame(stateData);
            
            // Auto-Join Logic
            if (user && !parsedState.players.find(p => p.id === user.id)) {
                // Add me
                const deck = [...parsedState.deck];
                const hand = deck.splice(0, 7); // Default 7 cards
                const newPlayer: Player = {
                    id: user.id,
                    name: user.user_metadata?.full_name || `Player ${parsedState.players.length + 1}`,
                    hand,
                    isReady: true,
                    avatarUrl: user.user_metadata?.avatar_url
                };

                const newPlayers = [...parsedState.players, newPlayer];
                
                await supabase.from('uno_game_states').update({
                    players: newPlayers as any,
                    deck: deck as any,
                    version: parsedState.version + 1
                }).eq('room_id', room.id);
                
                // Local Optimistic Update
                setGameState({ ...parsedState, players: newPlayers, deck });
            } else {
                setGameState(parsedState);
            }
        }
        setLoading(false);

        // 3. Subscribe
        channel = supabase
            .channel(`uno-${room.id}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'uno_game_states', 
                filter: `room_id=eq.${room.id}` 
            }, (payload) => {
                if (payload.new) {
                    setGameState(mapDbToGame(payload.new as any));
                }
            })
            .subscribe();
    };

    fetchAndSubscribe();

    return () => {
        if (channel) supabase.removeChannel(channel);
    };
  }, [roomCode, user?.id]);


  const handleCreateRoom = async (startingCards: number) => {
    setLoading(true);
    try {
      if (!user) { toast({ title: "Login Required" }); return; }
      
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      // 1. Create Room
      const { data: room, error: roomError } = await supabase
        .from('uno_rooms')
        .insert({ code, host_id: user.id, settings: { starting_cards: startingCards }, status: 'playing' })
        .select()
        .single();
      
      if (roomError) throw roomError;

      // 2. Initialize Game State
      const deck = createDeck(true); // 163 cards
      const hand = deck.splice(0, startingCards);
      
      // Ensure number card to start
      let firstCard = deck.pop()!;
      while(firstCard.type !== 'number') {
         deck.unshift(firstCard);
         firstCard = deck.pop()!;
      }

      const initialPlayer: Player = { 
          id: user.id, 
          name: user.user_metadata?.full_name || "Player 1", 
          hand, 
          isReady: true 
      };
      
      const dbPayload = {
        room_id: room.id,
        current_player_index: 0,
        direction: 1,
        players: [initialPlayer],
        deck,
        discard_pile: [firstCard],
        version: 1
      };

      const { error: stateError } = await supabase
        .from('uno_game_states')
        .insert(dbPayload);

      if (stateError) throw stateError;
      
      navigate(`/uno/${code}`);

    } catch (err: any) {
        toast({ title: "Error creating room", description: err.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleJoinRoom = (code: string) => {
      navigate(`/uno/${code}`);
  };

  const handlePlayCard = async (card: UnoCard) => {
    if (!gameState || !user) return;
    
    // Optimistic Check
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (gameState.players[gameState.currentPlayerIndex].id !== user.id) {
         toast({ title: "Not your turn!", variant: "destructive" });
         return;
    }
    if (!isValidMove(card, topCard)) {
        toast({ title: "Invalid Move!", description: "Check color or number.", variant: "destructive" });
        return;
    }

    // Calc Logic
    const newDiscard = [...gameState.discardPile, card];
    const newPlayers = gameState.players.map(p => {
        if (p.id === user.id) return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
        return p;
    });

    let nextIndex = gameState.currentPlayerIndex;
    let direction = gameState.direction;

    if (card.type === 'reverse') direction *= -1;
    if (card.type === 'skip') nextIndex = getNextPlayerIndex(nextIndex, newPlayers.length, direction);
    
    nextIndex = getNextPlayerIndex(nextIndex, newPlayers.length, direction);

    await supabase.from('uno_game_states').update({
        discard_pile:  newDiscard as any,
        players: newPlayers as any,
        current_player_index: nextIndex,
        direction: direction,
        version: gameState.version + 1
    }).eq('room_id', gameState.roomId);
  };

  const handleDrawCard = async () => {
       if (!gameState || !user) return;
       if (gameState.players[gameState.currentPlayerIndex].id !== user.id) return;

       let deck = [...gameState.deck];
       let discard = [...gameState.discardPile];

       // Reshuffle if empty
       if (deck.length === 0) {
           const top = discard.pop();
           deck = shuffleDeck(discard);
           discard = [top!];
       }

       const newCard = deck.pop();
       if (!newCard) return;

       const newPlayers = gameState.players.map(p => {
           if (p.id === user.id) return { ...p, hand: [...p.hand, newCard] };
           return p;
       });

       const nextIndex = getNextPlayerIndex(gameState.currentPlayerIndex, newPlayers.length, gameState.direction);

       await supabase.from('uno_game_states').update({
           deck: deck as any,
           discard_pile: discard as any,
           players: newPlayers as any,
           current_player_index: nextIndex, // Pass turn after drawing 1
           version: gameState.version + 1
       }).eq('room_id', gameState.roomId);
  };

  if (!roomCode) {
    return <UnoLobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} isLoading={loading} />;
  }

  if (!gameState || loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white"><Loader2 className="animate-spin mr-2" /> Synching with Supabase...</div>;

  return (
    <UnoTable 
        gameState={gameState} 
        currentPlayerId={user?.id || ""} 
        onPlayCard={handlePlayCard} 
        onDrawCard={handleDrawCard}
        onCallUno={() => toast({ title: "UNO Called!" })}
        onExit={() => navigate("/uno")}
    />
  );
}

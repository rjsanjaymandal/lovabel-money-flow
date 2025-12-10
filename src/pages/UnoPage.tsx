import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnoLobby } from "@/components/uno/UnoLobby";
import { UnoTable } from "@/components/uno/UnoTable";
import { UnoWaitingRoom } from "@/components/uno/UnoWaitingRoom";
import { GameState, UnoCard, Player } from "@/game/types";
import { createDeck, isValidMove, getNextPlayerIndex, shuffleDeck } from "@/game/engine";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function UnoPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  // Separate status state because it comes from a different table/channel
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
  }, []);

  // Mapper: DB (snake_case) -> Frontend (camelCase)
  const mapDbToGame = (row: { [key: string]: any }): GameState => ({
    roomId: row.room_id,
    players: row.players || [],
    deck: row.deck || [],
    discardPile: row.discard_pile || [],
    currentPlayerIndex: row.current_player_index || 0,
    direction: row.direction || 1,
    // Status is often not in uno_game_states, so we default to waiting or use roomStatus
    status: row.status || 'waiting', 
    version: row.version || 0,
    // Use updated_at solely for timer sync. Fallback to Date.now() only if absolutely missing (unlikely)
    turnStartTime: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    hasDrawnThisTurn: row.has_drawn_this_turn || false
  });

  // Fetch or Subscribe
  useEffect(() => {
    if (!roomCode) return;

    let gameChannel: any;
    let roomChannel: any;

    const fetchAndSubscribe = async () => {
        setLoading(true);
        
        // 1. Get Room ID and Status
        const { data: room, error: roomError } = await supabase
            .from('uno_rooms')
            .select('id, status, settings')
            .eq('code', roomCode)
            .single();

        if (roomError || !room) {
            console.error("Room Error:", roomError);
            toast({ title: "Room not found", description: "This room code doesn't exist.", variant: "destructive" });
            setLoading(false);
            return;
        }

        // Set initial status
        setRoomStatus(room.status as any);

        // 2. Get Game State
        const { data: stateData, error: stateError } = await supabase
            .from('uno_game_states')
            .select('*')
            .eq('room_id', room.id)
            .single();

        if (stateData) {
            const parsedState = { ...mapDbToGame(stateData), settings: room.settings as any };
            
            // Auto-Join Logic (Only if waiting)
            // Enforce Max Players
            const settings = room.settings as any;
            const maxPlayers = settings?.max_players || 4;
            if (user && !parsedState.players.find(p => p.id === user.id) && parsedState.players.length < maxPlayers) {
                
                if (room.status === 'playing') {
                     // Spectator mode? For now just show game
                     setGameState(parsedState);
                } else {
                    // Add me
                    const deck = [...parsedState.deck];
                    const hand = deck.splice(0, 7); 
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
                }
            } else {
                setGameState(parsedState);
                if (!parsedState.players.find(p => p.id === user.id) && parsedState.players.length >= maxPlayers) {
                     toast({ title: "Room Full", description: "This room has reached max capacity.", variant: "destructive" });
                }
            }
        }
        setLoading(false);

        // 3. Subscribe to Game State (Players, Moves)
        gameChannel = supabase
            .channel(`uno-game-${room.id}`)
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

        // 4. Subscribe to Room Status (Waiting -> Playing)
        roomChannel = supabase
            .channel(`uno-room-${room.id}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'uno_rooms', 
                filter: `id=eq.${room.id}` 
            }, (payload) => {
                if (payload.new && payload.new.status) {
                    setRoomStatus(payload.new.status as any);
                }
            })
            .subscribe();
    };

    fetchAndSubscribe();

    return () => {
        if (gameChannel) supabase.removeChannel(gameChannel);
        if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [roomCode, user?.id]);


  // Timer Logic
  useEffect(() => {
    if (!gameState || !user || roomStatus !== 'playing') return;
    const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === user.id;
    if (!isMyTurn) return;

    const interval = setInterval(() => {
        const elapsed = Date.now() - gameState.turnStartTime;
        if (elapsed > 120000) { // 2 minutes
             toast({ title: "Time's up!", description: "You took too long. Drawing a card...", variant: "destructive" });
             handleDrawCard();
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, user, roomStatus]);


  const handleCreateRoom = async (startingCards: number, isPublic: boolean, maxPlayers: number) => {
    setLoading(true);
    try {
      if (!user) { toast({ title: "Login Required" }); return; }
      
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      // 1. Create Room (Starts Waiting)
      const { data: room, error: roomError } = await supabase
        .from('uno_rooms')
        .insert({ 
            code, 
            host_id: user.id, 
            settings: { starting_cards: startingCards, is_public: isPublic, max_players: maxPlayers }, 
            status: 'waiting' 
        })
        .select()
        .single();
      
      if (roomError) throw roomError;

      // 2. Initialize Game State
      const deck = createDeck(true); 
      const hand = deck.splice(0, startingCards);
      
      let firstCard = deck.pop()!;
      while(firstCard.type !== 'number') {
         deck.unshift(firstCard);
         firstCard = deck.pop()!;
      }

      const initialPlayer: Player = { 
          id: user.id, 
          name: user.user_metadata?.full_name || "Player 1", 
          hand, 
          isReady: true,
          avatarUrl: user.user_metadata?.avatar_url
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
        .insert(dbPayload as any);

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

    // Check for "Pass on Draw" reset 
    // Usually handled by turn advancement, but just safety clearing 
    const nextHasDrawn = false; 

    // Special Card Logic
    let skipTurn = false;
    if (card.type === 'reverse') direction *= -1;
    if (card.type === 'skip') skipTurn = true;
    if (card.type === 'draw2') skipTurn = true; // Victim skipped
    if (card.type === 'wild_draw4') skipTurn = true; // Victim skipped

    // Advance Turn
    nextIndex = getNextPlayerIndex(nextIndex, newPlayers.length, direction);
    
    if (skipTurn) {
         nextIndex = getNextPlayerIndex(nextIndex, newPlayers.length, direction);
    }

    await supabase.from('uno_game_states').update({
        discard_pile:  newDiscard as any,
        players: newPlayers as any,
        current_player_index: nextIndex,
        direction: direction,
        version: gameState.version + 1,
        has_drawn_this_turn: false // Reset
    }).eq('room_id', gameState.roomId);
  };

  const handleDrawCard = async () => {
       if (!gameState || !user) return;
       if (gameState.players[gameState.currentPlayerIndex].id !== user.id) return;
        
       // Prevent double draw
       if (gameState.hasDrawnThisTurn) return;

       let deck = [...gameState.deck];
       let discard = [...gameState.discardPile];

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

       // Logic: Draw 1 card. Do NOT advance turn. Set hasDrawnThisTurn = true.
       await supabase.from('uno_game_states').update({
           deck: deck as any,
           discard_pile: discard as any,
           players: newPlayers as any,
           version: gameState.version + 1,
           has_drawn_this_turn: true
       }).eq('room_id', gameState.roomId);
  };

  const handlePassTurn = async () => {
    if (!gameState || !user) return;
    if (gameState.players[gameState.currentPlayerIndex].id !== user.id) return;

    const nextIndex = getNextPlayerIndex(gameState.currentPlayerIndex, gameState.players.length, gameState.direction);
    
    await supabase.from('uno_game_states').update({
        current_player_index: nextIndex,
        version: gameState.version + 1,
        has_drawn_this_turn: false,
        // updated_at automagically updates on version bump or any change
    }).eq('room_id', gameState.roomId);
  };

  const handleStartGame = async () => {
      if (!gameState || !user) return;
      if (gameState.players[0].id !== user.id) return; // Only Host

      setLoading(true);
      try {
          // 1. Reset Game State Timer FIRST (so updated_at is fresh when people join)
          // We bump version to ensure the row actually updates and triggers updated_at
          const { error: stateError } = await supabase.from('uno_game_states').update({
              version: gameState.version + 1,
              has_drawn_this_turn: false, // Ensure clean slate
              current_player_index: 0
          }).eq('room_id', gameState.roomId);

          if (stateError) throw stateError;

          // 2. Update Room Status -> triggers subscription update for all -> 'playing'
          const { error: roomError } = await supabase.from('uno_rooms').update({ 
               status: 'playing' 
          }).eq('id', gameState.roomId);
          
          if (roomError) throw roomError;

      } catch (error: any) {
          console.error("Start Game Error:", error);
          toast({ title: "Failed to Start", description: error.message, variant: "destructive" });
      } finally {
          setLoading(false);
      }
  };

  const handleQuitGame = async () => {
    if (!user) {
        navigate("/uno");
        return;
    }

    const exitLocal = () => {
        setGameState(null);
        setRoomStatus('waiting');
        navigate("/uno");
    };

    if (!gameState) {
        exitLocal();
        return;
    }

    const myIndex = gameState.players.findIndex(p => p.id === user.id);
    if (myIndex === -1) {
        exitLocal();
        return;
    }

    const newPlayers = gameState.players.filter(p => p.id !== user.id);

    try {
        if (currentStatus === 'waiting') {
             await supabase.from('uno_game_states').update({
                players: newPlayers as any,
                version: gameState.version + 1
            }).eq('room_id', gameState.roomId);
        } else if (currentStatus === 'playing') {
             // If ONLY 1 player remains, they win immediately
             if (newPlayers.length === 1) {
                 const winner = newPlayers[0];
                 await supabase.from('uno_game_states').update({
                    players: newPlayers as any,
                    winner: winner as any,
                    version: gameState.version + 1
                 }).eq('room_id', gameState.roomId);
                 
                 await supabase.from('uno_rooms').update({ status: 'finished' }).eq('id', gameState.roomId);
             } else {
                 // Adjust Turn Logic to keep game flowing
                 let newIndex = gameState.currentPlayerIndex;
                 
                 // If I was situated BEFORE the current player, everyone shifts down one index
                 if (myIndex < gameState.currentPlayerIndex) {
                     newIndex = Math.max(0, newIndex - 1);
                 }
                 
                 // If the index is now out of bounds (e.g. last player quit), wrap to 0
                 if (newIndex >= newPlayers.length) {
                     newIndex = 0;
                 }
                 
                 await supabase.from('uno_game_states').update({
                    players: newPlayers as any,
                    current_player_index: newIndex,
                    version: gameState.version + 1
                 }).eq('room_id', gameState.roomId);
             }
        }
    } catch (error) {
        console.error("Error quitting game:", error);
        toast({ title: "Error leaving", description: "You might still be in the room.", variant: "destructive" });
    }
    
    exitLocal();
  };

  if (!roomCode) {
    return <UnoLobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} isLoading={loading} />;
  }

  if (!gameState || loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white"><Loader2 className="animate-spin mr-2" /> Synching with Supabase...</div>;

  // Use Combined Status: prioritize roomStatus if available
  const currentStatus = roomStatus || gameState.status;

  if (currentStatus === 'waiting') {
      return (
          <>
            <SEO title={roomCode ? `Uno Room ${roomCode}` : "Play Uno"} description="Join the Uno waiting room and challenge your friends!" />
            <UnoWaitingRoom 
                gameState={gameState}
                userId={user?.id}
                roomCode={roomCode}
                onStartGame={handleStartGame}
                onCopyCode={() => {
                    navigator.clipboard.writeText(roomCode);
                    toast({ title: "Copied!", description: "Room code copied." });
                }}
            />
          </>
      );
  }

  return (
    <>
      <SEO title={`Playing Uno (${roomCode})`} description="Active Uno Game in progress." />
      <UnoTable 
            gameState={{...gameState, hasDrawnThisTurn: gameState.hasDrawnThisTurn}} 
            currentPlayerId={user?.id || ""} 
            onPlayCard={handlePlayCard} 
            onDrawCard={handleDrawCard}
            onCallUno={() => toast({ title: "UNO Called!" })}
            onPassTurn={handlePassTurn}
            onExit={handleQuitGame}
            roomCode={roomCode}
        />
    </>
  );
}

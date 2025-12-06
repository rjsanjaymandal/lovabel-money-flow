import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Users, Play, Settings, Gamepad2, ArrowLeft, Bot, RotateCcw, Lock, Globe } from "lucide-react";
import { ZenBackground } from "@/components/ZenBackground";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnoRoomCard } from "./UnoRoomCard";
import { cn } from "@/lib/utils";

interface RoomData {
    id: string;
    room_id: string;
    players: any[];
    code: string; // Joined from uno_rooms
    status: string;
    settings?: any;
}

interface UnoLobbyProps {
  onCreateRoom: (startingCards: number, isPublic: boolean, maxPlayers: number) => void;
  onJoinRoom: (code: string) => void;
  isLoading: boolean;
}

export const UnoLobby = ({ onCreateRoom, onJoinRoom, isLoading }: UnoLobbyProps) => {
  const [mode, setMode] = useState<"menu" | "create" | "join" | "browse">("menu");
  const [joinCode, setJoinCode] = useState("");
  const [startingCards, setStartingCards] = useState([7]);
  const [maxPlayers, setMaxPlayers] = useState([4]);
  const [isPublic, setIsPublic] = useState(true);
  const [activeRooms, setActiveRooms] = useState<RoomData[]>([]);
  const [myRooms, setMyRooms] = useState<RoomData[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();

  // Fetch rooms when entering browse mode
  const fetchRooms = async () => {
      setIsFetching(true);
      
      const { data: states } = await supabase
        .from('uno_game_states')
        .select(`
            *,
            uno_rooms!inner (
                code,
                status,
                settings
            )
        `)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (states) {
          const mapped = states.map((s: any) => ({
              id: s.id,
              room_id: s.room_id,
              players: s.players,
              code: s.uno_rooms.code,
              status: s.uno_rooms.status,
              settings: s.uno_rooms.settings
          }));
          
          setActiveRooms(mapped.filter((s:any) => s.status === 'waiting' && s.settings?.is_public !== false));
      }
      setIsFetching(false);
  };

  const fetchMyRooms = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myRoomsData } = await supabase
          .from('uno_rooms')
          .select(`
              id,
              code,
              status,
              settings,
              uno_game_states (
                  players
              )
          `)
          .eq('host_id', user.id)
          .neq('status', 'finished')
          .order('created_at', { ascending: false });

      if (myRoomsData) {
          const mapped = myRoomsData.map((r: any) => ({
              id: r.id, // room id
              room_id: r.id,
              players: r.uno_game_states?.[0]?.players || [],
              code: r.code,
              status: r.status,
              settings: r.settings
          }));
          setMyRooms(mapped);
      }
  };

  const handleDeleteRoom = async (roomId: string) => {
      const { error } = await supabase.from('uno_rooms').delete().eq('id', roomId);
      if (!error) {
          setMyRooms(prev => prev.filter(r => r.room_id !== roomId));
      }
  };

  useEffect(() => {
      if (mode === 'browse') fetchRooms();
      if (mode === 'create') fetchMyRooms();
  }, [mode]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <ZenBackground />
      
      <div className={cn(
          "relative z-10 w-full animate-in fade-in zoom-in-95 duration-500",
          mode === 'browse' ? "max-w-5xl" : "max-w-md"
      )}>
        {mode !== "create" && (
        <Button 
            variant="ghost" 
            className="absolute -top-12 left-0 text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => mode === "menu" ? navigate("/dashboard") : setMode("menu")}
        >
            <ArrowLeft className="w-4 h-4 mr-2" /> {mode === "menu" ? "Dashboard" : "Back"}
        </Button>
        )}

        <Card className="bg-black/30 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden relative">
          {/* Decorative Gradient Blob */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/30 blur-3xl rounded-full" />

          <CardHeader className="text-center relative z-10 space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-4xl font-black tracking-tight text-white">
              UNO
            </CardTitle>
            <p className="text-white/60 font-medium">Multiplayer Edition</p>
          </CardHeader>
          
          <CardContent className="space-y-6 relative z-10">
            
            {mode === "menu" && (
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-primary/20 border-0"
                  onClick={() => setMode("create")}
                >
                  <Play className="mr-2 w-5 h-5 fill-current" /> Create Room
                </Button>
                
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 border-0"
                  onClick={() => setMode("browse")}
                >
                  <Users className="mr-2 w-5 h-5" /> Browse Public Rooms
                </Button>

                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold bg-cyan-600 hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-500/20 border-0"
                  onClick={() => navigate("/uno/bot")}
                >
                  <Bot className="mr-2 w-5 h-5" /> Play vs Computer
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full h-14 text-lg font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
                  onClick={() => setMode("join")}
                >
                  <Users className="mr-2 w-5 h-5" /> Join Friend
                </Button>
              </div>
            )}

            {mode === "create" && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div className="space-y-4 bg-black/20 p-4 sm:p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                      <Settings className="w-5 h-5 text-primary" />
                      Game Settings
                  </div>
                  <div className="space-y-4">
                      {/* Starting Cards Slider */}
                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-white/80">Starting Cards</Label>
                            <span className="text-primary font-bold text-xl px-3 py-1 bg-primary/10 rounded-lg">{startingCards[0]}</span>
                          </div>
                          <Slider 
                              value={startingCards} 
                              onValueChange={setStartingCards} 
                              min={1} 
                              max={10} 
                              step={1}
                              className="py-2"
                          />
                      </div>

                      {/* Max Players Slider */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <Label className="text-white/80">Max Players</Label>
                            <span className="text-primary font-bold text-xl px-3 py-1 bg-primary/10 rounded-lg">{maxPlayers[0]}</span>
                          </div>
                          <Slider 
                              value={maxPlayers} 
                              onValueChange={setMaxPlayers} 
                              min={2} 
                              max={8} 
                              step={1}
                              className="py-2"
                          />
                      </div>

                      {/* Visibility Toggle */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-white/5 gap-3">
                          <Label className="text-white/80">Room Visibility</Label>
                          <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                size="sm"
                                variant={isPublic ? "default" : "secondary"}
                                className={cn("flex-1 sm:flex-none text-xs", isPublic ? "bg-green-600 hover:bg-green-700" : "bg-white/10 hover:bg-white/20")}
                                onClick={() => setIsPublic(true)}
                              >
                                 <Globe className="w-3 h-3 mr-1" /> Public
                              </Button>
                              <Button 
                                size="sm"
                                variant={!isPublic ? "default" : "secondary"}
                                className={cn("flex-1 sm:flex-none text-xs", !isPublic ? "bg-red-600 hover:bg-red-700" : "bg-white/10 hover:bg-white/20")}
                                onClick={() => setIsPublic(false)}
                              >
                                 <Lock className="w-3 h-3 mr-1" /> Private
                              </Button>
                          </div>
                      </div>
                  </div>
                </div>

                <div className="flex gap-3">
                    <Button 
                        variant="outline"
                        className="flex-1 h-12 text-lg font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        onClick={() => setMode("menu")}
                    >
                        Cancel
                    </Button>
                    <Button 
                        className="flex-[2] h-12 text-lg font-bold bg-primary hover:bg-primary/90"
                        onClick={() => onCreateRoom(startingCards[0], isPublic, maxPlayers[0])}
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="animate-pulse">Creating...</span> : "Start Game"}
                    </Button>
                </div>

                {/* My Created Rooms Section */}
                {myRooms.length > 0 && (
                    <div className="pt-6 border-t border-white/10 animate-in slide-in-from-bottom-4">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" /> My Active Rooms
                        </h3>
                        <div className="space-y-3 max-h-[30vh] sm:max-h-[200px] overflow-y-auto no-scrollbar pr-1">
                            {myRooms.map(room => (
                                <div key={room.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="flex flex-col" onClick={() => onJoinRoom(room.code)}>
                                        <span className="font-bold text-white cursor-pointer hover:underline">{room.code}</span>
                                        <span className="text-xs text-white/40">{room.players.length} Players • {room.status}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-8 bg-white/10 hover:bg-white/20 text-white"
                                            onClick={() => onJoinRoom(room.code)}
                                        >
                                            Join
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="destructive" 
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteRoom(room.room_id)}
                                        >
                                            <RotateCcw className="w-4 h-4 rotate-45" /> {/* Using rotate as X */}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            )}

            {mode === "join" && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                 <div className="space-y-2">
                    <Label className="text-white/80">Room Code</Label>
                    <Input 
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABCD"
                      className="text-center text-3xl font-black uppercase tracking-[0.5em] h-16 bg-black/20 border-white/10 text-white placeholder:text-white/10 focus-visible:ring-primary/50"
                      maxLength={4}
                    />
                 </div>

                 <Button 
                      className="w-full h-12 text-lg font-bold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                      onClick={() => onJoinRoom(joinCode)}
                      disabled={joinCode.length < 4 || isLoading}
                  >
                      {isLoading ? <span className="animate-pulse">Joining...</span> : "Join Room"}
                  </Button>
              </div>
            )}

            {mode === "browse" && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Active Rooms</h2>
                        <Button size="sm" variant="ghost" className="text-white/50 hover:text-white" onClick={fetchRooms}>
                            <RotateCcw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} /> Refresh
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[60vh] sm:h-[500px] overflow-y-auto pr-1 no-scrollbar content-start">
                        {activeRooms.length === 0 && !isFetching && (
                            <div className="col-span-full text-center py-12 text-white/30 border-2 border-dashed border-white/10 rounded-xl">
                                <p>No active rooms found.</p>
                                <Button variant="link" className="text-primary mt-2" onClick={() => setMode('create')}>Create one?</Button>
                            </div>
                        )}
                        
                        {activeRooms.map((room) => (
                            <UnoRoomCard 
                                key={room.id}
                                roomId={room.room_id}
                                code={room.code}
                                playerCount={room.players.length}
                                maxPlayers={4}
                                hostName={room.players[0]?.name || "Unknown"}
                                onJoin={onJoinRoom}
                            />
                        ))}
                    </div>
                </div>
            )}


          </CardContent>
        </Card>
      </div>
    </div>
  );
};
// Force Rebuild for Bot Import
// End of Uno Lobby

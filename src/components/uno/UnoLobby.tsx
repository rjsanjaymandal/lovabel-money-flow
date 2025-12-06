import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Users, Play, Settings } from "lucide-react";

interface UnoLobbyProps {
  onCreateRoom: (startingCards: number) => void;
  onJoinRoom: (code: string) => void;
  isLoading: boolean;
}

export const UnoLobby = ({ onCreateRoom, onJoinRoom, isLoading }: UnoLobbyProps) => {
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [joinCode, setJoinCode] = useState("");
  const [startingCards, setStartingCards] = useState([7]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-5xl font-black tracking-tighter bg-gradient-to-br from-yellow-400 to-red-600 bg-clip-text text-transparent drop-shadow-sm">
            UNO
          </CardTitle>
          <p className="text-white/60">Multiplayer Edition</p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {mode === "menu" && (
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full h-14 text-xl font-bold bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
                onClick={() => setMode("create")}
              >
                <Play className="mr-2 w-6 h-6" /> Create Room
              </Button>
              <Button 
                size="lg" 
                variant="secondary"
                className="w-full h-14 text-xl font-bold border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 transition-all"
                onClick={() => setMode("join")}
              >
                <Users className="mr-2 w-6 h-6" /> Join Friend
              </Button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
              <div className="space-y-4 bg-black/20 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-lg font-bold">
                    <Settings className="w-5 h-5 text-yellow-400" />
                    Game Rules
                </div>
                <div className="space-y-2">
                    <Label>Starting Cards per Player: <span className="text-yellow-400 text-xl font-bold">{startingCards[0]}</span></Label>
                    <Slider 
                        value={startingCards} 
                        onValueChange={setStartingCards} 
                        min={1} 
                        max={10} 
                        step={1}
                        className="py-4"
                    />
                    <p className="text-xs text-white/50">Standard Uno is 7 cards. Slide to change.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setMode("menu")}>Back</Button>
                <Button 
                    className="flex-[2] bg-emerald-500 hover:bg-emerald-600 font-bold"
                    onClick={() => onCreateRoom(startingCards[0])}
                    disabled={isLoading}
                >
                    {isLoading ? "Creating..." : "Start Game"}
                </Button>
              </div>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
               <div className="space-y-2">
                  <Label>Enter Room Code</Label>
                  <Input 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    className="text-center text-3xl font-black uppercase tracking-[0.5em] h-16 bg-black/30 border-white/20 text-white placeholder:text-white/20"
                    maxLength={4}
                  />
               </div>

               <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setMode("menu")}>Back</Button>
                <Button 
                    className="flex-[2] bg-indigo-500 hover:bg-indigo-600 font-bold"
                    onClick={() => onJoinRoom(joinCode)}
                    disabled={joinCode.length < 4 || isLoading}
                >
                    {isLoading ? "Joining..." : "Join Game"}
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

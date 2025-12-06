import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Users, Play, Settings, Gamepad2, ArrowLeft, Bot } from "lucide-react";
import { ZenBackground } from "@/components/ZenBackground";
import { useNavigate } from "react-router-dom";

interface UnoLobbyProps {
  onCreateRoom: (startingCards: number) => void;
  onJoinRoom: (code: string) => void;
  isLoading: boolean;
}

export const UnoLobby = ({ onCreateRoom, onJoinRoom, isLoading }: UnoLobbyProps) => {
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [joinCode, setJoinCode] = useState("");
  const [startingCards, setStartingCards] = useState([7]);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <ZenBackground />
      
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <Button 
            variant="ghost" 
            className="absolute -top-12 left-0 text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => mode === "menu" ? navigate("/dashboard") : setMode("menu")}
        >
            <ArrowLeft className="w-4 h-4 mr-2" /> {mode === "menu" ? "Dashboard" : "Back"}
        </Button>

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
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                      <Settings className="w-5 h-5 text-primary" />
                      Game Settings
                  </div>
                  <div className="space-y-4">
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
                      <p className="text-xs text-white/40">Standard Uno is 7 cards. Drag to adjust.</p>
                  </div>
                </div>

                <Button 
                    className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90"
                    onClick={() => onCreateRoom(startingCards[0])}
                    disabled={isLoading}
                >
                    {isLoading ? <span className="animate-pulse">Creating Room...</span> : "Start Game"}
                </Button>
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

          </CardContent>
        </Card>
      </div>
    </div>
  );
};
// Force Rebuild for Bot Import
// End of Uno Lobby

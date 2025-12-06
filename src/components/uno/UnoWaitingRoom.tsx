import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameState } from "@/game/types";
import { Copy, Play, Users, Crown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ZenBackground } from "@/components/ZenBackground";
import { cn } from "@/lib/utils";

interface UnoWaitingRoomProps {
    gameState: GameState;
    userId: string;
    roomCode: string;
    onStartGame: () => void;
    onCopyCode: () => void;
}

export const UnoWaitingRoom = ({ gameState, userId, roomCode, onStartGame, onCopyCode }: UnoWaitingRoomProps) => {
    const isHost = gameState.players[0]?.id === userId;
    const { toast } = useToast();
    const maxPlayers = gameState.settings?.maxPlayers ?? gameState.settings?.max_players ?? 4;

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            <ZenBackground />
            
            <Card className="relative z-10 w-full max-w-2xl bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-2">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black text-white tracking-tight">Waiting Room</CardTitle>
                        <p className="text-white/60 mt-2">Share this code with your friends</p>
                    </div>
                    
                    <button 
                        onClick={onCopyCode}
                        className="mx-auto group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all cursor-pointer active:scale-95"
                    >
                        <span className="text-3xl sm:text-5xl font-black tracking-[0.2em] text-white font-mono">
                            {roomCode} 
                        </span>
                        <Copy className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                    </button>
                    <p className="text-xs text-white/30 uppercase tracking-widest">Click to copy</p>
                </CardHeader>

                <CardContent className="space-y-8 p-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-white/80 px-2">
                            <span className="flex items-center gap-2 font-bold"><Users className="w-4 h-4" /> Players Joined</span>
                            <span className="text-sm bg-white/10 px-2 py-1 rounded-md">{gameState.players.length} / {maxPlayers}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {gameState.players.map((player, index) => (
                                <div key={player.id} className="group relative flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className="relative">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg",
                                            index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-600" : "bg-gradient-to-br from-blue-500 to-purple-600"
                                        )}>
                                            {player.name.charAt(0).toUpperCase()}
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-1 rounded-full shadow-lg">
                                                <Crown className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-white truncate max-w-full">{player.name}</span>
                                </div>
                            ))}
                            
                            {/* Empty Slots */}
                            {Array.from({ length: Math.max(0, maxPlayers - gameState.players.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-white/5 opacity-50">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                                    </div>
                                    <span className="text-sm font-medium text-white/20">Waiting...</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        {isHost ? (
                            <Button 
                                size="lg" 
                                className="w-full h-16 text-xl font-bold bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all active:scale-95"
                                onClick={onStartGame}
                                disabled={gameState.players.length < 2}
                            >
                                {gameState.players.length < 2 ? (
                                    <>Min 2 Players Needed</>
                                ) : (
                                    <><Play className="mr-2 w-6 h-6 fill-current" /> Start Game</>
                                )}
                            </Button>
                        ) : (
                            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-white/60 animate-pulse">Waiting for host to start...</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

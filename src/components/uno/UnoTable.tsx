import { useState, useEffect } from "react";
import { GameState, UnoCard as UnoCardType, Player } from "@/game/types";
import { UnoCard } from "./UnoCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, User, RotateCcw } from "lucide-react";
import { ZenBackground } from "@/components/ZenBackground";
import { cn } from "@/lib/utils";
import { isValidMove } from "@/game/engine";

interface UnoTableProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: UnoCardType) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onExit?: () => void;
  hideRoomCode?: boolean;
}

import { Copy, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const UnoTable = ({ gameState, currentPlayerId, onPlayCard, onDrawCard, onCallUno, onExit, hideRoomCode }: UnoTableProps) => {
  const me = gameState.players.find(p => p.id === currentPlayerId);
  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayerId);
  const { toast } = useToast();
  
  const [pendingCard, setPendingCard] = useState<UnoCardType | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset drawing state when turn changes
  useEffect(() => {
      setIsDrawing(false);
  }, [gameState.currentPlayerIndex]);

  const handleDrawClick = () => {
      if (isDrawing) return;
      setIsDrawing(true);
      onDrawCard();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  };
  
  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === currentPlayerId;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  // Check if player has any valid moves
  const hasValidMove = me?.hand.some(card => isValidMove(card, topCard));
  const showForcedDraw = isMyTurn && !hasValidMove;

  // Timer UI Logic
  const [timeLeft, setTimeLeft] = useState(120);
  
  useEffect(() => {
    const updateTimer = () => {
        if (!gameState.turnStartTime) return;
        const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
        const remaining = Math.max(120 - elapsed, 0);
        setTimeLeft(remaining);
    };
    
    updateTimer(); // Immediate
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameState.turnStartTime, gameState.currentPlayerIndex]);

  const handleCardClick = (card: UnoCardType) => {
      if (!isMyTurn) return;
      if (card.type === 'wild' || card.type === 'wild_draw4') {
          setPendingCard(card);
      } else {
          onPlayCard(card);
      }
  };

  const handleColorSelect = (color: 'red' | 'blue' | 'green' | 'yellow') => {
      if (pendingCard) {
          onPlayCard({ ...pendingCard, color });
          setPendingCard(null);
      }
  };


  return (
    <div className="w-full h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden relative">
      <ZenBackground />
      
      {/* --- LAYER 1: OVERLAYS (Winner, Color Picker) --- */}
      <AnimatePresence>
        {gameState.winner && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            >
                <div className="text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="text-8xl mb-4 animate-bounce">🏆</div>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
                        {gameState.winner.name} Wins!
                    </h1>
                    <Button size="lg" className="text-2xl px-12 py-8 rounded-full font-black animate-pulse" onClick={onExit}>
                        Back to Lobby
                    </Button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
          {pendingCard && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center"
              >
                  <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6">
                      <h2 className="text-3xl font-black text-white">Choose Color</h2>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleColorSelect('red')} className="w-24 h-24 bg-red-500 rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-red-500/30" />
                          <button onClick={() => handleColorSelect('blue')} className="w-24 h-24 bg-blue-500 rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-blue-500/30" />
                          <button onClick={() => handleColorSelect('green')} className="w-24 h-24 bg-emerald-500 rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30" />
                          <button onClick={() => handleColorSelect('yellow')} className="w-24 h-24 bg-yellow-400 rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-yellow-500/30" />
                      </div>
                      <Button variant="ghost" className="text-white/50" onClick={() => setPendingCard(null)}>Cancel</Button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
      
      {/* --- LAYER 2: TOP BAR (Opponents & Info) --- */}
      <div className="flex-none p-4 z-40 w-full flex flex-col gap-4">
         <div className="flex justify-between items-start">
             <div className="flex gap-2">
                 {onExit && (
                     <Button size="icon" variant="ghost" className="rounded-full bg-black/40 text-white hover:bg-white/20 backdrop-blur-md" onClick={onExit}>
                         <ArrowLeft className="w-5 h-5" />
                     </Button>
                 )}
                 {!hideRoomCode && (
                     <div 
                        className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
                        onClick={handleCopyCode}
                     >
                        <div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block leading-none mb-0.5">Room Code</span>
                            <p className="text-xl font-black text-white leading-none">{gameState.roomId}</p>
                        </div>
                        <Copy className="w-4 h-4 text-white/50" />
                     </div>
                 )}
             </div>
             
             {/* Timer Display */}
             {gameState.turnStartTime && (
                 <div className={cn(
                     "px-4 py-2 rounded-full font-mono font-bold text-xl backdrop-blur-md border transition-colors duration-500",
                     timeLeft <= 10 ? "bg-red-500/20 text-red-500 border-red-500/50 animate-pulse" : "bg-black/30 text-white border-white/10"
                 )}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </div>
             )}
         </div>

         {/* Opponents Horizontal Scroll */}
         <div className="flex gap-4 overflow-x-auto max-w-full pb-2 scrollbar-hide snap-x items-start mask-linear-fade">
             {otherPlayers.map((player, idx) => {
                 const isActive = gameState.players[gameState.currentPlayerIndex].id === player.id;
                 return (
                         <motion.div 
                             key={player.id} 
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className={cn(
                                 "relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[120px] snap-center backdrop-blur-sm",
                                 isActive ? "bg-white/10 ring-2 ring-primary shadow-lg scale-105 z-10" : "bg-black/20 border border-white/5 opacity-70 scale-95"
                             )}
                         >
                             <div className="relative mb-2">
                                 <Avatar className={cn("w-12 h-12 border-2 transition-all", isActive ? "border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]" : "border-white/10")}>
                                     <AvatarImage src={player.avatarUrl} />
                                     <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs">{player.name.substring(0,2)}</AvatarFallback>
                                 </Avatar>
                                 {isActive && (
                                     <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                                 )}
                             </div>
                             
                             <span className="text-[10px] font-bold text-white truncate max-w-[80px] mb-1">{player.name}</span>
                             
                             {/* Animated Opponent Hand */}
                             <div className="relative h-12 w-16 flex items-center justify-center">
                                 {Array.from({ length: Math.min(player.hand.length, 10) }).map((_, i) => (
                                     <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1, rotate: (i - Math.min(player.hand.length, 10)/2) * 10, x: (i - Math.min(player.hand.length, 10)/2) * 2 }}
                                        className="absolute w-8 h-11 bg-gradient-to-br from-slate-800 to-black border border-white/20 rounded shadow-sm origin-bottom"
                                        style={{ zIndex: i }}
                                     >
                                        <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
                                     </motion.div>
                                 ))}
                                 <div className="absolute -bottom-4 bg-black/60 px-1.5 rounded-md text-[9px] font-mono text-white/70 backdrop-blur-md border border-white/10">
                                     {player.hand.length} cards
                                 </div>
                             </div>
                         </motion.div>
                     )
             })}
         </div>
      </div>

      {/* --- LAYER 3: CENTER GAME BOARD (Deck & Discard) --- */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 perspective-[1000px]">
          <div className="flex items-center gap-8 sm:gap-24 pl-4 sm:pl-0">
             {/* Deck */}
             <motion.div 
               whileHover={isMyTurn ? { scale: 1.05 } : {}}
               whileTap={isMyTurn && !isDrawing ? { scale: 0.95 } : {}}
               onClick={isMyTurn && !isDrawing ? handleDrawClick : undefined}
               className={cn(
                   "relative w-28 h-40 sm:w-36 sm:h-52 bg-slate-900 rounded-xl border-2 border-white/10 shadow-2xl flex items-center justify-center cursor-pointer transition-all",
                   (!isMyTurn || isDrawing) && "opacity-50 grayscale cursor-not-allowed"
               )}
             >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
                <span className="font-black text-white/20 text-3xl -rotate-45">UNO</span>
                
                {/* Draw State Feedback */}
                {(showForcedDraw || isDrawing) && (
                    <div className={cn(
                        "absolute inset-0 ring-4 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all",
                        isDrawing ? "ring-yellow-500/50 bg-black/20" : "ring-red-500/50 animate-pulse"
                    )}>
                        <span className={cn(
                            "text-xs font-bold px-3 py-1.5 rounded shadow-lg transition-all",
                            isDrawing ? "bg-yellow-500 text-black animate-pulse" : "bg-red-500 text-white"
                        )}>
                            {isDrawing ? "DRAWING..." : "DRAW CARD!"}
                        </span>
                    </div>
                )}
             </motion.div>

             {/* Discard Pile */}
             <div className="relative w-28 h-40 sm:w-36 sm:h-52 flex items-center justify-center">
                 {/* Direction Indicator Ring */}
                 <div className={cn(
                    "absolute -inset-8 border-[3px] border-dashed border-white/10 rounded-full transition-all duration-1000 w-[180%] h-[150%] left-[-40%] top-[-25%]",
                    gameState.direction === 1 ? "animate-spin-slow border-t-primary/80" : "animate-reverse-spin border-t-purple-500/80"
                 )} />
                 
                 <AnimatePresence mode='popLayout'>
                    <motion.div 
                        key={topCard?.id || 'empty'}
                        initial={{ scale: 0.8, opacity: 0, y: -50, rotate: Math.random() * 20 - 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0, rotate: Math.random() * 10 - 5 }}
                        className="absolute"
                    >
                        {topCard 
                            ? <UnoCard card={topCard} size="lg" className="shadow-2xl" /> 
                            : <div className="w-28 h-40 border-2 border-white/10 border-dashed rounded-xl" />
                        }
                    </motion.div>
                 </AnimatePresence>
             </div>
          </div>
      </div>

      {/* --- LAYER 4: PLAYER CONTROLS (Bottom Fixed) --- */}
      <div className={cn(
        "flex-none z-50 pt-4 pb-safe transition-all duration-500 ease-out bg-gradient-to-t from-black/80 to-transparent",
        isMyTurn ? "translate-y-0" : "opacity-80 grayscale-[0.3]"
      )}>
         {/* Control Bar (Just above cards) */}
         <div className="flex justify-center items-center gap-4 mb-2 min-h-[60px] px-4">
             {/* UNO Button */}
             {me?.hand.length === 1 && !gameState.players.find(p => p.id === me.id)?.isUno && (
                <Button 
                    variant="destructive" 
                    size="lg" 
                    className="rounded-full font-black animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    onClick={onCallUno}
                >
                    UNO! 🚨
                </Button>
             )}
             
             {/* Draw Button (Visible if active) */}
             {/* Draw Button Removed (Integrated into Deck) */}
         </div>

         {/* Player Hand Scroll Container */}
         <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden px-2 pb-8 sm:pb-12 pt-4">
             <div className="flex items-end justify-center min-w-max mx-auto -space-x-12 sm:-space-x-20 hover:space-x-1 sm:hover:space-x-4 transition-all duration-300 py-2 px-4 h-[220px] sm:h-[250px]">
                 {me?.hand.map((card, i) => {
                     const isPlayable = isMyTurn && isValidMove(card, topCard);
                     const total = me.hand.length;
                     const center = (total - 1) / 2;
                     // Tighter spread on mobile, wider on desktop
                     const spreadFactor = total > 7 ? 3 : 5; 
                     const rotate = (i - center) * spreadFactor; 
                     const yOffset = Math.abs(i - center) * (total > 7 ? 4 : 6);

                     return (
                         <motion.div
                            key={card.id}
                            layout
                            initial={{ y: 200, opacity: 0 }}
                            animate={{ 
                                y: isPlayable ? -20 : yOffset, 
                                opacity: 1,
                                rotate: rotate,
                                scale: isPlayable ? 1.05 : 1
                            }}
                            whileHover={{ y: -80, scale: 1.3, zIndex: 50, rotate: 0, transition: { duration: 0.2 } }}
                            className={cn(
                                "relative origin-bottom cursor-pointer transition-all duration-300 will-change-transform",
                                !isMyTurn && "cursor-not-allowed opacity-80"
                            )}
                            style={{ zIndex: i }}
                            onClick={() => handleCardClick(card)}
                         >
                            <UnoCard 
                                card={card} 
                                disabled={!isMyTurn} 
                                className={cn(
                                    "shadow-xl transition-all duration-300",
                                    isPlayable 
                                        ? "ring-4 ring-green-400/70 shadow-[0_0_30px_rgba(74,222,128,0.6)]" 
                                        : "brightness-75 hover:brightness-100"
                                )} 
                            />
                         </motion.div>
                     )
                 })}
             </div>
         </div>
         {/* Current Player Name Tag */}
         <div className="text-center pb-2">
             <span className="bg-black/40 px-3 py-1 rounded-full text-xs font-bold text-white/50 backdrop-blur-md">
                 {isMyTurn ? "Your Turn!" : "Waiting..."}
             </span>
         </div>
      </div>
    </div>
  );
};

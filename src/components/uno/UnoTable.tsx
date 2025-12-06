import { useState, useEffect } from "react";
import { GameState, UnoCard as UnoCardType, Player } from "@/game/types";
import { UnoCard } from "./UnoCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, User, RotateCcw } from "lucide-react";
import { ZenBackground } from "@/components/ZenBackground";
import { cn } from "@/lib/utils";

interface UnoTableProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: UnoCardType) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onExit?: () => void;
}

import { Copy, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const UnoTable = ({ gameState, currentPlayerId, onPlayCard, onDrawCard, onCallUno, onExit }: UnoTableProps) => {
  const me = gameState.players.find(p => p.id === currentPlayerId);
  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayerId);
  const { toast } = useToast();
  
  const [pendingCard, setPendingCard] = useState<UnoCardType | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  };
  
  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === currentPlayerId;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

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
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background text-foreground flex flex-col">
      <ZenBackground />
      
      {/* Winner Overlay */}
      <AnimatePresence>
        {gameState.winner && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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

      {/* Color Picker Overlay */}
      <AnimatePresence>
          {pendingCard && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
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
      
      {/* Game Header / Status */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 pointer-events-none">
         <div className="flex gap-2 pointer-events-auto">
             {onExit && (
                 <Button size="icon" variant="ghost" className="rounded-full bg-black/40 text-white hover:bg-white/20 backdrop-blur-md" onClick={onExit}>
                     <ArrowLeft className="w-5 h-5" />
                 </Button>
             )}
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
         </div>

         {/* Turn Indicator */}
         <div className={cn(
             "px-6 py-3 rounded-full border backdrop-blur-md transition-all duration-500 shadow-xl",
             isMyTurn 
                ? 'bg-gradient-to-r from-primary to-purple-600 border-primary/50 text-white scale-110 translate-y-2' 
                : 'bg-black/40 border-white/10 text-white/50'
         )}>
            <span className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
                {isMyTurn ? <>👉 Your Turn</> : <>{gameState.players[gameState.currentPlayerIndex].name}'s Turn</>}
            </span>
         </div>
      </div>

      {/* Opponents Area */}
      <div className="flex-1 flex items-start justify-center pt-24 px-4 z-10">
        <div className="flex gap-4 overflow-x-auto max-w-full pb-4 scrollbar-hide snap-x items-start">
            {otherPlayers.map((player, idx) => {
                const isActive = gameState.players[gameState.currentPlayerIndex].id === player.id;
                return (
                    <motion.div 
                        key={player.id} 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                            "relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[100px] snap-center backdrop-blur-sm",
                            isActive ? "bg-white/10 ring-2 ring-primary shadow-[0_0_30px_rgba(124,58,237,0.4)] scale-110 z-10" : "bg-black/20 border border-white/5 opacity-70 scale-95"
                        )}
                    >
                        <div className="relative">
                            <Avatar className="w-14 h-14 border-2 border-white/10 mb-2 shadow-xl">
                                <AvatarImage src={player.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                    {player.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isActive && (
                                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-black"></span>
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-bold text-white mb-1 truncate max-w-[80px] drop-shadow-md">{player.name}</span>
                        
                        {/* Opponent Cards with improved fanning */}
                        <div className="flex -space-x-3 items-center justify-center h-8 mt-1">
                             {Array.from({ length: Math.min(player.hand.length, 5) }).map((_, i) => (
                                <div key={i} className="w-6 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-sm border border-white/20 shadow-md transform origin-bottom" style={{ transform: `rotate(${(i - 2) * 8}deg)` }} />
                             ))}
                             {player.hand.length > 5 && <span className="text-[10px] text-white/50 ml-3 font-mono font-bold">+{player.hand.length - 5}</span>}
                        </div>
                    </motion.div>
                )
            })}
        </div>
      </div>

      {/* Center Table (Deck & Discard) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] z-0 flex items-center justify-center gap-12 sm:gap-24 pointer-events-none perspective-[1000px]">
          {/* Deck */}
          <motion.div 
            whileHover={{ scale: 1.05, rotateX: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={isMyTurn ? onDrawCard : undefined}
            className={cn(
                "relative group cursor-pointer pointer-events-auto transform-gpu transition-all duration-300",
                !isMyTurn && "opacity-60 cursor-not-allowed grayscale-[0.5]"
            )}
          >
             <div className="w-28 h-40 sm:w-36 sm:h-52 bg-gradient-to-br from-slate-800 to-black rounded-xl border-2 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-shadow">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="w-20 h-32 border-2 border-white/10 rounded-lg border-dashed opacity-30" />
                <span className="absolute font-black text-white/10 text-5xl -rotate-45 select-none">UNO</span>
             </div>
             {/* Deck Glow */}
             <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-black text-white/40 uppercase tracking-[0.2em]">Draw Card</div>
          </motion.div>

          {/* Discard Pile */}
          <div className="relative pointer-events-auto">
             {/* Direction Orbit */}
             <div className={cn(
                "absolute -inset-16 border-2 border-dashed border-white/5 rounded-full transition-all duration-1000",
                gameState.direction === 1 ? "animate-spin-slow border-t-primary/50" : "animate-reverse-spin border-t-purple-500/50"
             )} />
             
             <div className="relative z-10 perspective-[1000px]">
                <AnimatePresence mode='popLayout'>
                    <motion.div 
                        key={topCard?.id || 'empty'}
                        initial={{ scale: 0.5, y: -200, opacity: 0, rotateZ: Math.random() * 90 - 45, rotateX: 45 }}
                        animate={{ scale: 1, y: 0, opacity: 1, rotateZ: Math.random() * 10 - 5, rotateX: 0 }}
                        className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] drop-shadow-2xl"
                    >
                        {topCard ? <UnoCard card={topCard} size="lg" className="shadow-2xl ring-1 ring-white/10" /> : <div className="w-24 h-36 border-2 border-white/10 border-dashed rounded-xl" />}
                    </motion.div>
                </AnimatePresence>
             </div>
          </div>
      </div>

      {/* Player Hand (Bottom) */}
      <div className={cn(
        "relative z-20 pb-safe pt-4 px-2 transition-all duration-500 ease-out flex flex-col justify-end min-h-[280px]",
        isMyTurn ? "translate-y-0" : "translate-y-12 opacity-80 grayscale-[0.3]"
      )}>
         {/* Action Buttons */}
         <div className="flex justify-center mb-6 gap-4 pointer-events-none relative z-50 h-14 items-center">
             {me?.hand.length === 1 && !gameState.players.find(p => p.id === me.id)?.isUno && (
                <Button 
                    variant="destructive" 
                    size="lg" 
                    className="pointer-events-auto animate-bounce font-black text-2xl uppercase shadow-[0_0_30px_rgba(239,68,68,0.6)] rounded-full px-10 py-8 hover:scale-110 transition-transform"
                    onClick={onCallUno}
                >
                    UNO! 🚨
                </Button>
             )}
             
             {isMyTurn && (
                 <Button
                    size="lg"
                    className="pointer-events-auto font-bold text-lg uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-full px-8 py-6 bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-white transition-all"
                    onClick={onDrawCard}
                 >
                    Draw Card
                 </Button>
             )}
         </div>

         {/* Cards Scroller - Improved Fanning */}
         <div className="overflow-x-auto overflow-y-visible pb-8 scrollbar-hide px-4 -mx-2 flex justify-center perspective-[1000px]">
             <div className="flex items-end justify-center min-w-max h-48 -space-x-12 sm:-space-x-10 hover:space-x-2 transition-all duration-300 px-12 group/hand">
                 {me?.hand.map((card, i) => {
                     // Fanning Logic
                    const total = me.hand.length;
                    const center = (total - 1) / 2;
                    const rotate = (i - center) * 4; // 4 deg per card
                    const yOffset = Math.abs(i - center) * 6; // Arch effect

                    return (
                        <motion.div
                            key={card.id}
                            initial={{ y: 200, opacity: 0 }}
                            animate={{ y: yOffset, opacity: 1, rotate: rotate }}
                            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                            whileHover={{ y: -60, scale: 1.25, zIndex: 100, rotate: 0 }}
                            className="origin-bottom cursor-pointer relative shadow-xl hover:shadow-2xl transition-all duration-200"
                            style={{ zIndex: i }}
                            onClick={() => handleCardClick(card)}
                        >
                            <UnoCard card={card} disabled={!isMyTurn} className="shadow-2xl ring-1 ring-black/20" />
                        </motion.div>
                    );
                 })}
             </div>
         </div>
      </div>

    </div>
  );
};

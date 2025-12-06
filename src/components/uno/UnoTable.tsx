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
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  };
  
  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === currentPlayerId;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background text-foreground flex flex-col">
      <ZenBackground />
      
      {/* Game Header / Status */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
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

         <div className={`px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-300 ${isMyTurn ? 'bg-primary/20 border-primary text-primary animate-pulse' : 'bg-black/30 border-white/10 text-white/50'}`}>
            <span className="font-bold uppercase text-sm tracking-wider">{isMyTurn ? "Your Turn" : "Opponent's Turn"}</span>
         </div>
      </div>

      {/* Opponents Area */}
      <div className="flex-1 flex items-start justify-center pt-20 px-4 z-10">
        <div className="flex gap-4 overflow-x-auto max-w-full pb-4 scrollbar-hide snap-x">
            {otherPlayers.map((player) => {
                const isActive = gameState.players[gameState.currentPlayerIndex].id === player.id;
                return (
                    <div key={player.id} className={cn(
                        "relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[100px] snap-center",
                        isActive ? "bg-white/10 ring-1 ring-primary shadow-[0_0_20px_rgba(124,58,237,0.3)] scale-105" : "bg-black/20 border border-white/5 opacity-70"
                    )}>
                        <Avatar className="w-12 h-12 border-2 border-white/10 mb-2 shadow-lg">
                             <AvatarImage src={player.avatarUrl} />
                             <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                {player.name.substring(0, 2).toUpperCase()}
                             </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-white mb-1 truncate max-w-[80px]">{player.name}</span>
                        
                        {/* Opponent Cards */}
                        <div className="flex -space-x-2 items-center justify-center h-8">
                             {Array.from({ length: Math.min(player.hand.length, 5) }).map((_, i) => (
                                <div key={i} className="w-5 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-sm border border-white/20 shadow-sm transform" style={{ transform: `rotate(${(i - 2) * 5}deg)` }} />
                             ))}
                             {player.hand.length > 5 && <span className="text-[10px] text-white/50 ml-2 font-mono">+{player.hand.length - 5}</span>}
                        </div>
                        {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-bounce" />}
                    </div>
                )
            })}
        </div>
      </div>

      {/* Center Table (Deck & Discard) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] z-0 flex items-center justify-center gap-8 sm:gap-16 pointer-events-none">
          {/* Deck (Clickable in theory but we use button or drag) */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isMyTurn ? onDrawCard : undefined}
            className={cn(
                "relative group cursor-pointer pointer-events-auto",
                !isMyTurn && "opacity-50 cursor-not-allowed"
            )}
          >
             <div className="w-24 h-36 sm:w-32 sm:h-48 bg-gradient-to-br from-slate-800 to-black rounded-xl border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="w-16 h-28 border border-white/10 rounded border-dashed opacity-30" />
                <span className="absolute font-black text-white/20 text-4xl -rotate-45">UNO</span>
             </div>
             {/* Deck Glow */}
             <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-white/50 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Draw</div>
          </motion.div>

          {/* Discard Pile */}
          <div className="relative pointer-events-auto">
             {/* Direction Orbit */}
             <div className={cn(
                "absolute -inset-10 border border-white/10 rounded-full border-t-primary/50 border-r-transparent border-b-transparent border-l-transparent transition-all duration-1000",
                gameState.direction === 1 ? "animate-spin-slow" : "animate-reverse-spin"
             )} />
             
             <div className="relative z-10">
                <AnimatePresence mode='popLayout'>
                    <motion.div 
                        key={topCard?.id || 'empty'}
                        initial={{ scale: 0.8, y: -100, opacity: 0, rotate: Math.random() * 20 - 10 }}
                        animate={{ scale: 1, y: 0, opacity: 1, rotate: Math.random() * 10 - 5 }}
                        className="shadow-2xl"
                    >
                        {topCard ? <UnoCard card={topCard} size="lg" /> : <div className="w-24 h-36 border-2 border-white/10 border-dashed rounded-xl" />}
                    </motion.div>
                </AnimatePresence>
             </div>
          </div>
      </div>

      {/* Player Hand (Bottom) */}
      <div className={cn(
        "relative z-20 pb-safe pt-4 px-2 transition-all duration-500 ease-out",
        isMyTurn ? "translate-y-0" : "translate-y-8 opacity-90 grayscale-[0.3]"
      )}>
         {/* Action Buttons */}
         <div className="flex justify-center mb-4 gap-4 pointer-events-none">
             {me?.hand.length === 1 && !gameState.players.find(p => p.id === me.id)?.isUno && (
                <Button 
                    variant="destructive" 
                    size="lg" 
                    className="pointer-events-auto animate-bounce font-black text-xl uppercase shadow-lg shadow-red-500/40 rounded-full px-8"
                    onClick={onCallUno}
                >
                    UNO!
                </Button>
             )}
         </div>

         {/* Cards Scroller */}
         <div className="overflow-x-auto pb-4 scrollbar-hide px-4 -mx-2">
             <div className="flex items-end justify-center min-w-max h-40 sm:h-48 -space-x-8 sm:-space-x-6 hover:space-x-0 transition-all duration-300 px-8">
                 {me?.hand.map((card, i) => (
                    <motion.div
                        key={card.id}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -30, scale: 1.1, zIndex: 50, rotate: 0 }}
                        className="origin-bottom cursor-pointer relative"
                        style={{ zIndex: i, rotate: (i - me.hand.length / 2) * 5 }}
                        onClick={() => isMyTurn && onPlayCard(card)}
                    >
                        <UnoCard card={card} disabled={!isMyTurn} />
                    </motion.div>
                 ))}
             </div>
         </div>
      </div>

    </div>
  );
};

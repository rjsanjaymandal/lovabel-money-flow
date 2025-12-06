import { useState, useEffect } from "react";
import { GameState, UnoCard as UnoCardType, Player } from "@/game/types";
import { UnoCard } from "./UnoCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, User } from "lucide-react";

interface UnoTableProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: UnoCardType) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
}

export const UnoTable = ({ gameState, currentPlayerId, onPlayCard, onDrawCard, onCallUno }: UnoTableProps) => {
  const me = gameState.players.find(p => p.id === currentPlayerId);
  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayerId);
  
  // Layout Logic: Place opponents in a semi-circle or line depending on count
  const topPlayer = otherPlayers.length > 0 ? otherPlayers[0] : null; // Simplistic 2-player view for MVP

  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === currentPlayerId;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="relative w-full h-full min-h-[80vh] bg-[#35654d] overflow-hidden rounded-xl shadow-2xl flex flex-col justify-between p-4 bg-[url('/felt.png')] bg-blend-overlay">
      
      {/* Top Section: Opponents */}
      <div className="flex justify-center pt-8">
        {topPlayer ? (
           <div className={`flex flex-col items-center p-4 rounded-xl transition-all ${gameState.players[gameState.currentPlayerIndex].id === topPlayer.id ? 'bg-white/10 ring-2 ring-yellow-400' : ''}`}>
             <Avatar className="w-16 h-16 border-2 border-white mb-2">
               <AvatarFallback className="bg-indigo-600 text-white"><User /></AvatarFallback>
             </Avatar>
             <span className="text-white font-bold">{topPlayer.name}</span>
             <div className="flex -space-x-3 mt-2">
               {/* Show card backs for opponent hand */}
               {Array.from({ length: Math.min(topPlayer.hand.length, 5) }).map((_, i) => (
                 <div key={i} className="w-8 h-12 bg-black rounded border-2 border-white transform skew-x-1" />
               ))}
               <span className="ml-2 text-white text-xs self-center">({topPlayer.hand.length})</span>
             </div>
           </div>
        ) : (
          <div className="text-white/50">Waiting for players...</div>
        )}
      </div>

      {/* Center Section: Deck & Discard */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 sm:gap-12">
        {/* Draw Pile */}
        <div 
            onClick={isMyTurn ? onDrawCard : undefined}
            className={`w-28 h-40 bg-black rounded-xl border-4 border-white shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform ${!isMyTurn && 'opacity-50 cursor-not-allowed'}`}
        >
            <div className="w-20 h-32 border-2 border-dashed border-white/20 rounded-md bg-gradient-to-br from-gray-800 to-black mx-auto" />
            <span className="absolute text-white font-black text-xl tracking-widest rotate-45">UNO</span>
        </div>

        {/* Discard Pile */}
        <div className="relative">
            <AnimatePresence mode='popLayout'>
                <motion.div 
                    key={topCard?.id || 'empty'}
                    initial={{ scale: 0.5, y: -50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1, rotate: Math.random() * 10 - 5 }}
                    className="relative z-10"
                >
                    {topCard ? <UnoCard card={topCard} size="lg" /> : <div className="w-32 h-48 border-2 border-white/20 rounded-xl bg-white/5" />}
                </motion.div>
            </AnimatePresence>
            
            {/* Direction Indicator */}
            <div className={`absolute -inset-8 border-4 border-dashed border-white/10 rounded-full animate-spin-slow ${gameState.direction === -1 && 'animate-reverse-spin'}`} />
        </div>
      </div>

      {/* Bottom Section: My Hand */}
      <div className={`mt-auto transition-all duration-300 ${isMyTurn ? 'translate-y-0' : 'translate-y-4 opacity-80'}`}>
        <div className="flex justify-center mb-4">
             {me?.hand.length === 1 && (
                <Button variant="destructive" size="lg" className="animate-bounce font-black text-2xl uppercase" onClick={onCallUno}>
                    UNO!
                </Button>
             )}
        </div>
        
        <div className="w-full overflow-x-auto pb-4 px-4 scrollbar-hide">
             <div className="flex items-end justify-center -space-x-6 sm:-space-x-4 min-w-max h-40 pt-4">
                {me?.hand.map((card, i) => (
                    <motion.div 
                        key={card.id}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="transform origin-bottom hover:z-50 hover:-translate-y-6 hover:scale-110 transition-all duration-200"
                        style={{  zIndex: i }}
                    >
                        <UnoCard 
                            card={card} 
                            onClick={onPlayCard}
                            disabled={!isMyTurn} // Simple client-side check, validMove needed too
                        />
                    </motion.div>
                ))}
            </div>
        </div>
        
        <div className="h-4 text-center">
            {isMyTurn && <p className="text-yellow-400 font-bold animate-pulse text-sm">YOUR TURN</p>}
        </div>
      </div>

    </div>
  );
};

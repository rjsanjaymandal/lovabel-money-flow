import { UnoCard as UnoCardType } from "@/game/types";
import { cn } from "@/lib/utils";
import { Ban, RefreshCw, Plus } from "lucide-react";

interface UnoCardProps {
  card: UnoCardType;
  onClick?: (card: UnoCardType) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const colorMap = {
  red: "from-red-500 to-red-600 border-red-400",
  blue: "from-blue-500 to-blue-600 border-blue-400",
  green: "from-emerald-500 to-emerald-600 border-emerald-400",
  yellow: "from-yellow-400 to-yellow-500 border-yellow-300",
  black: "from-slate-800 to-black border-slate-600",
};

export const UnoCard = ({ card, onClick, className, size = "md", disabled }: UnoCardProps) => {
  const sizeClasses = {
    sm: "w-12 h-16 text-lg",
    md: "w-20 h-32 text-4xl",
    lg: "w-32 h-48 text-6xl", // Active card size
  };

  const isSpecial = card.type !== "number";
  
  return (
    <div
      onClick={() => !disabled && onClick?.(card)}
      className={cn(
        "relative rounded-xl shadow-xl border-2 select-none transition-all duration-300 bg-gradient-to-br flex items-center justify-center overflow-hidden",
        colorMap[card.color],
        sizeClasses[size],
        !disabled && "hover:-translate-y-4 hover:shadow-2xl hover:rotate-2 cursor-pointer border-opacity-50",
        disabled && "opacity-50 grayscale cursor-not-allowed",
        className
      )}
    >
      {/* Oval Background for Contrast */}
      <div className="absolute inset-2 rounded-[50%] bg-white/10 blur-sm pointer-events-none" />

      {/* Card Content */}
      <div className="relative z-10 font-black text-white drop-shadow-md flex flex-col items-center">
        {card.type === "number" && <span>{card.value}</span>}
        {card.type === "skip" && <Ban className="w-[60%] h-[60%]" />}
        {card.type === "reverse" && <RefreshCw className="w-[60%] h-[60%]" />}
        {card.type === "draw2" && (
            <div className="flex flex-col items-center leading-none">
                <Plus className="w-1/2 h-1/2" strokeWidth={4} />
                <span>2</span>
            </div>
        )}
        {card.type === "wild" && (
            <div className="grid grid-cols-2 gap-0.5 p-1 w-full h-full opacity-80">
                <div className="bg-red-500 rounded-tl-sm" />
                <div className="bg-blue-500 rounded-tr-sm" />
                <div className="bg-emerald-500 rounded-bl-sm" />
                <div className="bg-yellow-400 rounded-br-sm" />
            </div>
        )}
        {card.type === "wild_draw4" && (
             <div className="flex flex-col items-center leading-none relative">
                 <div className="grid grid-cols-2 gap-0.5 p-1 absolute inset-0 opacity-20">
                    <div className="bg-red-500" /><div className="bg-blue-500" />
                    <div className="bg-emerald-500" /><div className="bg-yellow-400" />
                </div>
                <Plus className="w-1/2 h-1/2 z-10" strokeWidth={4} />
                <span className="z-10">4</span>
            </div>
        )}
      </div>

      {/* Corner Number (Small) */}
      {(card.type === "number") && (
        <>
            <div className="absolute top-1 left-2 text-xs sm:text-sm font-bold text-white/90">{card.value}</div>
            <div className="absolute bottom-1 right-2 text-xs sm:text-sm font-bold text-white/90 rotate-180">{card.value}</div>
        </>
      )}
    </div>
  );
};

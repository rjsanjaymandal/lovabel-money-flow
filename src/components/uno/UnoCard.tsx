import { UnoCard as UnoCardType } from "@/types/uno";
import { cn } from "@/lib/utils";
import { Ban, RefreshCw, Plus } from "lucide-react";

interface UnoCardProps {
  card: UnoCardType;
  onClick?: (card: UnoCardType) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

// Premium Uno Card Visuals
const colorStyles = {
  red: "bg-gradient-to-br from-red-500 via-red-600 to-red-800 border-red-400/50 shadow-red-900/50",
  blue: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 border-blue-400/50 shadow-blue-900/50",
  green:
    "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 border-emerald-400/50 shadow-emerald-900/50",
  yellow:
    "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-700 border-yellow-300/50 shadow-amber-900/50",
  black:
    "bg-gradient-to-br from-slate-800 via-black to-slate-900 border-slate-600/50 shadow-black/50",
};

export const UnoCard = ({
  card,
  onClick,
  className,
  size = "md",
  disabled,
}: UnoCardProps) => {
  const sizeClasses = {
    sm: "w-12 h-16 text-xl",
    md: "w-24 h-36 text-5xl", // Slightly larger for better touch targets
    lg: "w-36 h-56 text-7xl",
  };

  return (
    <div
      onClick={() => !disabled && onClick?.(card)}
      className={cn(
        "relative rounded-xl border-[3px] select-none transition-all duration-300 flex items-center justify-center overflow-hidden isolation-auto",
        "shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)]", // Depth shadows
        colorStyles[card.color as keyof typeof colorStyles],
        sizeClasses[size],
        !disabled &&
          "hover:-translate-y-6 hover:rotate-2 hover:scale-105 cursor-pointer z-0 hover:z-10",
        disabled && "opacity-60 grayscale-[0.5] cursor-not-allowed contrast-75",
        className,
      )}
    >
      {/* Texture / Noise Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

      {/* Glossy Reflection (Top-Left) */}
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-45 pointer-events-none" />

      {/* Inner Ring (The classic Uno Oval) */}
      <div className="absolute inset-1.5 rounded-[50%] border-2 border-white/20 bg-gradient-to-br from-white/10 to-transparent blur-[1px] shadow-inner" />

      {/* Card Content Icon/Text */}
      <div className="relative z-10 font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center h-full w-full">
        {card.type === "number" && (
          <span className="tracking-tighter">{card.value}</span>
        )}
        {card.type === "skip" && (
          <Ban className="w-3/5 h-3/5" strokeWidth={3} />
        )}
        {card.type === "reverse" && (
          <RefreshCw className="w-3/5 h-3/5" strokeWidth={3} />
        )}

        {card.type === "draw2" && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute -translate-x-2 -translate-y-2 text-white/90">
              <Plus size="1em" strokeWidth={4} />
            </div>
            <div className="absolute translate-x-2 translate-y-2 text-white/90">
              <Plus size="1em" strokeWidth={4} />
            </div>
          </div>
        )}

        {(card.type === "wild" || card.type === "wild_draw4") && (
          <div className="relative w-3/4 h-3/4 rounded-full overflow-hidden shadow-inner border-4 border-white/20 animate-spin-slow">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="bg-red-500" />
              <div className="bg-blue-600" />
              <div className="bg-yellow-400" />
              <div className="bg-emerald-500" />
            </div>
            {/* Center text for Wild Draw 4 */}
            {card.type === "wild_draw4" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <span className="text-white drop-shadow-md text-[0.6em]">
                  +4
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Corner Values (Mini-Me) */}
      {card.type !== "wild" && card.type !== "wild_draw4" && (
        <>
          <div className="absolute top-1.5 left-2 text-[0.3em] leading-none font-bold text-white/90">
            {card.type === "number"
              ? card.value
              : card.type === "draw2"
                ? "+2"
                : card.type === "reverse"
                  ? "⇄"
                  : card.type === "skip"
                    ? "⊘"
                    : ""}
          </div>
          <div className="absolute bottom-1.5 right-2 text-[0.3em] leading-none font-bold text-white/90 rotate-180">
            {card.type === "number"
              ? card.value
              : card.type === "draw2"
                ? "+2"
                : card.type === "reverse"
                  ? "⇄"
                  : card.type === "skip"
                    ? "⊘"
                    : ""}
          </div>
        </>
      )}
    </div>
  );
};

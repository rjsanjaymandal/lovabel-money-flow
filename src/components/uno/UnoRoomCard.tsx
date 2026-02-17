import { Button } from "@/components/ui/button";
import { User, Users, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnoRoomCardProps {
  roomId: string;
  code: string;
  playerCount: number;
  maxPlayers?: number;
  hostName?: string;
  onJoin: (code: string) => void;
}

export const UnoRoomCard = ({
  roomId,
  code,
  playerCount,
  maxPlayers = 4,
  hostName = "Unknown",
  onJoin,
}: UnoRoomCardProps) => {
  const isFull = playerCount >= maxPlayers;

  return (
    <div className="glass-card-interactive p-6 space-y-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
            {hostName.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">
              {hostName}'s Room
            </h3>
            <p className="text-xs text-white/50 font-mono tracking-wider">
              CODE: {code}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "px-2 py-1 rounded-md text-xs font-bold border",
            isFull
              ? "bg-red-500/20 text-red-500 border-red-500/50"
              : "bg-green-500/20 text-green-500 border-green-500/50",
          )}
        >
          {isFull ? "FULL" : "OPEN"}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-white/70 bg-black/20 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Players</span>
          </div>
          <span className="font-mono font-bold text-white">
            {playerCount} <span className="text-white/30">/</span> {maxPlayers}
          </span>
        </div>

        <Button
          className={cn(
            "w-full font-bold shadow-lg transition-all",
            isFull
              ? "bg-white/5 text-white/20 hover:bg-white/5 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 shadow-primary/25",
          )}
          disabled={isFull}
          onClick={() => onJoin(code)}
        >
          {isFull ? (
            "Room Full"
          ) : (
            <>
              Join Game <Play className="w-4 h-4 ml-2 fill-current" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

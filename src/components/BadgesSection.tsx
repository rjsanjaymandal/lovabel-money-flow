import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Footprints, Target, Star, Flame, CreditCard, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

const ICON_MAP: Record<string, any> = {
  Footprints,
  Target,
  Star,
  Flame,
  CreditCard,
};

export function BadgesSection({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const { data: allAchievements } = await supabase
          .from("achievements")
          .select("*");

        const { data: userAchievements } = await supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", userId);

        if (allAchievements) setAchievements(allAchievements);
        if (userAchievements) {
          setUnlocked(new Set(userAchievements.map((ua) => ua.achievement_id)));
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) return <div className="h-24 animate-pulse bg-muted/20 rounded-xl" />;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground px-1">Badges & Achievements</h3>
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex w-max space-x-3 p-1">
          {achievements.map((achievement) => {
            const isUnlocked = unlocked.has(achievement.id);
            const Icon = ICON_MAP[achievement.icon] || Star;

            return (
              <div
                key={achievement.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border w-24 h-32 transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20 shadow-sm"
                    : "bg-muted/30 border-white/5 opacity-60 grayscale"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isUnlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-semibold truncate w-full" title={achievement.name}>
                    {achievement.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate w-full">
                    +{achievement.xp_reward} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

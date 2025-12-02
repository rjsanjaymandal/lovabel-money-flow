import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInCalendarDays } from "date-fns";

export function StreakCounter({ userId }: { userId: string }) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const checkStreak = async () => {
      try {
        // 1. Get current stats
        const { data: stats, error } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") { // Ignore "not found" error
          console.error("Error fetching stats:", error);
          return;
        }

        const today = new Date();
        const lastActivity = stats?.last_activity_date ? new Date(stats.last_activity_date) : null;
        
        let newStreak = stats?.current_streak || 0;
        let shouldUpdate = false;

        if (!lastActivity) {
          // First time user
          newStreak = 1;
          shouldUpdate = true;
        } else {
          const daysDiff = differenceInCalendarDays(today, lastActivity);

          if (daysDiff === 0) {
            // Already active today, do nothing
            setStreak(newStreak);
            setLoading(false);
            return;
          } else if (daysDiff === 1) {
            // Consecutive day
            newStreak += 1;
            shouldUpdate = true;
            toast({
              title: "Streak Increased! 🔥",
              description: `You're on a ${newStreak}-day streak! Keep it up!`,
            });
          } else {
            // Missed a day (or more)
            newStreak = 1;
            shouldUpdate = true;
            if (newStreak > 1) {
               toast({
                title: "Streak Reset 😢",
                description: "You missed a day. Start a new streak today!",
              });
            }
          }
        }

        if (shouldUpdate) {
          const { error: updateError } = await supabase
            .from("user_stats")
            .upsert({
              user_id: userId,
              current_streak: newStreak,
              last_activity_date: today.toISOString(),
              longest_streak: Math.max(newStreak, stats?.longest_streak || 0),
              updated_at: new Date().toISOString(),
            });

          if (updateError) {
            console.error("Error updating streak:", updateError);
          }
        }

        setStreak(newStreak);
      } catch (err) {
        console.error("Streak check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStreak();
  }, [userId, toast]);

  if (loading) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20">
      <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"}`} />
      <span className={`text-sm font-bold ${streak > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
        {streak}
      </span>
    </div>
  );
}

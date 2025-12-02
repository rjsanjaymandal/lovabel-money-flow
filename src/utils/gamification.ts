import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const checkAchievement = async (userId: string, code: string) => {
  try {
    // 1. Check if already unlocked
    const { data: achievement } = await supabase
      .from("achievements")
      .select("id, name, xp_reward")
      .eq("code", code)
      .single();

    if (!achievement) return;

    const { data: existing } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", achievement.id)
      .single();

    if (existing) return; // Already unlocked

    // 2. Unlock it
    const { error } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

    if (!error) {
      // 3. Award XP (Client-side update)
      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_xp")
        .eq("user_id", userId)
        .single();

      const currentXp = stats?.total_xp || 0;
      await supabase
        .from("user_stats")
        .upsert({
          user_id: userId,
          total_xp: currentXp + achievement.xp_reward,
          updated_at: new Date().toISOString(),
        });

      // 4. Notify user
      toast({
        title: `Achievement Unlocked: ${achievement.name}! 🏆`,
        description: `You earned +${achievement.xp_reward} XP!`,
      });
    }
  } catch (error) {
    console.error("Error checking achievement:", error);
  }
};

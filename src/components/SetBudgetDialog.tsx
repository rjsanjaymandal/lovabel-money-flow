import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkAchievement } from "@/utils/gamification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SetBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  onSuccess: () => void;
  currentBudget?: { category: string; amount: number; id: string } | null;
}

export function SetBudgetDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
  currentBudget,
}: SetBudgetDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      if (currentBudget) {
        setCategory(currentBudget.category);
        setAmount(currentBudget.amount.toString());
      } else {
        setCategory("");
        setAmount("");
      }
    }
  }, [open, currentBudget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const budgetData = {
        user_id: user.id,
        category,
        amount: parseFloat(amount),
      };

      if (currentBudget?.id) {
        // Update existing
        const { error } = await supabase
          .from("budgets")
          .update({ amount: parseFloat(amount) })
          .eq("id", currentBudget.id);
        if (error) throw error;
      } else {
        // Insert new (upsert based on user_id + category unique constraint)
        const { error } = await supabase
          .from("budgets")
          .upsert(budgetData, { onConflict: "user_id,category" });
        if (error) throw error;
      }

      toast({
        title: "Budget Saved",
        description: `Budget for ${category} set to ₹${amount}`,
      });

      // Check Achievement
      checkAchievement(user.id, "BUDGET_BOSS");

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save budget.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {currentBudget ? "Edit Budget" : "Set New Budget"}
          </DialogTitle>
          <DialogDescription>
            {currentBudget
              ? "Update the monthly limit for this category."
              : "Set a monthly spending limit for a category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={!!currentBudget}
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Monthly Limit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₹
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 h-12 rounded-xl text-lg"
                placeholder="5000"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Save Budget"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

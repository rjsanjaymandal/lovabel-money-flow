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
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, Target, IndianRupee, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

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

  const isMobile = useIsMobile();

  const BudgetForm = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
            Category
          </Label>
          <Select
            value={category}
            onValueChange={setCategory}
            disabled={!!currentBudget}
          >
            <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/5 bg-background/95 backdrop-blur-xl">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="rounded-lg mb-1">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
            Monthly Limit
          </Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <IndianRupee className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-12 h-14 rounded-2xl text-2xl font-bold bg-muted/30 border-muted-foreground/10 focus:border-primary/50 focus:ring-primary/10 transition-all"
              placeholder="0"
              autoFocus={!isMobile}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-14 rounded-2xl text-lg font-bold bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Target className="w-5 h-5 mr-2" />
        )}
        {currentBudget ? "Update Budget" : "Set Budget"}
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] p-6 pt-2 max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-6" />
          <DrawerHeader className="p-0 mb-6">
            <DrawerTitle className="text-2xl font-black tracking-tight text-center">
              {currentBudget ? "Edit Budget" : "Set New Budget"}
            </DrawerTitle>
            <DrawerDescription className="text-center text-muted-foreground">
              {currentBudget
                ? "Update the monthly limit for this category."
                : "Set a monthly spending limit for a category."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="pb-10">{BudgetForm}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] border-white/5 bg-card/95 backdrop-blur-2xl shadow-2xl p-8 rounded-[2.5rem]">
        <DialogHeader className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight text-center">
            {currentBudget ? "Edit Budget" : "Set New Budget"}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {currentBudget
              ? "Update the monthly limit for this category."
              : "Set a monthly spending limit for a category."}
          </DialogDescription>
        </DialogHeader>
        {BudgetForm}
      </DialogContent>
    </Dialog>
  );
}

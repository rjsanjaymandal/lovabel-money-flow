import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, Edit2, Check, X, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BudgetCardProps {
  userId: string;
  selectedMonth: Date;
  totalExpenses: number;
}

export const BudgetCard = ({ userId, selectedMonth, totalExpenses }: BudgetCardProps) => {
  const [budget, setBudget] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  const monthKey = format(selectedMonth, "yyyy-MM-01");

  useEffect(() => {
    fetchBudget();
  }, [userId, monthKey]);

  const fetchBudget = async () => {
    const { data } = await supabase
      .from("monthly_budgets")
      .select("total_budget")
      .eq("user_id", userId)
      .eq("month", monthKey)
      .maybeSingle();

    if (data) {
      setBudget(data.total_budget);
    } else {
      setBudget(0);
    }
  };

  const saveBudget = async () => {
    const newBudget = parseFloat(editValue);
    if (isNaN(newBudget) || newBudget < 0) {
      toast({ title: "Invalid budget amount", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("monthly_budgets")
      .upsert({
        user_id: userId,
        month: monthKey,
        total_budget: newBudget,
      });

    if (error) {
      toast({ title: "Failed to save budget", variant: "destructive" });
    } else {
      setBudget(newBudget);
      setIsEditing(false);
      toast({ title: "Budget saved successfully" });
    }
  };

  const percentage = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage > 80 && percentage <= 100;

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Target className="w-5 h-5 text-primary" />
          Monthly Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                ${budget.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Target spending</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditValue(budget.toString());
                setIsEditing(true);
              }}
              className="hover:bg-muted rounded-full"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter budget"
              className="flex-1"
              autoFocus
            />
            <Button size="icon" variant="default" onClick={saveBudget} className="rounded-full">
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {budget > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className={`font-semibold ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
                ${totalExpenses.toFixed(0)} ({percentage.toFixed(0)}%)
              </span>
            </div>
            <Progress 
              value={Math.min(percentage, 100)} 
              className="h-2"
            />
            
            {isOverBudget && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Over budget by ${(totalExpenses - budget).toFixed(0)}</span>
              </div>
            )}
            {isNearLimit && !isOverBudget && (
              <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Approaching budget limit</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
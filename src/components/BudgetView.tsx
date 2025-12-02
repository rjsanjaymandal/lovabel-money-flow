import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryBudgetCard } from "./CategoryBudgetCard";
import { SetBudgetDialog } from "./SetBudgetDialog";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface BudgetViewProps {
  userId: string;
  categories: string[];
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
}

export function BudgetView({ userId, categories }: BudgetViewProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const fetchBudgets = async () => {
    if (!userId) return;

    const currentDate = new Date();
    const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");

    // Fetch budgets
    const { data: budgetData } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId);

    // Fetch spending for this month
    const { data: transactionData } = await supabase
      .from("transactions")
      .select("amount, category, type")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate);

    if (budgetData) {
      const budgetsWithSpent = budgetData.map((budget) => {
        const spent = transactionData
          ?.filter((t) => t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0) || 0;
        return { ...budget, spent };
      });

      setBudgets(budgetsWithSpent);
      setTotalBudget(budgetsWithSpent.reduce((sum, b) => sum + b.amount, 0));
      setTotalSpent(budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0));
    }
  };

  useEffect(() => {
    fetchBudgets();

    // Real-time subscription
    const channel = supabase
      .channel('budget-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` },
        () => fetchBudgets()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => fetchBudgets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsSetBudgetOpen(true);
  };

  const handleClose = (open: boolean) => {
    setIsSetBudgetOpen(open);
    if (!open) setEditingBudget(null);
  };

  const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Overview Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 via-purple-500/5 to-background backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="w-5 h-5" />
            </div>
            Total Monthly Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-center justify-center py-2 sm:py-4">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
              {/* Circular Progress Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10%"
                  className="text-muted/20"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10%"
                  strokeDasharray={2 * Math.PI * 45} // Approximate radius percentage
                  strokeDashoffset={0} // Dynamic calculation needed if using percentage
                  pathLength={100}
                  className={`transition-all duration-1000 ease-out ${
                    percentage > 100 ? "text-destructive" : "text-primary"
                  }`}
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 100 - Math.min(percentage, 100)
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold tracking-tighter">
                  {percentage.toFixed(0)}%
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                  of Budget Used
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full mt-6 sm:mt-8">
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">₹{totalSpent.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Budget</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">₹{totalBudget.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="col-span-full flex items-center justify-between">
          <h3 className="text-lg font-semibold">Category Budgets</h3>
          <Button onClick={() => setIsSetBudgetOpen(true)} size="sm" className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Set Budget
          </Button>
        </div>
        
        {budgets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/25 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Budgeting</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Take control of your finances by setting monthly limits for different categories.
            </p>
            <Button onClick={() => setIsSetBudgetOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Set Your First Budget
            </Button>
          </div>
        ) : (
          budgets.map((budget) => (
            <CategoryBudgetCard
              key={budget.id}
              category={budget.category}
              budget={budget.amount}
              spent={budget.spent}
              onEdit={() => handleEdit(budget)}
            />
          ))
        )}
      </div>

      <SetBudgetDialog
        open={isSetBudgetOpen}
        onOpenChange={handleClose}
        categories={categories}
        onSuccess={fetchBudgets}
        currentBudget={editingBudget}
      />
    </div>
  );
}

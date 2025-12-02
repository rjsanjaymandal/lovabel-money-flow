import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface CategoryBudgetCardProps {
  category: string;
  spent: number;
  budget: number;
  onEdit: () => void;
}

export function CategoryBudgetCard({ category, spent, budget, onEdit }: CategoryBudgetCardProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget;
  
  // Color logic
  let progressColor = "bg-primary";
  if (percentage > 90) progressColor = "bg-destructive";
  else if (percentage > 75) progressColor = "bg-yellow-500";
  else progressColor = "bg-green-500";

  return (
    <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 text-xl`}>
            {/* Simple emoji mapping or icon based on category could go here */}
            🏷️
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{category}</h3>
            <p className="text-xs text-muted-foreground">
              {isOverBudget ? "Over Budget" : `${(100 - percentage).toFixed(0)}% remaining`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            ₹{spent.toLocaleString()} of ₹{budget.toLocaleString()}
          </span>
          <span className={`font-medium ${percentage >= 100 ? "text-destructive" : "text-primary"}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={percentage} 
          className="h-2.5" 
          indicatorClassName={progressColor}
        />
        <div className="flex justify-between items-center text-xs mt-1">
          <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            {isOverBudget ? `Over by ₹${(spent - budget).toLocaleString()}` : `₹${(budget - spent).toLocaleString()} remaining`}
          </span>
        </div>
      </div>
    </div>
  );
}

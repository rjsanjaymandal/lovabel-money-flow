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
    <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10 text-2xl group-hover:scale-110 transition-transform duration-300`}>
            {/* Simple emoji mapping or icon based on category could go here */}
            🏷️
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">{category}</h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {isOverBudget ? (
                <span className="text-destructive flex items-center gap-1">
                  Over Budget
                </span>
              ) : (
                <span>{(100 - percentage).toFixed(0)}% remaining</span>
              )}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Spent</span>
            <span className="text-lg font-bold text-foreground">₹{spent.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Limit</span>
            <span className="text-sm font-semibold text-muted-foreground">₹{budget.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="relative h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs pt-1">
          <span className={isOverBudget ? "text-destructive font-semibold" : "text-emerald-500 font-medium"}>
            {isOverBudget ? `Exceeded by ₹${(spent - budget).toLocaleString()}` : `Safe to spend ₹${(budget - spent).toLocaleString()}`}
          </span>
          <span className="text-muted-foreground font-medium">{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

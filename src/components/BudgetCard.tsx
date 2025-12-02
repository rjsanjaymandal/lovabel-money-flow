import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, ArrowRight, AlertCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BudgetCardProps {
  userId: string;
  selectedMonth: Date;
  totalExpenses: number;
  budget?: number;
}

export const BudgetCard = ({ userId, selectedMonth, totalExpenses, budget = 0 }: BudgetCardProps) => {
  const navigate = useNavigate();
  const percentage = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage > 80 && percentage <= 100;

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Monthly Budget
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs text-muted-foreground hover:text-primary"
            onClick={() => navigate("/dashboard?tab=budget")}
          >
            Manage
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              ₹{budget.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Target spending</p>
          </div>
        </div>

        {budget > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className={`font-semibold ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
                ₹{totalExpenses.toFixed(0)} ({percentage.toFixed(0)}%)
              </span>
            </div>
            <Progress 
              value={Math.min(percentage, 100)} 
              className="h-2"
              indicatorClassName={isOverBudget ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-primary"}
            />
            
            {isOverBudget && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Over budget by ₹{(totalExpenses - budget).toFixed(0)}</span>
              </div>
            )}
            {isNearLimit && !isOverBudget && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-500/10 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Approaching budget limit</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-2">No budget set for this month</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard?tab=budget")}>
              Set Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
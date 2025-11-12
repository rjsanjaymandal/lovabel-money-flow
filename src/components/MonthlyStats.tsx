import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";

interface MonthlyStatsProps {
  income: number;
  expenses: number;
  balance: number;
}

export const MonthlyStats = ({ income, expenses, balance }: MonthlyStatsProps) => {
  const stats = [
    {
      label: "Income",
      value: income,
      icon: TrendingUp,
      gradient: "from-success/20 to-success/5",
      iconColor: "text-success",
    },
    {
      label: "Expenses",
      value: expenses,
      icon: TrendingDown,
      gradient: "from-destructive/20 to-destructive/5",
      iconColor: "text-destructive",
    },
    {
      label: "Net",
      value: balance,
      icon: balance >= 0 ? Wallet : ArrowUpDown,
      gradient: balance >= 0 ? "from-primary/20 to-primary/5" : "from-accent/20 to-accent/5",
      iconColor: balance >= 0 ? "text-primary" : "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          className={`border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-scale-in bg-gradient-to-br ${stat.gradient}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/50 flex items-center justify-center ${stat.iconColor}`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  ${Math.abs(stat.value).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
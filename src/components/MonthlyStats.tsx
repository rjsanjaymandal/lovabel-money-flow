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
      gradient: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/20",
      text: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Expenses",
      value: expenses,
      icon: TrendingDown,
      gradient: "from-rose-500/20 to-rose-500/5",
      border: "border-rose-500/20",
      text: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: "Net",
      value: balance,
      icon: balance >= 0 ? Wallet : ArrowUpDown,
      gradient: balance >= 0 ? "from-blue-500/20 to-blue-500/5" : "from-amber-500/20 to-amber-500/5",
      border: balance >= 0 ? "border-blue-500/20" : "border-amber-500/20",
      text: balance >= 0 ? "text-blue-500" : "text-amber-500",
      bg: balance >= 0 ? "bg-blue-500/10" : "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          className={`border ${stat.border} shadow-lg backdrop-blur-xl bg-gradient-to-br ${stat.gradient} hover:scale-105 transition-all duration-300 relative overflow-hidden group`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`absolute inset-0 ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          <CardContent className="p-3 sm:p-4 relative">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.text} shadow-inner`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={`text-sm sm:text-lg md:text-xl font-bold ${stat.text} truncate`}>
                  ₹{Math.abs(stat.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
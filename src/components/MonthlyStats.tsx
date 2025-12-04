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
      // Soft Emerald
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
    },
    {
      label: "Expenses",
      value: expenses,
      icon: TrendingDown,
      // Soft Rose
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      iconBg: "bg-rose-500/20",
    },
    {
      label: "Net Balance",
      value: balance,
      icon: balance >= 0 ? Wallet : ArrowUpDown,
      // Soft Blue or Amber
      color: balance >= 0 ? "text-blue-500" : "text-amber-500",
      bg: balance >= 0 ? "bg-blue-500/10" : "bg-amber-500/10",
      iconBg: balance >= 0 ? "bg-blue-500/20" : "bg-amber-500/20",
    },
  ];

  return (
    <>
      {/* Mobile View: Single Wallet Card */}
      <div className="sm:hidden">
        <div className="relative overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background text-foreground shadow-2xl shadow-primary/5 border border-border/50 backdrop-blur-xl">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between opacity-80">
              <span className="text-sm font-medium tracking-wide">Total Balance</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-4xl font-bold tracking-tight text-primary">
                ₹{balance.toLocaleString()}
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                {balance >= 0 ? "You're doing great!" : "Watch your spending."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1 p-3 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <div className="p-1 rounded-full bg-emerald-500/10">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">Income</span>
                </div>
                <p className="text-lg font-semibold">₹{income.toLocaleString()}</p>
              </div>
              
              <div className="space-y-1 p-3 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <div className="p-1 rounded-full bg-rose-500/10">
                    <TrendingDown className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">Expense</span>
                </div>
                <p className="text-lg font-semibold">₹{expenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View: 3 Card Grid */}
      <div className="hidden sm:grid sm:grid-cols-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="relative group flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 border border-white/5"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Subtle Glow */}
            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.bg} blur-xl`} />
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${stat.iconBg} ${stat.color} shadow-sm transition-transform duration-500 group-hover:rotate-6`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className={`text-lg sm:text-2xl font-bold ${stat.color} tracking-tight`}>
                  ₹{Math.abs(stat.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { SpendingChart } from "@/components/SpendingChart";
import { TransactionList } from "@/components/TransactionList";

interface TransactionViewProps {
  userId: string;
  stats: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
  categories: string[];
  onTransactionAdded: () => void;
}

export function TransactionView({ userId, stats, categories, onTransactionAdded }: TransactionViewProps) {
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Quick Add Transaction */}
      <Card className="border shadow-md sm:shadow-lg">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg md:text-xl">Quick Add</CardTitle>
            <AddTransactionDialog 
              onSuccess={onTransactionAdded}
              categories={categories}
            >
              <Button size="sm" className="gradient-primary hover:opacity-90 h-9 sm:h-10 touch-manipulation">
                <Plus className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden xs:inline ml-1.5">Add</span>
              </Button>
            </AddTransactionDialog>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Track income & expenses in ₹
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-3">
        <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group active:scale-95 sm:hover:scale-105">
          <div className="absolute inset-0 gradient-success opacity-5 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-3 md:pb-2 relative">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-semibold leading-tight">Income</CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full gradient-success flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-3 sm:pt-0 md:pt-0 relative">
            <div className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-success truncate">
              ₹{stats.totalIncome.toFixed(0)}
            </div>
            <p className="text-[8px] sm:text-[9px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group active:scale-95 sm:hover:scale-105">
          <div className="absolute inset-0 gradient-accent opacity-5 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-3 md:pb-2 relative">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-semibold leading-tight">Expenses</CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-3 sm:pt-0 md:pt-0 relative">
            <div className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-accent truncate">
              ₹{stats.totalExpenses.toFixed(0)}
            </div>
            <p className="text-[8px] sm:text-[9px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Watch it!</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group active:scale-95 sm:hover:scale-105">
          <div className="absolute inset-0 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-3 md:pb-2 relative">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-semibold leading-tight">Balance</CardTitle>
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-2.5 pt-0 sm:p-3 sm:pt-0 md:pt-0 relative">
            <div className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary truncate">
              ₹{stats.balance.toFixed(0)}
            </div>
            <p className="text-[8px] sm:text-[9px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Net worth</p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Overview */}
      <Card className="border shadow-sm sm:shadow-md">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg lg:text-xl">
            <span>Spending Overview</span>
            <span className="hidden sm:inline">📊</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
          <SpendingChart userId={userId} />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border shadow-sm sm:shadow-md">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg lg:text-xl">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
          <TransactionList userId={userId} limit={10} />
        </CardContent>
      </Card>
    </div>
  );
}

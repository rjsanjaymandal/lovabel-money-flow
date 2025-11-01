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
    <div className="space-y-6">
      {/* Quick Add Transaction */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Quick Add Transaction</CardTitle>
            <AddTransactionDialog 
              onSuccess={onTransactionAdded}
              categories={categories}
            >
              <Button size="sm" className="gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </AddTransactionDialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Track your income and expenses with categories in ₹
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
        <Card className="border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group hover:scale-105">
          <div className="absolute inset-0 gradient-success opacity-5 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold">Total Income</CardTitle>
            <div className="w-10 h-10 rounded-full gradient-success flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-success">
              ₹{stats.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up! 📈</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group hover:scale-105">
          <div className="absolute inset-0 gradient-accent opacity-5 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold">Total Expenses</CardTitle>
            <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-accent">
              ₹{stats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Watch your spending 👀</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group hover:scale-105">
          <div className="absolute inset-0 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold">Balance</CardTitle>
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-primary">
              ₹{stats.balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your net worth 💎</p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Overview */}
      <Card className="border-2 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            Spending Overview 📊
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingChart userId={userId} />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-2 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList userId={userId} limit={10} />
        </CardContent>
      </Card>
    </div>
  );
}

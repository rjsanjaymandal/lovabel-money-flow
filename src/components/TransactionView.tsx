import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { MonthSelector } from "@/components/MonthSelector";
import { MonthlyStats } from "@/components/MonthlyStats";
import { BudgetCard } from "@/components/BudgetCard";
import { MonthlyTransactionList } from "@/components/MonthlyTransactionList";
import { MonthlyLendBorrowSummary } from "@/components/MonthlyLendBorrowSummary";
import { ExportButton } from "@/components/ExportButton";
import { AIInsights } from "@/components/AIInsights";
import { SpendingChart } from "@/components/SpendingChart";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInput } from "@/components/VoiceInput";
import { SubscriptionManager } from "@/components/SubscriptionManager";

interface TransactionViewProps {
  userId: string;
  categories: string[];
  onTransactionAdded: () => void;
}

export function TransactionView({ userId, categories, onTransactionAdded }: TransactionViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [voiceData, setVoiceData] = useState<{ amount: string; description: string; type: "expense" | "income" } | undefined>(undefined);

  const handleVoiceResult = (data: { amount: string; description: string; type: "expense" | "income" }) => {
    setVoiceData(data);
    setIsAddDialogOpen(true);
  };

  // Memoize date range calculation
  const dateRange = useMemo(() => ({
    startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
    endDate: format(endOfMonth(selectedMonth), "yyyy-MM-dd")
  }), [selectedMonth]);

  const fetchMonthlyStats = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", userId)
      .gte("date", dateRange.startDate)
      .lte("date", dateRange.endDate);

    if (data) {
      const income = data
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = data
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      setStats({ income, expenses, balance: income - expenses });
    }
  }, [userId, dateRange]);

  useEffect(() => {
    fetchMonthlyStats();
  }, [fetchMonthlyStats]);

  const handleTransactionSuccess = () => {
    fetchMonthlyStats();
    onTransactionAdded();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-20">
      {/* Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

      {/* Stats Overview */}
      <MonthlyStats
        income={stats.income}
        expenses={stats.expenses}
        balance={stats.balance}
      />

      {/* Actions Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex gap-2">
          <AddTransactionDialog 
            onSuccess={handleTransactionSuccess} 
            categories={categories}
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            defaultValues={voiceData}
          >
            <Button className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] bg-gradient-to-r from-primary to-purple-600 border-0">
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">Add Transaction</span>
            </Button>
          </AddTransactionDialog>
          <VoiceInput onResult={handleVoiceResult} />
        </div>
        <ExportButton
          transactions={transactions}
          selectedMonth={selectedMonth}
          income={stats.income}
          expenses={stats.expenses}
        />
      </div>

      {/* Spending Graph - Restored & Redesigned */}
      <Card className="border-none shadow-lg bg-card/40 backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            Spending Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <SpendingChart userId={userId} selectedMonth={selectedMonth} />
        </CardContent>
      </Card>

      {/* Budget & Lend/Borrow Summary */}
      <div className="grid gap-3 sm:gap-6 md:grid-cols-2">
        <BudgetCard
          userId={userId}
          selectedMonth={selectedMonth}
          totalExpenses={stats.expenses}
        />
        <div className="space-y-3">
          <MonthlyLendBorrowSummary userId={userId} selectedMonth={selectedMonth} />
          <SubscriptionManager userId={userId} onTransactionAdded={handleTransactionSuccess} />
        </div>
      </div>

      {/* AI Insights */}
      <AIInsights
        userId={userId}
        selectedMonth={selectedMonth}
        income={stats.income}
        expenses={stats.expenses}
        transactions={transactions}
      />

      {/* Transaction List */}
      <MonthlyTransactionList
        userId={userId}
        selectedMonth={selectedMonth}
        onTransactionsLoaded={setTransactions}
      />
    </div>
  );
}


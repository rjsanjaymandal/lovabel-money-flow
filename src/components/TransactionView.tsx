import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Newspaper } from "lucide-react";
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
import { VoiceInput } from "@/components/VoiceInput";
import { ScanReceiptButton } from "@/components/ScanReceiptButton";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { ModeToggle } from "@/components/mode-toggle";
import { User } from "@supabase/supabase-js";

import { SearchResults } from "@/components/SearchResults";
import { Transaction } from "@/types/finance";

interface TransactionViewProps {
  userId: string;
  user?: User | null; // Add user prop
  categories: string[];
  onTransactionAdded: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function TransactionView({
  userId,
  user,
  categories,
  onTransactionAdded,
  searchQuery,
  onClearSearch,
  selectedMonth,
  onMonthChange,
}: TransactionViewProps) {
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [voiceData, setVoiceData] = useState<
    | { amount: string; description: string; type: "expense" | "income" }
    | undefined
  >(undefined);
  const [monthlyBudget, setMonthlyBudget] = useState(0);

  const handleVoiceResult = (data: {
    amount: string;
    description: string;
    type: "expense" | "income";
  }) => {
    setVoiceData(data);
    setIsAddDialogOpen(true);
  };

  // Memoize date range calculation
  const dateRange = useMemo(
    () => ({
      startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
      endDate: format(endOfMonth(selectedMonth), "yyyy-MM-dd"),
    }),
    [selectedMonth],
  );

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

    // Fetch total budget from new budgets table
    const { data: budgetData } = await supabase
      .from("budgets")
      .select("amount")
      .eq("user_id", userId);

    if (budgetData) {
      const totalBudget = budgetData.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      setMonthlyBudget(totalBudget);
    }
  }, [userId, dateRange]);

  useEffect(() => {
    fetchMonthlyStats();
  }, [fetchMonthlyStats]);

  const handleTransactionSuccess = () => {
    fetchMonthlyStats();
    onTransactionAdded();
  };

  if (searchQuery) {
    return (
      <SearchResults
        userId={userId}
        searchQuery={searchQuery}
        onClose={onClearSearch || (() => {})}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24 sm:pb-24 px-1 sm:px-2 max-w-[1600px] mx-auto relative z-10">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Row 1: Full Width Stats */}
        <div className="xl:col-span-3">
          <MonthlyStats
            income={stats.income}
            expenses={stats.expenses}
            balance={stats.balance}
          />
        </div>

        {/* Row 2: Main Content Split */}

        {/* Left Column: Charts (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Actions Row */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <AddTransactionDialog
              onSuccess={handleTransactionSuccess}
              categories={categories}
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              defaultValues={voiceData}
            >
              <Button className="h-12 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 font-semibold px-6 flex-shrink-0">
                <Plus className="w-5 h-5 mr-2" />
                Add Transaction
              </Button>
            </AddTransactionDialog>

            <div className="flex gap-2">
              <VoiceInput
                onResult={handleVoiceResult}
                variant="outline"
                className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white"
              />
              <ScanReceiptButton
                onScanComplete={(data) => {
                  setVoiceData({
                    amount: data.amount?.toString() || "",
                    description: data.merchant || "",
                    type: "expense",
                  });
                  setIsAddDialogOpen(true);
                }}
                variant="outline"
                className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white"
              />
              <ExportButton
                transactions={transactions}
                selectedMonth={selectedMonth}
                income={stats.income}
                expenses={stats.expenses}
                variant="outline"
                className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white p-0"
              />
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-[400px]">
            <SpendingChart userId={userId} selectedMonth={selectedMonth} />
          </div>

          {/* Transaction List */}
          <div className="rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl min-h-[500px]">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5">
                <Newspaper className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="font-semibold text-lg text-white">
                Recent Activity
              </h3>
            </div>
            <div className="p-2">
              <MonthlyTransactionList
                userId={userId}
                selectedMonth={selectedMonth}
                onTransactionsLoaded={setTransactions}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Widgets (1/3 width) */}
        <div className="space-y-6">
          <div className="rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 p-1 shadow-xl">
            <BudgetCard
              userId={userId}
              selectedMonth={selectedMonth}
              totalExpenses={stats.expenses}
              budget={monthlyBudget}
            />
          </div>

          <div className="rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Quick Insights
            </h3>
            <AIInsights
              userId={userId}
              selectedMonth={selectedMonth}
              income={stats.income}
              expenses={stats.expenses}
              transactions={transactions}
              budget={monthlyBudget}
            />
          </div>

          <div className="rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 p-1 shadow-xl">
            <SubscriptionManager
              userId={userId}
              onTransactionAdded={handleTransactionSuccess}
            />
          </div>

          <div className="rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 p-1 shadow-xl">
            <MonthlyLendBorrowSummary
              userId={userId}
              selectedMonth={selectedMonth}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

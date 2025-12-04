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
import { VoiceInput } from "@/components/VoiceInput";
import { ScanReceiptButton } from "@/components/ScanReceiptButton";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { ModeToggle } from "@/components/mode-toggle";
import { ZenBackground } from "@/components/ZenBackground";

import { SearchResults } from "@/components/SearchResults";

interface TransactionViewProps {
  userId: string;
  user?: any; // Add user prop
  categories: string[];
  onTransactionAdded: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function TransactionView({ userId, user, categories, onTransactionAdded, searchQuery, onClearSearch }: TransactionViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [voiceData, setVoiceData] = useState<{ amount: string; description: string; type: "expense" | "income" } | undefined>(undefined);
  const [monthlyBudget, setMonthlyBudget] = useState(0);

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

    // Fetch total budget from new budgets table
    const { data: budgetData } = await supabase
      .from("budgets")
      .select("amount")
      .eq("user_id", userId);

    if (budgetData) {
      const totalBudget = budgetData.reduce((sum, item) => sum + item.amount, 0);
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

  const [userName, setUserName] = useState("Friend");

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name.split(" ")[0]);
    } else if (user?.email) {
      // Extract name from email (e.g. rjsan... -> Rjsan)
      const name = user.email.split("@")[0];
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-24 sm:pb-24 px-4 sm:px-0 h-auto flex flex-col sm:block relative z-10">
      <ZenBackground />
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2 px-0 sm:px-0 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90 hidden sm:block">
            {getGreeting()}, <span className="text-primary">{userName}</span>
          </h2>
          <p className="text-muted-foreground/60 font-medium hidden sm:block">
            Here's your financial overview.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <ModeToggle />
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </div>
        {/* Mobile Month Selector */}
        <div className="sm:hidden w-full bg-background/80 rounded-2xl p-1.5 backdrop-blur-md border border-white/5 flex gap-2">
           <div className="flex-1">
             <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
           </div>
           <ModeToggle />
        </div>
      </div>

      {/* Stats Overview (Unified for Mobile & Desktop) */}
      <MonthlyStats
        income={stats.income}
        expenses={stats.expenses}
        balance={stats.balance}
        userName={userName}
      />

      {/* Mobile Actions (Inline - Like Desktop) */}
      <div className="sm:hidden flex items-center gap-2 mb-6">
        <div className="flex-1">
          <AddTransactionDialog 
            onSuccess={handleTransactionSuccess} 
            categories={categories}
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            defaultValues={voiceData}
          >
            <Button className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] bg-primary text-primary-foreground border-0 font-semibold text-base">
              <Plus className="w-5 h-5 mr-2" />
              Add Transaction
            </Button>
          </AddTransactionDialog>
        </div>
        
        <VoiceInput 
          onResult={handleVoiceResult} 
          variant="outline"
          className="h-12 w-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm"
        />
        
        <ScanReceiptButton 
          onScanComplete={(data) => {
            setVoiceData({
              amount: data.amount?.toString() || "",
              description: data.merchant || "",
              type: "expense"
            });
            setIsAddDialogOpen(true);
          }}
          variant="outline"
          className="h-12 w-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm"
        />

        <ExportButton
          transactions={transactions}
          selectedMonth={selectedMonth}
          income={stats.income}
          expenses={stats.expenses}
          variant="outline"
          className="h-12 w-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm p-0"
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col sm:grid sm:gap-8 sm:lg:grid-cols-3 flex-1 sm:flex-none min-h-0">
        {/* Left Column: Chart & Actions & List */}
        <div className="contents sm:block sm:lg:col-span-2 sm:space-y-8">
          {/* Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex-1 flex gap-2">
              <AddTransactionDialog 
                onSuccess={handleTransactionSuccess} 
                categories={categories}
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                defaultValues={voiceData}
              >
                <Button className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] bg-primary text-primary-foreground border-0 font-semibold text-base">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Transaction
                </Button>
              </AddTransactionDialog>
              <VoiceInput 
                onResult={handleVoiceResult} 
                variant="outline"
                className="h-12 w-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm"
              />
            </div>
            <ExportButton
              transactions={transactions}
              selectedMonth={selectedMonth}
              income={stats.income}
              expenses={stats.expenses}
            />
          </div>



          {/* Spending Graph - Zen Style (Now visible on mobile, Order 1) */}
          <div className="order-1 sm:order-none mb-6 sm:mb-0 rounded-3xl bg-card/40 border border-white/10 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-foreground/80">Spending Analysis</h3>
            </div>
            <SpendingChart userId={userId} selectedMonth={selectedMonth} />
          </div>

          {/* Transaction List (Order 3) */}
          <div className="order-3 sm:order-none flex-1">
             <MonthlyTransactionList
               userId={userId}
               selectedMonth={selectedMonth}
               onTransactionsLoaded={setTransactions}
             />
          </div>
        </div>

        {/* Right Column: Insights & Budget (Order 2) */}
        <div className="order-2 sm:order-none space-y-6 mb-6 sm:mb-0">
          <BudgetCard
            userId={userId}
            selectedMonth={selectedMonth}
            totalExpenses={stats.expenses}
            budget={monthlyBudget}
          />
          <MonthlyLendBorrowSummary userId={userId} selectedMonth={selectedMonth} />
          <SubscriptionManager userId={userId} onTransactionAdded={handleTransactionSuccess} />
          <AIInsights
            userId={userId}
            selectedMonth={selectedMonth}
            income={stats.income}
            expenses={stats.expenses}
            transactions={transactions}
          />
        </div>
      </div>
      
      {/* Mobile Bottom Actions Bar */}
      {/* Mobile Bottom Dock */}

    </div>
  );
}

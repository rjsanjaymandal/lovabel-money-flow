import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Wallet } from "lucide-react";
import { MonthSelector } from "@/components/MonthSelector";
import { MonthlyStats } from "@/components/MonthlyStats";
import { BudgetCard } from "@/components/BudgetCard";
import { MonthlyTransactionList } from "@/components/MonthlyTransactionList";
import { MonthlyLendBorrowSummary } from "@/components/MonthlyLendBorrowSummary";
import { ExportButton } from "@/components/ExportButton";
import { AIInsights } from "@/components/AIInsights";
import { CategoryManager } from "@/components/CategoryManager";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { format, startOfMonth, endOfMonth } from "date-fns";

const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Personal",
  "Other",
];

const MonthlyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMonthlyStats();
    }
  }, [user, selectedMonth]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const fetchMonthlyStats = async () => {
    const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

    const { data } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (data) {
      const income = data
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = data
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      setStats({ income, expenses, balance: income - expenses });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-safe">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-lg sticky top-0 z-20 shadow-lg safe-top animate-slide-in">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg animate-glow">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                EasyExpense
              </h1>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground hidden xs:block">
                Monthly Overview
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCategoryManagerOpen(true)}
              className="hover:bg-muted rounded-full h-9 w-9 transition-all hover:scale-110"
            >
              <Settings className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-110 rounded-full h-9 w-9"
            >
              <LogOut className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-20 sm:pb-8 space-y-4 sm:space-y-6">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

        <div className="flex items-center justify-between">
          <AddTransactionDialog onSuccess={fetchMonthlyStats} categories={categories}>
            <Button className="gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <span className="text-lg">+</span>
              Add Transaction
            </Button>
          </AddTransactionDialog>
          <ExportButton
            transactions={transactions}
            selectedMonth={selectedMonth}
            income={stats.income}
            expenses={stats.expenses}
          />
        </div>

        <MonthlyStats
          income={stats.income}
          expenses={stats.expenses}
          balance={stats.balance}
        />

        <BudgetCard
          userId={user?.id}
          selectedMonth={selectedMonth}
          totalExpenses={stats.expenses}
        />

        <MonthlyLendBorrowSummary userId={user?.id} selectedMonth={selectedMonth} />

        <AIInsights
          userId={user?.id}
          selectedMonth={selectedMonth}
          income={stats.income}
          expenses={stats.expenses}
          transactions={transactions}
        />

        <MonthlyTransactionList
          userId={user?.id}
          selectedMonth={selectedMonth}
          onTransactionsLoaded={setTransactions}
        />
      </main>

      {/* Category Manager */}
      <CategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        categories={categories}
        onCategoriesChange={setCategories}
      />
    </div>
  );
};

export default MonthlyDashboard;
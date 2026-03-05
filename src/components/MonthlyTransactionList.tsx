import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Receipt, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Transaction } from "@/types/finance";

interface MonthlyTransactionListProps {
  userId: string;
  selectedMonth: Date;
  onTransactionsLoaded?: (transactions: Transaction[]) => void;
  searchQuery?: string;
}

const MonthlyTransactionListComponent = ({
  userId,
  selectedMonth,
  onTransactionsLoaded,
  searchQuery = "",
}: MonthlyTransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoize date range
  const dateRange = useMemo(
    () => ({
      startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
      endDate: format(endOfMonth(selectedMonth), "yyyy-MM-dd"),
    }),
    [selectedMonth],
  );

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", dateRange.startDate)
      .lte("date", dateRange.endDate)
      .order("date", { ascending: false });

    if (data) {
      const typedData = data as unknown as Transaction[];
      setTransactions(typedData);
      onTransactionsLoaded?.(typedData);
    }
    setLoading(false);
  }, [userId, dateRange, onTransactionsLoaded]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Failed to delete transaction",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Transaction deleted successfully",
      });
      fetchTransactions();
    }
    setDeleteId(null);
  }, [deleteId, toast, fetchTransactions]);

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const lowerQuery = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.category.toLowerCase().includes(lowerQuery) ||
        (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
        t.amount.toString().includes(lowerQuery),
    );
  }, [transactions, searchQuery]);

  // Memoize grouped transactions
  const groupedByDate = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        const date = transaction.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(transaction);
        return acc;
      },
      {} as Record<string, Transaction[]>,
    );
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground/50 text-sm font-medium">
          Loading transactions...
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 px-8 glass-card border border-white/5 bg-white/[0.02]">
        <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/5 flex items-center justify-center mx-auto mb-6 border border-indigo-500/10 shadow-inner">
          <Receipt className="w-10 h-10 text-indigo-400/30" />
        </div>
        <h3 className="text-xl font-black text-white/80 mb-2 tracking-tight">
          No transactions yet
        </h3>
        <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
          Start your financial journey.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 animate-in-up">
        {/* Header - Condensed & Premium */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
            <h3 className="text-sm font-black text-white/60 uppercase tracking-[0.2em]">
              Recent Activity
            </h3>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-2xl backdrop-blur-xl">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
              {filteredTransactions.length}
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              Signals
            </span>
          </div>
        </div>

        <div className="space-y-10">
          {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
            <div key={date} className="space-y-4">
              <div className="sticky top-20 z-10 flex items-center gap-4 px-4 py-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] bg-slate-950/40 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/5 shadow-2xl">
                  {format(new Date(date), "EEEE, MMM d, yyyy")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 px-2">
                {dayTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="group relative flex items-center gap-4 p-4 sm:p-6 glass-card-interactive border-white/5"
                  >
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-[1.8rem] flex items-center justify-center flex-shrink-0 shadow-2xl transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 ${transaction.type === "income"
                          ? "gradient-success-vibrant"
                          : "bg-white/5 text-white/60 border border-white/5"
                        }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <p className="font-black text-base sm:text-lg text-white tracking-tight truncate">
                          {transaction.category}
                        </p>
                        <span
                          className={`font-black text-lg sm:text-xl tracking-tighter ${transaction.type === "income"
                              ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                              : "text-white"
                            }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}₹
                          {transaction.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate opacity-40 group-hover:opacity-100 transition-opacity">
                          <Activity className="w-3.5 h-3.5 text-violet-400" />
                          <p className="text-xs sm:text-sm text-white/60 truncate font-semibold tracking-tight">
                            {transaction.description || "Uncategorized signal"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(transaction.id)}
                          className="h-10 w-10 sm:h-11 sm:w-11 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-500 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl border border-transparent hover:border-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && transactions.length > 0 && (
            <div className="text-center py-20 glass-card mx-2">
              <p className="text-sm font-black text-white/20 uppercase tracking-[0.3em]">
                No matching financial signals
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-white/10 bg-black/40 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const MonthlyTransactionList = memo(MonthlyTransactionListComponent);

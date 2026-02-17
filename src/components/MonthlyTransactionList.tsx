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
      <div className="text-center py-16 px-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium text-foreground/80 mb-1">
          No transactions yet
        </h3>
        <p className="text-muted-foreground/50 text-sm">
          Add your first expense to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-medium text-foreground/80 tracking-tight flex items-center gap-2">
            <Receipt className="w-4 h-4 opacity-50" />
            Recent Transactions
          </h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {filteredTransactions.length} items
          </span>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
            <div key={date} className="space-y-3">
              <div className="sticky top-20 z-10 flex items-center gap-4 pl-2">
                <div className="w-2 h-2 rounded-full bg-primary/50" />
                <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-widest backdrop-blur-md bg-background/50 px-3 py-1 rounded-full">
                  {format(new Date(date), "EEEE, MMM d")}
                </p>
              </div>

              <div className="space-y-2">
                {dayTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="group relative flex items-center gap-3 p-3 sm:gap-4 sm:p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-500 group-hover:rotate-12 ${
                        transaction.type === "income"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                        <p className="font-medium text-sm sm:text-base text-foreground/90 truncate">
                          {transaction.category}
                        </p>
                        <span
                          className={`font-bold text-sm sm:text-base tracking-tight ${
                            transaction.type === "income"
                              ? "text-emerald-500"
                              : "text-foreground"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}₹
                          {transaction.amount.toFixed(0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm text-muted-foreground/60 truncate max-w-[80%] font-light">
                          {transaction.description || "No description"}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(transaction.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-full"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && transactions.length > 0 && (
            <div className="text-center py-12 text-muted-foreground/50 font-light">
              No transactions match your search.
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

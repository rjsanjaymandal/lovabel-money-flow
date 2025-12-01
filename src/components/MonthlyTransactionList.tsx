import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface MonthlyTransactionListProps {
  userId: string;
  selectedMonth: Date;
  onTransactionsLoaded?: (transactions: Transaction[]) => void;
  searchQuery?: string;
}

const MonthlyTransactionListComponent = ({ userId, selectedMonth, onTransactionsLoaded, searchQuery = "" }: MonthlyTransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoize date range
  const dateRange = useMemo(() => ({
    startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
    endDate: format(endOfMonth(selectedMonth), "yyyy-MM-dd")
  }), [selectedMonth]);

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
      setTransactions(data);
      onTransactionsLoaded?.(data);
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
    return transactions.filter(t => 
      t.category.toLowerCase().includes(lowerQuery) ||
      (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
      t.amount.toString().includes(lowerQuery)
    );
  }, [transactions, searchQuery]);

  // Memoize grouped transactions
  const groupedByDate = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  if (loading) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="w-5 h-5 text-primary" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No transactions this month</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="border-border/50 shadow-lg animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Receipt className="w-5 h-5 text-primary" />
          Transactions ({filteredTransactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-3 sm:px-6">
        {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
          <div key={date} className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1">
              {format(new Date(date), "EEE, MMM d")}
            </p>
            <div className="space-y-3">
              {dayTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group relative flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-primary/20 hover:bg-accent/5 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                      transaction.type === "income"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {transaction.category}
                      </p>
                      <span className={`font-bold text-sm sm:text-base whitespace-nowrap ${
                        transaction.type === "income" ? "text-success" : "text-foreground"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toFixed(0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate max-w-[80%]">
                        {transaction.description || "No description"}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(transaction.id)}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredTransactions.length === 0 && transactions.length > 0 && (
           <div className="text-center py-8 text-muted-foreground">
             No transactions match your search.
           </div>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export const MonthlyTransactionList = memo(MonthlyTransactionListComponent);
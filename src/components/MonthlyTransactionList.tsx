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
}

const MonthlyTransactionListComponent = ({ userId, selectedMonth, onTransactionsLoaded }: MonthlyTransactionListProps) => {
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

  // Memoize grouped transactions
  const groupedByDate = useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);

  return (
    <>
    <Card className="border-border/50 shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Receipt className="w-5 h-5 text-primary" />
          Transactions ({transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
          <div key={date} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {format(new Date(date), "EEE, MMM d")}
            </p>
            <div className="space-y-2">
              {dayTransactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className="border-border/30 hover:border-primary/30 transition-all hover:shadow-md"
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            transaction.type === "income"
                              ? "bg-success/10"
                              : "bg-destructive/10"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                            {transaction.category}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-sm sm:text-base text-foreground">
                            ₹{transaction.amount.toFixed(0)}
                          </p>
                          <Badge
                            variant={transaction.type === "income" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {transaction.type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(transaction.id)}
                          className="hover:bg-destructive/10 hover:text-destructive rounded-full h-8 w-8 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
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
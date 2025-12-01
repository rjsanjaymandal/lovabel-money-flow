import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Receipt, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface SearchResultsProps {
  userId: string;
  searchQuery: string;
  onClose: () => void;
}

export function SearchResults({ userId, searchQuery, onClose }: SearchResultsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const query = searchQuery.toLowerCase();
      
      // We need to fetch all transactions and filter in memory or use complex OR logic
      // For simplicity and power, we'll fetch recent history (e.g. last 1000) or use Supabase text search if enabled
      // Here we'll use a broad select and client-side filter for maximum flexibility with the existing schema
      // In a production app with millions of rows, we'd use server-side full text search
      
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(500); // Limit to last 500 for performance

      if (data) {
        const filtered = data.filter(t => 
          t.category.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query)) ||
          t.amount.toString().includes(query)
        );
        setTransactions(filtered);
      }
      setLoading(false);
    };

    const debounce = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(debounce);
  }, [userId, searchQuery]);

  const stats = useMemo(() => {
    const count = transactions.length;
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return { count, total };
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="border-border/50 shadow-lg bg-card/40 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Searching history...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Smart Summary Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-purple-500/10 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Found {stats.count} transactions for "{searchQuery}"
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              ₹{stats.total.toLocaleString()}
            </h2>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-6 h-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="w-5 h-5 text-primary" />
            Results
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-muted-foreground hover:text-foreground">
            Clear Search
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found matching "{searchQuery}"
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="group relative flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-primary/20 hover:bg-accent/5 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
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
                      {transaction.description || "No description"} • {format(new Date(transaction.date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

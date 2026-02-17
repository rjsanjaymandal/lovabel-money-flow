import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ZenBackground } from "@/components/ZenBackground";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function AllTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchTransactions(user.id);
  };

  const fetchTransactions = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ZenBackground />
      <div className="relative z-10 p-4 md:p-8 pb-24 sm:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/5 border border-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                All Transactions
              </h1>
            </div>
          </div>

          <Card className="glass-card border-white/10 shadow-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              <div className="space-y-2">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">
                    Loading...
                  </p>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No transactions found</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <Card
                      key={transaction.id}
                      className="glass-card-interactive border-white/5 animate-fade-in group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12 ${
                                transaction.type === "income"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-rose-500/10 text-rose-500"
                              }`}
                            >
                              {transaction.type === "income" ? (
                                <TrendingUp className="w-6 h-6" />
                              ) : (
                                <TrendingDown className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-lg text-white">
                                {transaction.category}
                              </p>
                              {transaction.description && (
                                <p className="text-sm text-indigo-100/60">
                                  {transaction.description}
                                </p>
                              )}
                              <p className="text-xs text-indigo-100/40 mt-1">
                                {format(
                                  new Date(transaction.date),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xl font-bold ${
                                transaction.type === "income"
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}₹
                              {transaction.amount.toFixed(0)}
                            </p>
                            <Badge
                              variant="outline"
                              className={`mt-2 ${
                                transaction.type === "income"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                  : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                              }`}
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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

interface LendBorrowRecord {
  id: string;
  type: string;
  person_name: string;
  amount: number;
  description: string;
  date: string;
  status: string;
}

export default function AllLendBorrow() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<LendBorrowRecord[]>([]);
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
    fetchRecords(user.id);
  };

  const fetchRecords = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("lend_borrow")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (data) setRecords(data);
    setLoading(false);
  };

  const filteredRecords = records.filter(
    (r) =>
      r.person_name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()),
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
                Lend/Borrow History
              </h1>
            </div>
          </div>

          <Card className="glass-card border-white/10 shadow-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>Complete History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by person name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 transition-all text-white"
                />
              </div>

              <div className="space-y-2">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">
                    Loading...
                  </p>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No records found</p>
                  </div>
                ) : (
                  filteredRecords.map((record) => (
                    <Card
                      key={record.id}
                      className="glass-card-interactive border-white/5 animate-fade-in group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12 ${
                                record.type === "lent"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-rose-500/10 text-rose-500"
                              }`}
                            >
                              {record.type === "lent" ? (
                                <TrendingUp className="w-6 h-6" />
                              ) : (
                                <TrendingDown className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-lg text-white">
                                {record.person_name}
                              </p>
                              {record.description && (
                                <p className="text-sm text-indigo-100/60">
                                  {record.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-indigo-100/40">
                                  {format(new Date(record.date), "MMM d, yyyy")}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    record.type === "lent"
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                      : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                                  }`}
                                >
                                  {record.type === "lent" ? "Given" : "Taken"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xl font-bold ${
                                record.type === "lent"
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {record.type === "lent" ? "+" : "-"}₹
                              {record.amount.toFixed(0)}
                            </p>
                            <Badge
                              variant="outline"
                              className={`mt-2 ${
                                record.status === "pending"
                                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-600"
                                  : "border-green-500/30 bg-green-500/10 text-green-600"
                              }`}
                            >
                              {record.status}
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

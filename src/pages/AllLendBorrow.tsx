import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

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
    const { data: { user } } = await supabase.auth.getUser();
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
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">All Lend/Borrow Records</h1>
        </div>

        <Card className="gradient-card">
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
                className="pl-10 h-11"
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No records found</p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <Card key={record.id} className="hover:shadow-md transition-all animate-fade-in">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              record.type === "lent"
                                ? "gradient-success"
                                : "gradient-accent"
                            }`}
                          >
                            {record.type === "lent" ? (
                              <TrendingUp className="w-6 h-6 text-white" />
                            ) : (
                              <TrendingDown className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{record.person_name}</p>
                            {record.description && (
                              <p className="text-sm text-muted-foreground">
                                {record.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(record.date), "MMM d, yyyy")}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  record.type === "lent"
                                    ? "border-success/30 bg-success/10 text-success"
                                    : "border-accent/30 bg-accent/10 text-accent"
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
                                ? "text-success"
                                : "text-accent"
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
  );
}

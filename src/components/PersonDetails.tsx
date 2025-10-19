import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpRight, ArrowDownRight, CheckCircle, Trash2 } from "lucide-react";
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

interface PersonDetailsProps {
  personName: string;
  userId: string;
}

export const PersonDetails = ({ personName, userId }: PersonDetailsProps) => {
  const [records, setRecords] = useState<LendBorrowRecord[]>([]);
  const [quickAddForm, setQuickAddForm] = useState({ amount: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (userId && personName) {
      fetchRecords();
    }
  }, [userId, personName]);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("lend_borrow")
      .select("*")
      .eq("user_id", userId)
      .eq("person_name", personName)
      .order("date", { ascending: false });

    if (data) setRecords(data);
  };

  const handleQuickAdd = async (type: "lent" | "borrowed") => {
    if (!quickAddForm.amount) {
      toast({
        title: "Error",
        description: "Please enter an amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("lend_borrow").insert({
        user_id: user.id,
        type,
        person_name: personName,
        amount: parseFloat(quickAddForm.amount),
        description: quickAddForm.description || null,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Transaction added successfully.`,
      });

      setQuickAddForm({ amount: "", description: "" });
      fetchRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSettle = async (id: string) => {
    const { error } = await supabase
      .from("lend_borrow")
      .update({ status: "settled" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settled!",
        description: "Transaction marked as settled.",
      });
      fetchRecords();
    }
  };

  const handleClearAll = async () => {
    const pendingIds = records.filter((r) => r.status === "pending").map((r) => r.id);

    if (pendingIds.length === 0) {
      toast({
        title: "Info",
        description: "No pending transactions to clear.",
      });
      return;
    }

    const { error } = await supabase
      .from("lend_borrow")
      .update({ status: "settled" })
      .in("id", pendingIds);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "All Cleared!",
        description: `All transactions with ${personName} have been settled.`,
      });
      fetchRecords();
    }
  };

  const pendingRecords = records.filter((r) => r.status === "pending");
  const settledRecords = records.filter((r) => r.status === "settled");

  const netBalance = pendingRecords.reduce((sum, r) => {
    return sum + (r.type === "lent" ? r.amount : -r.amount);
  }, 0);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header with Balance */}
      <Card className={netBalance >= 0 ? "bg-gradient-to-br from-success/10 to-success/5" : "bg-gradient-to-br from-accent/10 to-accent/5"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{personName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Net Balance</p>
            </div>
            {pendingRecords.length > 0 && (
              <Button size="sm" variant="destructive" onClick={handleClearAll}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <p className={`text-4xl font-bold ${netBalance >= 0 ? "text-success" : "text-accent"}`}>
              ₹{Math.abs(netBalance).toFixed(2)}
            </p>
            <Badge variant="outline" className="text-sm">
              {netBalance >= 0 ? "You'll Get" : "You Owe"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                placeholder="0.00"
                type="number"
                step="0.01"
                value={quickAddForm.amount}
                onChange={(e) => setQuickAddForm({ ...quickAddForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional"
                value={quickAddForm.description}
                onChange={(e) => setQuickAddForm({ ...quickAddForm, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-success hover:bg-success/90"
              onClick={() => handleQuickAdd("lent")}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Given
            </Button>
            <Button
              className="flex-1 bg-accent hover:bg-accent/90"
              onClick={() => handleQuickAdd("borrowed")}
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Taken
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="flex-1 overflow-auto space-y-4">
        {pendingRecords.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Pending Transactions</h3>
            <div className="space-y-2">
              {pendingRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            record.type === "lent" ? "bg-success/10" : "bg-accent/10"
                          }`}
                        >
                          {record.type === "lent" ? (
                            <ArrowUpRight className="w-5 h-5 text-success" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={record.type === "lent" ? "default" : "secondary"} className={record.type === "lent" ? "bg-success" : "bg-accent"}>
                              {record.type === "lent" ? "Given" : "Taken"}
                            </Badge>
                            {record.description && (
                              <p className="text-sm text-muted-foreground">{record.description}</p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(record.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-lg font-bold ${record.type === "lent" ? "text-success" : "text-accent"}`}>
                          {record.type === "lent" ? "+" : "-"}₹{record.amount.toFixed(2)}
                        </p>
                        <Button size="sm" variant="outline" onClick={() => handleSettle(record.id)}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Settle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {settledRecords.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Settled Transactions</h3>
            <div className="space-y-2 opacity-60">
              {settledRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                          <CheckCircle className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {record.type === "lent" ? "Given" : "Taken"}
                            </Badge>
                            {record.description && (
                              <p className="text-sm text-muted-foreground">{record.description}</p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(record.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-muted-foreground">
                          {record.type === "lent" ? "+" : "-"}₹{record.amount.toFixed(2)}
                        </p>
                        <Badge variant="secondary">Settled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {records.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No transactions yet. Add your first transaction above!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

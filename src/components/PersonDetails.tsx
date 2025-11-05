import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpRight, ArrowDownRight, CheckCircle, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { getSafeErrorMessage } from "@/lib/error-handler";

const amountSchema = z.number()
  .positive({ message: "Amount must be greater than zero" })
  .finite({ message: "Amount must be a valid number" })
  .max(99999999.99, { message: "Amount is too large" });

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
        title: "Oops! ⚠️",
        description: "Please enter an amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate amount
      const parsedAmount = parseFloat(quickAddForm.amount);
      const validationResult = amountSchema.safeParse(parsedAmount);
      
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
      }

      const { error } = await supabase.from("lend_borrow").insert({
        user_id: user.id,
        type,
        person_name: personName,
        amount: validationResult.data,
        description: quickAddForm.description || null,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: `Transaction added successfully.`,
      });

      setQuickAddForm({ amount: "", description: "" });
      fetchRecords();
    } catch (error: any) {
      const message = error.message.includes("Amount") 
        ? error.message 
        : "Unable to add transaction. Please try again.";
      toast({
        title: "Error",
        description: message,
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
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settled! ✅",
        description: "Transaction marked as settled.",
      });
      fetchRecords();
    }
  };

  const handleClearAll = async () => {
    const pendingIds = records.filter((r) => r.status === "pending").map((r) => r.id);

    if (pendingIds.length === 0) {
      toast({
        title: "All Clear! ✨",
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
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "All Cleared! 🎊",
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
    <div className="space-y-3 sm:space-y-4 md:space-y-6 h-full flex flex-col animate-fade-in">
      {/* Mobile-optimized Balance Card */}
      <Card className={`border-2 shadow-lg overflow-hidden relative ${netBalance >= 0 ? 'border-success/20' : 'border-accent/20'}`}>
        <div className={`absolute inset-0 ${netBalance >= 0 ? 'gradient-success' : 'gradient-accent'} opacity-5`} />
        <CardHeader className="relative pb-3 sm:pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">{personName}</span>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
              </CardTitle>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Net Balance</p>
            </div>
            {pendingRecords.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={handleClearAll} 
                className="hover:scale-105 transition-transform touch-manipulation h-8 text-xs sm:h-9 sm:text-sm"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Clear All</span>
                <span className="xs:hidden">Clear</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative pt-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <p className={`text-3xl sm:text-4xl md:text-5xl font-bold ${netBalance >= 0 ? "text-success" : "text-accent"}`}>
              ₹{Math.abs(netBalance).toFixed(2)}
            </p>
            <Badge 
              variant="outline" 
              className={`text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-semibold ${
                netBalance >= 0 
                  ? 'border-success bg-success/10 text-success' 
                  : 'border-accent bg-accent/10 text-accent'
              }`}
            >
              {netBalance >= 0 ? "You'll Get 💰" : "You Owe 💸"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-optimized Quick Add Form */}
      <Card className="border-2 shadow-md animate-scale-in">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-1.5 sm:gap-2">
            Quick Add Transaction ⚡
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="amount" className="text-xs sm:text-sm font-semibold">Amount (₹)</Label>
              <Input
                id="amount"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0.01"
                max="99999999.99"
                value={quickAddForm.amount}
                onChange={(e) => setQuickAddForm({ ...quickAddForm, amount: e.target.value })}
                className="h-11 sm:h-12 text-base sm:text-lg touch-manipulation"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm font-semibold">Description</Label>
              <Input
                id="description"
                placeholder="What's this for?"
                maxLength={500}
                value={quickAddForm.description}
                onChange={(e) => setQuickAddForm({ ...quickAddForm, description: e.target.value })}
                className="h-11 sm:h-12 touch-manipulation"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button
              className="h-12 sm:h-13 gradient-success hover:opacity-90 transition-all hover:scale-105 active:scale-95 text-white font-semibold touch-manipulation text-sm sm:text-base"
              onClick={() => handleQuickAdd("lent")}
            >
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Given
            </Button>
            <Button
              className="h-12 sm:h-13 gradient-accent hover:opacity-90 transition-all hover:scale-105 active:scale-95 text-white font-semibold touch-manipulation text-sm sm:text-base"
              onClick={() => handleQuickAdd("borrowed")}
            >
              <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Taken
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-optimized Transactions List */}
      <div className="flex-1 overflow-auto space-y-3 sm:space-y-4">
        {pendingRecords.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-1.5 sm:gap-2">
              Pending Transactions
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {pendingRecords.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {pendingRecords.map((record, index) => (
                <Card key={record.id} className="hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    borderLeftColor: record.type === "lent" ? "hsl(142 76% 36%)" : "hsl(17 88% 62%)",
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      {/* Top row: icon, badge, description */}
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            record.type === "lent" ? "gradient-success" : "gradient-accent"
                          }`}
                        >
                          {record.type === "lent" ? (
                            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge 
                            variant="outline" 
                            className={`font-semibold text-[10px] sm:text-xs mb-1 ${
                              record.type === "lent" 
                                ? "border-success bg-success/10 text-success" 
                                : "border-accent bg-accent/10 text-accent"
                            }`}
                          >
                            {record.type === "lent" ? "Given 📤" : "Taken 📥"}
                          </Badge>
                          {record.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{record.description}</p>
                          )}
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            {format(new Date(record.date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      
                      {/* Bottom row: amount and settle button */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        <p className={`text-lg sm:text-xl font-bold ${record.type === "lent" ? "text-success" : "text-accent"}`}>
                          {record.type === "lent" ? "+" : "-"}₹{record.amount.toFixed(2)}
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSettle(record.id)} 
                          className="hover:scale-105 active:scale-95 transition-transform touch-manipulation h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
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
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-1.5 sm:gap-2">
              Settled Transactions ✅
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {settledRecords.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {settledRecords.map((record) => (
                <Card key={record.id} className="opacity-60 hover:opacity-80 transition-opacity">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-muted flex-shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {record.type === "lent" ? "Given" : "Taken"}
                          </Badge>
                          {record.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{record.description}</p>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm sm:text-base font-semibold text-muted-foreground whitespace-nowrap">
                          {record.type === "lent" ? "+" : "-"}₹{record.amount.toFixed(2)}
                        </p>
                        <Badge variant="secondary" className="text-[9px] sm:text-xs">Settled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {records.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 sm:p-12 text-center space-y-2 sm:space-y-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-muted-foreground">No transactions yet</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Add your first transaction above to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

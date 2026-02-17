import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Trash2,
  Sparkles,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { getSafeErrorMessage } from "@/lib/error-handler";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const amountSchema = z
  .number()
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
  const [quickAddForm, setQuickAddForm] = useState({
    amount: "",
    description: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const playHaptic = useCallback(() => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  }, []);

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
    playHaptic();
    if (!quickAddForm.amount) {
      toast({
        title: "Oops! ⚠️",
        description: "Please enter an amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.includes("Amount")
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
    playHaptic();
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
    playHaptic();
    const pendingIds = records
      .filter((r) => r.status === "pending")
      .map((r) => r.id);

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
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-24">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4 px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            playHaptic();
            navigate(-1);
          }}
          className="rounded-2xl w-12 h-12 bg-white/5 border border-white/5 active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Button>
        <div>
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            {personName}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Transaction History
          </p>
        </div>
      </div>

      {/* Mobile-optimized Balance Card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[3rem] p-8 border backdrop-blur-3xl shadow-2xl transition-all duration-500",
          netBalance >= 0
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-rose-500/10 border-rose-500/20",
        )}
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>

        <div className="relative flex flex-col items-center text-center space-y-4">
          <Badge
            variant="outline"
            className={cn(
              "px-4 py-1.5 rounded-full border-2 font-black text-[10px] tracking-widest uppercase",
              netBalance >= 0
                ? "border-emerald-500/30 text-emerald-500"
                : "border-rose-500/30 text-rose-500",
            )}
          >
            {netBalance >= 0 ? "Receivable 💰" : "Payable 💸"}
          </Badge>

          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
              Net Balance
            </p>
            <p
              className={cn(
                "text-5xl sm:text-6xl font-black tracking-tighter tabular-nums",
                netBalance >= 0 ? "text-emerald-500" : "text-rose-500",
              )}
            >
              ₹{Math.abs(netBalance).toLocaleString()}
            </p>
          </div>

          {pendingRecords.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClearAll}
              className="rounded-2xl h-11 px-6 font-black tracking-tight shadow-xl shadow-rose-500/20 active:scale-95 transition-all text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Settle Entire Account
            </Button>
          )}
        </div>
      </div>

      {/* Mobile-optimized Quick Add Form */}
      <div className="rounded-[2.5rem] bg-white/5 border border-white/5 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
            ⚡
          </div>
          <h3 className="text-xl font-black tracking-tight">Quick Add</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/60"
            >
              Amount (₹)
            </Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              value={quickAddForm.amount}
              onChange={(e) =>
                setQuickAddForm({ ...quickAddForm, amount: e.target.value })
              }
              className="h-14 text-2xl font-black bg-white/5 border-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 tabular-nums px-5"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/60"
            >
              Note
            </Label>
            <Input
              id="description"
              placeholder="Ex: Dinner, Fuel, Rent..."
              value={quickAddForm.description}
              onChange={(e) =>
                setQuickAddForm({
                  ...quickAddForm,
                  description: e.target.value,
                })
              }
              className="h-14 bg-white/5 border-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 px-5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-14 rounded-2xl bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            onClick={() => handleQuickAdd("lent")}
          >
            <ArrowUpRight className="w-5 h-5 mr-1" />
            LENT
          </Button>
          <Button
            className="h-14 rounded-2xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            onClick={() => handleQuickAdd("borrowed")}
          >
            <ArrowDownRight className="w-5 h-5 mr-1" />
            TAKEN
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {pendingRecords.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black tracking-tight px-2">
                Pending Transactions ({pendingRecords.length})
              </h3>
              <div className="space-y-3">
                {pendingRecords.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="relative group p-4 rounded-3xl bg-background/40 backdrop-blur-3xl border border-white/5 shadow-lg flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                          record.type === "lent"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-emerald-500/10 text-emerald-500",
                        )}
                      >
                        {record.type === "lent" ? (
                          <ArrowUpRight className="w-6 h-6" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground truncate">
                          {record.description ||
                            (record.type === "lent"
                              ? "Money Given"
                              : "Money Taken")}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p
                        className={cn(
                          "text-lg font-black tracking-tighter tabular-nums",
                          record.type === "lent"
                            ? "text-rose-500"
                            : "text-emerald-500",
                        )}
                      >
                        ₹{record.amount.toFixed(0)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSettle(record.id)}
                        className="h-8 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-3 border border-white/5"
                      >
                        Settle
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {settledRecords.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-black tracking-tight px-2 text-muted-foreground/60">
                Settled Account
              </h3>
              <div className="space-y-3 opacity-60">
                {settledRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        <CheckCircle className="w-5 h-5 opacity-40" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground line-through">
                          {record.description || "Transaction"}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground/40">
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-muted-foreground tabular-nums opacity-40">
                      ₹{record.amount.toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {records.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-white/5 rounded-[3rem] border border-dashed border-white/10 mx-2">
            <div className="w-16 h-16 rounded-3xl bg-white/5 mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-bold text-muted-foreground/40">
              No activity yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

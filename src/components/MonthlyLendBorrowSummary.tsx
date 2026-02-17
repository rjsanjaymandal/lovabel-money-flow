import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandCoins, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useNavigate } from "react-router-dom";

interface MonthlyLendBorrowSummaryProps {
  userId: string;
  selectedMonth: Date;
}

const MonthlyLendBorrowSummaryComponent = ({
  userId,
  selectedMonth,
}: MonthlyLendBorrowSummaryProps) => {
  const [monthlyLent, setMonthlyLent] = useState(0);
  const [monthlyBorrowed, setMonthlyBorrowed] = useState(0);
  const [totalPending, setTotalPending] = useState({ lent: 0, borrowed: 0 });
  const navigate = useNavigate();

  // Memoize date range
  const dateRange = useMemo(
    () => ({
      startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
      endDate: format(endOfMonth(selectedMonth), "yyyy-MM-dd"),
    }),
    [selectedMonth],
  );

  const fetchMonthlyData = useCallback(async () => {
    const { startDate, endDate } = dateRange;

    // Monthly data
    const { data: monthlyData } = await supabase
      .from("lend_borrow")
      .select("type, amount")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (monthlyData) {
      const lent = monthlyData
        .filter((r) => r.type === "lent")
        .reduce((sum, r) => sum + r.amount, 0);
      const borrowed = monthlyData
        .filter((r) => r.type === "borrowed")
        .reduce((sum, r) => sum + r.amount, 0);
      setMonthlyLent(lent);
      setMonthlyBorrowed(borrowed);
    }

    // All-time pending
    const { data: allData } = await supabase
      .from("lend_borrow")
      .select("type, amount, status")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (allData) {
      const pendingLent = allData
        .filter((r) => r.type === "lent")
        .reduce((sum, r) => sum + r.amount, 0);
      const pendingBorrowed = allData
        .filter((r) => r.type === "borrowed")
        .reduce((sum, r) => sum + r.amount, 0);
      setTotalPending({ lent: pendingLent, borrowed: pendingBorrowed });
    }
  }, [userId, dateRange]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] bg-background/40 backdrop-blur-3xl border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-50" />

      <div className="relative p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-foreground">
                Lend & Borrow
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Status Overview
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard?tab=lend")}
            className="rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            View Detail
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between group/item transition-colors hover:bg-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 group-hover/item:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest leading-none mb-1">
                  Receivable
                </p>
                <p className="text-sm font-bold text-foreground/80">
                  Owed to you
                </p>
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-500 tabular-nums">
              ₹{totalPending.lent.toFixed(0)}
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between group/item transition-colors hover:bg-rose-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/20 group-hover/item:scale-110 transition-transform">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest leading-none mb-1">
                  Payable
                </p>
                <p className="text-sm font-bold text-foreground/80">You owe</p>
              </div>
            </div>
            <span className="text-2xl font-black text-rose-500 tabular-nums">
              ₹{totalPending.borrowed.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">
              Lent This Month
            </p>
            <p className="text-base font-black text-foreground/90">
              ₹{monthlyLent.toFixed(0)}
            </p>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="flex-1 text-right">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">
              Borrowed This Month
            </p>
            <p className="text-base font-black text-foreground/90">
              ₹{monthlyBorrowed.toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MonthlyLendBorrowSummary = memo(MonthlyLendBorrowSummaryComponent);

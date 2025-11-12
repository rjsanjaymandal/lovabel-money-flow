import { useState, useEffect } from "react";
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

export const MonthlyLendBorrowSummary = ({ userId, selectedMonth }: MonthlyLendBorrowSummaryProps) => {
  const [monthlyLent, setMonthlyLent] = useState(0);
  const [monthlyBorrowed, setMonthlyBorrowed] = useState(0);
  const [totalPending, setTotalPending] = useState({ lent: 0, borrowed: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMonthlyData();
  }, [userId, selectedMonth]);

  const fetchMonthlyData = async () => {
    const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

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
  };

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            Lend & Borrow
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard?tab=lend")}
            className="gap-1 text-xs"
          >
            <Eye className="w-3 h-3" />
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-foreground">You'll Receive</span>
            </div>
            <span className="text-lg font-bold text-success">₹{totalPending.lent.toFixed(0)}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-foreground">You Owe</span>
            </div>
            <span className="text-lg font-bold text-destructive">₹{totalPending.borrowed.toFixed(0)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            This Month
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Lent</p>
              <p className="font-semibold text-foreground">₹{monthlyLent.toFixed(0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Borrowed</p>
              <p className="font-semibold text-foreground">₹{monthlyBorrowed.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
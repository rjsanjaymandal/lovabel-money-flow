import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const SpendingChart = ({ userId }: { userId: string }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      fetchChartData();
    }
  }, [userId]);

  const fetchChartData = async () => {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId);

    if (!transactions) return;

    // Group by category
    const categoryMap = new Map();
    transactions.forEach((t) => {
      const existing = categoryMap.get(t.category) || { income: 0, expense: 0 };
      if (t.type === "income") {
        existing.income += t.amount;
      } else {
        existing.expense += t.amount;
      }
      categoryMap.set(t.category, existing);
    });

    const data = Array.from(categoryMap.entries())
      .map(([category, values]: [string, any]) => ({
        category,
        income: values.income,
        expense: values.expense,
      }))
      .sort((a, b) => b.expense - a.expense)
      .slice(0, 8);

    setChartData(data);
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Add transactions to see your spending overview
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Bar dataKey="income" fill="hsl(var(--success))" name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="hsl(var(--accent))" name="Expenses" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

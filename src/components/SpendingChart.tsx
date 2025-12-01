import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const SpendingChart = ({ userId, selectedMonth }: { userId: string; selectedMonth: Date }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (userId && selectedMonth) {
      fetchChartData();
    }
  }, [userId, selectedMonth]);

  const fetchChartData = async () => {
    const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

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
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis 
          dataKey="category" 
          angle={-45} 
          textAnchor="end" 
          height={80} 
          fontSize={10} 
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          fontSize={10} 
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
          contentStyle={{
            backgroundColor: "hsl(var(--card)/0.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid hsl(var(--border)/0.5)",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          itemStyle={{ fontSize: '12px', fontWeight: 500 }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        <Bar 
          dataKey="income" 
          fill="#10b981" 
          name="Income" 
          radius={[4, 4, 0, 0]} 
          maxBarSize={40}
        />
        <Bar 
          dataKey="expense" 
          fill="#f43f5e" 
          name="Expenses" 
          radius={[4, 4, 0, 0]} 
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

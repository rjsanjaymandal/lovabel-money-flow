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
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="category" 
          angle={-45} 
          textAnchor="end" 
          height={80} 
          fontSize={10} 
          tick={{ fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(12px)",
            border: "none",
            borderRadius: "16px",
            color: "#fff",
            padding: "12px"
          }}
          itemStyle={{ fontSize: '12px', fontWeight: 500 }}
        />
        <Bar 
          dataKey="income" 
          fill="url(#incomeGradient)" 
          name="Income" 
          radius={[8, 8, 8, 8]} 
          maxBarSize={32}
        />
        <Bar 
          dataKey="expense" 
          fill="url(#expenseGradient)" 
          name="Expenses" 
          radius={[8, 8, 8, 8]} 
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

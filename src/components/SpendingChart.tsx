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
    <div className="rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-soft-light" />
      <div className="relative z-10 w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="category" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              dy={10}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                color: "#fff",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)"
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 500 }}
            />
            <Bar 
              dataKey="income" 
              fill="url(#incomeGradient)" 
              radius={[6, 6, 6, 6]} 
              maxBarSize={40}
            />
            <Bar 
              dataKey="expense" 
              fill="url(#expenseGradient)" 
              radius={[6, 6, 6, 6]} 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

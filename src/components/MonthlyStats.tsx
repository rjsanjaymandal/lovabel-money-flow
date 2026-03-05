import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { MobileStats } from "./MobileStats";

interface MonthlyStatsProps {
  income: number;
  expenses: number;
  balance: number;
  userName?: string;
}

export const MonthlyStats = ({
  income,
  expenses,
  balance,
}: MonthlyStatsProps) => {
  return (
    <>
      <MobileStats income={income} expenses={expenses} balance={balance} />
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card - Feature */}
        <div className="md:col-span-1 relative overflow-hidden rounded-[2.5rem] p-8 text-white group transition-all duration-500 hover:scale-[1.02] shadow-[0_20px_50px_rgba(124,58,237,0.3)] gradient-primary-vibrant">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-soft-light" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 blur-3xl rounded-full translate-x-10 -translate-y-10" />

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-inner">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-xs font-bold tracking-widest uppercase">
                Net Worth
              </div>
            </div>

            <div>
              <p className="text-white/70 text-sm font-bold tracking-widest uppercase mb-1">
                Total Balance
              </p>
              <h3 className="text-4xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-md">
                ₹{balance.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {/* Income & Expense Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          {/* Income */}
          <div className="relative overflow-hidden glass-card-interactive p-8 group shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-all duration-500">
              <TrendingUp className="w-32 h-32 text-emerald-400 -rotate-12 translate-x-4 -translate-y-4" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                  Total Income
                </span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tighter mt-4 drop-shadow-sm">
                  ₹{income.toLocaleString()}
                </h3>
                <p className="text-xs text-white/30 mt-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold uppercase tracking-widest">Growth Stream</span>
                </p>
              </div>
            </div>
          </div>

          {/* Expense */}
          <div className="relative overflow-hidden glass-card-interactive p-8 group shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-all duration-500">
              <TrendingDown className="w-32 h-32 text-rose-400 rotate-12 translate-x-4 -translate-y-4" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                  Total Expenses
                </span>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-black text-rose-400 tracking-tighter mt-4 drop-shadow-sm">
                  ₹{expenses.toLocaleString()}
                </h3>
                <p className="text-xs text-white/30 mt-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span className="font-bold uppercase tracking-widest">Monthly Burn</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

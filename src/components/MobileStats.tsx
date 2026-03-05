import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface MobileStatsProps {
  income: number;
  expenses: number;
  balance: number;
}

export const MobileStats = ({
  income,
  expenses,
  balance,
}: MobileStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:hidden px-2">
      {/* Balance Card - Span 2 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="col-span-2 relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-2xl gradient-primary-vibrant"
      >
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-soft-light" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full translate-x-12 -translate-y-12" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="p-2.5 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              Accounts
            </span>
          </div>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
            Total Balance
          </p>
          <h3 className="text-4xl font-black tracking-tighter drop-shadow-lg">
            ₹{balance.toLocaleString()}
          </h3>
        </div>
      </motion.div>

      {/* Income Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden glass-card p-5 border border-emerald-500/20 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-inner">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            Income
          </span>
        </div>
        <h4 className="text-2xl font-black text-emerald-500 tracking-tighter">
          ₹{income.toLocaleString()}
        </h4>
      </motion.div>

      {/* Expense Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden glass-card p-5 border border-rose-500/20 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10 shadow-inner">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
            Spent
          </span>
        </div>
        <h4 className="text-2xl font-black text-rose-500 tracking-tighter">
          ₹{expenses.toLocaleString()}
        </h4>
      </motion.div>
    </div>

  );
};

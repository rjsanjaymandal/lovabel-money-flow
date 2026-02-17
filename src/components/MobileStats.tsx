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
    <div className="grid grid-cols-2 gap-3 sm:hidden px-1">
      {/* Balance Card - Span 2 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 relative overflow-hidden rounded-[2rem] p-5 text-white shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full translate-x-12 -translate-y-12" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Available
            </span>
          </div>
          <p className="text-white/70 text-[10px] font-medium uppercase tracking-widest mb-0.5">
            Total Balance
          </p>
          <h3 className="text-3xl font-black tracking-tight">
            ₹{balance.toLocaleString()}
          </h3>
        </div>
      </motion.div>

      {/* Income Card */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-[1.8rem] p-4 bg-emerald-500/10 border border-emerald-500/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-xs font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Income
          </span>
        </div>
        <h4 className="text-xl font-bold text-emerald-600 tracking-tight">
          ₹{income.toLocaleString()}
        </h4>
      </motion.div>

      {/* Expense Card */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-[1.8rem] p-4 bg-rose-500/10 border border-rose-500/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500 text-xs font-bold">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
            Spent
          </span>
        </div>
        <h4 className="text-xl font-bold text-rose-600 tracking-tight">
          ₹{expenses.toLocaleString()}
        </h4>
      </motion.div>
    </div>
  );
};

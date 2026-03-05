import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, AlertCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface BudgetCardProps {
  userId: string;
  selectedMonth: Date;
  totalExpenses: number;
  budget?: number;
}

export const BudgetCard = ({ userId, selectedMonth, totalExpenses, budget = 0 }: BudgetCardProps) => {
  const navigate = useNavigate();
  const percentage = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage > 80 && percentage <= 100;

  return (
    <Card className="glass-card-interactive border-white/5 bg-white/[0.02] overflow-hidden">
      <CardHeader className="pb-4 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16" />
        <CardTitle className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 rounded-2xl border border-violet-500/20 shadow-inner">
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-black text-white/70 uppercase tracking-[0.2em]">Budget Status</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
            onClick={() => navigate("/dashboard?tab=budget")}
          >
            Adjust
            <ArrowRight className="w-3.5 h-3.5 ml-2 opacity-50" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white/30 uppercase tracking-widest">Target limit</p>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
              ₹{budget.toLocaleString()}
            </p>
          </div>
          {budget > 0 && (
            <div className={`px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-[0.2em] ${isOverBudget ? "bg-rose-500/20 text-rose-400 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"}`}>
              {percentage.toFixed(0)}% Utilized
            </div>
          )}
        </div>

        {budget > 0 ? (
          <div className="space-y-6">
            {/* Premium Progress Bar */}
            <div className="relative pt-2">
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className={`h-full rounded-full relative ${isOverBudget
                    ? "gradient-error-vibrant"
                    : isNearLimit
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      : "bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                    }`}
                >
                  <div className="absolute inset-0 bg-white/20 mix-blend-overlay opacity-50" />
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-[2rem] bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Spent Today</span>
                <p className={`text-lg font-black tracking-tight ${isOverBudget ? "text-rose-400" : "text-white"}`}>
                  ₹{totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-[2rem] bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Available</span>
                <p className="text-lg font-black tracking-tight text-white/90">
                  ₹{Math.max(0, budget - totalExpenses).toLocaleString()}
                </p>
              </div>
            </div>

            {(isOverBudget || isNearLimit) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-4 rounded-[1.8rem] border ${isOverBudget
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_10px_30px_rgba(244,63,94,0.1)]"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.1)]"
                  }`}
              >
                <div className={`p-2 rounded-xl ${isOverBudget ? "bg-rose-500/20" : "bg-amber-500/20"}`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest leading-none">
                  {isOverBudget
                    ? `Over by ₹${(totalExpenses - budget).toLocaleString()}`
                    : "Approaching Limit"}
                </span>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 px-4 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]">
            <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">No budget signals detected</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6"
              onClick={() => navigate("/dashboard?tab=budget")}
            >
              Initialize Target
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
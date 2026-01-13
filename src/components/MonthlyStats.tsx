import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface MonthlyStatsProps {
  income: number;
  expenses: number;
  balance: number;
  userName?: string;
}

export const MonthlyStats = ({ income, expenses, balance }: MonthlyStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Balance Card - Feature */}
      <div className="md:col-span-1 relative overflow-hidden rounded-[2rem] p-6 text-white group transition-all duration-300 hover:scale-[1.02] shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 opacity-100" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-soft-light" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
        
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
          <div className="flex justify-between items-start">
             <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
               <Wallet className="w-5 h-5 text-white" />
             </div>
             <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium tracking-wide">
                Current
             </div>
          </div>
          
          <div>
            <p className="text-indigo-100/80 text-sm font-medium tracking-wide mb-1">Total Balance</p>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
              ₹{balance.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* Income & Expense Cards */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        {/* Income */}
        <div className="relative overflow-hidden rounded-[2rem] p-6 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] group shadow-lg">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24 text-emerald-500 -rotate-12 translate-x-4 -translate-y-4" />
           </div>
           
           <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
             <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                 <ArrowUpRight className="w-5 h-5" />
               </div>
               <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Income</span>
             </div>
             
             <div>
               <h3 className="text-2xl sm:text-3xl font-bold text-emerald-500 tracking-tight mt-4">
                 ₹{income.toLocaleString()}
               </h3>
               <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                 <Activity className="w-3 h-3 text-emerald-500" />
                 <span className="text-emerald-500/80">Active Stream</span>
               </p>
             </div>
           </div>
        </div>

        {/* Expense */}
        <div className="relative overflow-hidden rounded-[2rem] p-6 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] group shadow-lg">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown className="w-24 h-24 text-rose-500 rotate-12 translate-x-4 -translate-y-4" />
           </div>
           
           <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
             <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                 <ArrowDownRight className="w-5 h-5" />
               </div>
               <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expenses</span>
             </div>
             
             <div>
               <h3 className="text-2xl sm:text-3xl font-bold text-rose-500 tracking-tight mt-4">
                 ₹{expenses.toLocaleString()}
               </h3>
               <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                 <Activity className="w-3 h-3 text-rose-500" />
                 <span className="text-rose-500/80">Monthly Outflow</span>
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
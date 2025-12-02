import { useNavigate, useLocation } from "react-router-dom";
import { Receipt, HandCoins, LayoutGrid, User, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { useState } from "react";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  // Get current tab from URL
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'spend';

  const isSpend = location.pathname === "/dashboard" && currentTab === "spend";
  const isBudget = location.pathname === "/dashboard" && currentTab === "budget";
  const isLend = location.pathname === "/dashboard" && currentTab === "lend";
  const isTransactionsPage = location.pathname === "/transactions";
  const isLendBorrowPage = location.pathname === "/lend-borrow";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isMonthly = location.pathname === "/monthly";

  const navItems = [
    {
      icon: Receipt,
      label: "Spends",
      isActive: isSpend,
      onClick: () => navigate("/dashboard?tab=spend"),
    },
    {
      icon: Target,
      label: "Budget",
      isActive: isBudget,
      onClick: () => navigate("/dashboard?tab=budget"),
    },
    {
      icon: HandCoins,
      label: "Lend",
      isActive: isLend,
      onClick: () => navigate("/dashboard?tab=lend"),
    },
  ];

  // Only hide on auth and index pages
  if (location.pathname === "/auth" || location.pathname === "/") {
    return null;
  }

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50 sm:hidden">
      <div className="glass-panel rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-primary/10 border border-white/20 backdrop-blur-2xl bg-white/80">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all duration-300 touch-manipulation rounded-xl ${
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              item.isActive ? "bg-primary/10 scale-110" : "scale-100"
            }`}>
              <item.icon className={`h-5 w-5 transition-all duration-300 ${
                item.isActive ? "stroke-[2.5px]" : "stroke-2"
              }`} />
            </div>
            <span className={`text-[10px] font-medium transition-all duration-300 ${
              item.isActive ? "opacity-100 font-semibold" : "opacity-60"
            }`}>
              {item.label}
            </span>
          </button>
        ))}

        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetTrigger asChild>
            <button
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground touch-manipulation hover:bg-black/5 transition-all duration-300 rounded-xl"
            >
              <div className="p-2 rounded-xl">
                <User className="h-5 w-5 stroke-2" />
              </div>
              <span className="text-[10px] font-medium opacity-60">Profile</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-safe rounded-t-[2rem] border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            <SheetHeader className="mb-6">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
              <SheetTitle className="text-center text-xl font-bold">
                Profile & Settings
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-14 text-base font-medium rounded-2xl border-muted hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/transactions");
                }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-primary" />
                </div>
                All Transactions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-14 text-base font-medium rounded-2xl border-muted hover:bg-accent/5 hover:border-accent/20 hover:text-accent transition-all"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/lend-borrow");
                }}
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <HandCoins className="h-4 w-4 text-accent" />
                </div>
                All Lend/Borrow
              </Button>
              <div className="h-px bg-border my-2" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 text-base font-medium rounded-2xl hover:bg-muted transition-all"
                onClick={() => {
                  setProfileOpen(false);
                }}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Settings className="h-4 w-4" />
                </div>
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 text-base font-medium rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                onClick={handleSignOut}
              >
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <LogOut className="h-4 w-4" />
                </div>
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

import { useNavigate, useLocation } from "react-router-dom";
import { Receipt, HandCoins, LayoutGrid, User } from "lucide-react";
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

  const isTransactions = location.pathname === "/dashboard" && !location.search.includes("lending");
  const isLending = location.pathname === "/dashboard" && location.search.includes("lending");
  const isTransactionsPage = location.pathname === "/transactions";
  const isLendBorrowPage = location.pathname === "/lend-borrow";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navItems = [
    {
      icon: Receipt,
      label: "Spend",
      isActive: isTransactions,
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: HandCoins,
      label: "Lend",
      isActive: isLending,
      onClick: () => navigate("/dashboard?tab=lending"),
    },
    {
      icon: LayoutGrid,
      label: "All",
      isActive: isTransactionsPage || isLendBorrowPage,
      onClick: () => navigate("/transactions"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/98 backdrop-blur-lg border-t border-border/50 sm:hidden pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 h-16 px-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`relative flex flex-col items-center justify-center gap-0.5 transition-all touch-manipulation ${
              item.isActive
                ? "text-primary"
                : "text-muted-foreground active:scale-95"
            }`}
          >
            <div className={`rounded-full p-1.5 transition-colors ${
              item.isActive ? "bg-primary/10" : ""
            }`}>
              <item.icon className={`h-5 w-5 transition-transform ${
                item.isActive ? "scale-110" : ""
              }`} />
            </div>
            <span className={`text-[10px] font-medium transition-all ${
              item.isActive ? "opacity-100" : "opacity-70"
            }`}>
              {item.label}
            </span>
            {item.isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
            )}
          </button>
        ))}

        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetTrigger asChild>
            <button
              className="relative flex flex-col items-center justify-center gap-0.5 text-muted-foreground touch-manipulation active:scale-95"
            >
              <div className="rounded-full p-1.5">
                <User className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium opacity-70">Profile</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-safe rounded-t-3xl">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-center">Profile & Settings</SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-base touch-manipulation"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/transactions");
                }}
              >
                <Receipt className="h-5 w-5" />
                All Transactions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-base touch-manipulation"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/lend-borrow");
                }}
              >
                <HandCoins className="h-5 w-5" />
                All Lend/Borrow
              </Button>
              <div className="border-t pt-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-base touch-manipulation"
                  onClick={() => {
                    setProfileOpen(false);
                    // Could add settings page navigation here
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

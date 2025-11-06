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

  // Get current tab from URL
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'spend';

  const isSpend = location.pathname === "/dashboard" && currentTab === "spend";
  const isLend = location.pathname === "/dashboard" && currentTab === "lend";
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
      isActive: isTransactionsPage,
      onClick: () => navigate("/transactions"),
    },
    {
      icon: HandCoins,
      label: "Lend",
      isActive: isLendBorrowPage,
      onClick: () => navigate("/lend-borrow"),
    },
    {
      icon: LayoutGrid,
      label: "All",
      isActive: isSpend || isLend,
      onClick: () => navigate("/dashboard?tab=spend"),
    },
  ];

  // Don't show on auth, index, or detail pages
  if (location.pathname === "/auth" || location.pathname === "/" || location.pathname.startsWith("/person/")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass-effect border-t border-border/50 sm:hidden pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
      <div className="grid grid-cols-4 h-16 px-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-300 touch-manipulation ${
              item.isActive
                ? "text-primary scale-105"
                : "text-muted-foreground active:scale-95"
            }`}
          >
            <div className={`rounded-2xl p-2 transition-all duration-300 ${
              item.isActive ? "bg-gradient-to-br from-primary/20 to-accent/20 scale-110" : ""
            }`}>
              <item.icon className={`h-5 w-5 transition-all duration-300 ${
                item.isActive ? "scale-110 drop-shadow-lg" : ""
              }`} />
            </div>
            <span className={`text-[10px] font-semibold transition-all duration-300 ${
              item.isActive ? "opacity-100 scale-105" : "opacity-70"
            }`}>
              {item.label}
            </span>
            {item.isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 gradient-primary rounded-b-full shadow-lg" />
            )}
          </button>
        ))}

        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetTrigger asChild>
            <button
              className="relative flex flex-col items-center justify-center gap-1 text-muted-foreground touch-manipulation active:scale-95 transition-all duration-300"
            >
              <div className="rounded-2xl p-2">
                <User className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold opacity-70">Profile</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-safe rounded-t-3xl border-t-4 border-primary animate-slide-in">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-center text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Profile & Settings
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-base touch-manipulation hover:bg-primary/5 transition-all hover:scale-[1.02]"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/transactions");
                }}
              >
                <Receipt className="h-5 w-5 text-primary" />
                All Transactions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-base touch-manipulation hover:bg-accent/5 transition-all hover:scale-[1.02]"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/lend-borrow");
                }}
              >
                <HandCoins className="h-5 w-5 text-accent" />
                All Lend/Borrow
              </Button>
              <div className="border-t pt-3 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-base touch-manipulation hover:bg-muted transition-all"
                  onClick={() => {
                    setProfileOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation transition-all"
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

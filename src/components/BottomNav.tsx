import { useNavigate, useLocation } from "react-router-dom";
import { Receipt, HandCoins, Target } from "lucide-react";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current tab from URL
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'spend';

  const isSpend = location.pathname === "/dashboard" && currentTab === "spend";
  const isBudget = location.pathname === "/dashboard" && currentTab === "budget";
  const isLend = location.pathname === "/dashboard" && currentTab === "lend";

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
      <div className="glass-panel rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-primary/10">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all duration-300 touch-manipulation rounded-xl group ${
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.isActive && (
              <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md -z-10 scale-90 animate-pulse" />
            )}
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              item.isActive ? "bg-primary/10 scale-110 shadow-sm" : "scale-100 group-hover:scale-105"
            }`}>
              <item.icon className={`h-5 w-5 transition-all duration-300 ${
                item.isActive ? "stroke-[2.5px]" : "stroke-2"
              }`} />
            </div>
            <span className={`text-[10px] font-medium transition-all duration-300 ${
              item.isActive ? "opacity-100 font-semibold translate-y-0" : "opacity-60 translate-y-0.5"
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

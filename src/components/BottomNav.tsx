import { useNavigate, useLocation } from "react-router-dom";
import { Receipt, HandCoins } from "lucide-react";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t sm:hidden pb-safe">
      <div className="grid grid-cols-2 h-16">
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation ${
            isActive("/dashboard")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px] font-medium">Transactions</span>
          {isActive("/dashboard") && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        
        <button
          onClick={() => navigate("/dashboard?tab=lending")}
          className={`flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation ${
            isActive("/dashboard") && location.search.includes("lending")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <HandCoins className="h-5 w-5" />
          <span className="text-[10px] font-medium">Lend/Borrow</span>
          {isActive("/dashboard") && location.search.includes("lending") && (
            <div className="absolute bottom-0 left-3/4 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>
    </nav>
  );
}

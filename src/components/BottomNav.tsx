import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  HandCoins,
  Target,
  Newspaper,
  Gamepad2,
} from "lucide-react";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const playHaptic = () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleNavClick = (onClick: () => void) => {
    playHaptic();
    onClick();
  };

  // Get current tab from URL
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "spend";

  const isSpend = location.pathname === "/dashboard" && currentTab === "spend";
  const isBudget =
    location.pathname === "/dashboard" && currentTab === "budget";
  const isLend = location.pathname === "/dashboard" && currentTab === "lend";
  const isGames =
    location.pathname === "/uno" || location.pathname === "/uno/bot"; // Bot page needs nav? Maybe not. Let's say only Lobby.

  const navItems = [
    {
      icon: LayoutDashboard,
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
    {
      icon: Gamepad2,
      label: "Games",
      isActive: location.pathname === "/uno",
      onClick: () => navigate("/uno"),
    },
    {
      icon: Newspaper,
      label: "News",
      isActive: location.pathname === "/news",
      onClick: () => navigate("/news"),
    },
  ];

  // Logic: Show on Dashboard, News, and Uno Lobby (/uno).
  // Hide on Auth, Root, and Uno Game Rooms (e.g. /uno/ABCD or /uno/bot).
  // Actually usually /uno/bot is a game, so hide there too.
  // So Show if: /dashboard, /news, /uno (exact).

  // The MainLayout handles where this component is rendered.
  // We can simplify the hiding logic, or keep the specific hiding for /uno/:roomCode if that route ends up using MainLayout (which it shouldn't based on App.tsx changes).
  // But just in case, let's keep the game room check.

  const isGameRoom =
    location.pathname.match(/^\/uno\/.+$/) && location.pathname !== "/uno/bot";
  // actually /uno/bot is also a game room.

  // If we are in MainLayout, we generally show it. But let's be safe.
  if (isGameRoom) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe pointer-events-none md:hidden sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[420px] sm:pb-0">
      <div className="glass-panel mx-4 mb-4 sm:mx-0 sm:mb-0 w-full rounded-[2rem] p-1.5 flex items-center justify-between shadow-2xl shadow-primary/20 pointer-events-auto border-white/10 ring-1 ring-white/5 backdrop-blur-3xl bg-background/40">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavClick(item.onClick)}
            className={`relative flex flex-col items-center justify-center gap-1.5 py-2.5 flex-1 transition-all duration-300 touch-manipulation rounded-2xl group active:scale-90 ${
              item.isActive
                ? "text-primary"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5"
            }`}
          >
            {item.isActive && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-x-1 inset-y-1 bg-primary/10 rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div
              className={cn(
                "p-2 rounded-xl transition-all duration-300",
                item.isActive
                  ? "bg-primary shadow-[0_0_20px_rgba(235,113,101,0.3)] text-white"
                  : "bg-transparent scale-100 group-hover:scale-110",
              )}
            >
              <item.icon
                className={`h-5 w-5 transition-all duration-300 ${
                  item.isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                }`}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                item.isActive
                  ? "opacity-100 scale-100"
                  : "opacity-40 scale-90 translate-y-0.5",
              )}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

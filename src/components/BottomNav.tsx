import { useNavigate, useLocation } from "react-router-dom";
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
    <nav className="fixed bottom-6 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[400px] md:hidden">
      <div className="glass-panel rounded-2xl p-2 flex items-center overflow-x-auto scrollbar-hide shadow-2xl shadow-primary/10 gap-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`relative flex-1 min-w-[72px] flex flex-col items-center justify-center gap-1 py-2 transition-all duration-300 touch-manipulation rounded-xl group ${
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.isActive && (
              <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md -z-10 scale-90 animate-pulse" />
            )}
            <div
              className={`p-2 rounded-xl transition-all duration-300 ${
                item.isActive
                  ? "bg-primary/10 scale-110 shadow-sm"
                  : "scale-100 group-hover:scale-105"
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-all duration-300 ${
                  item.isActive ? "stroke-[2.5px]" : "stroke-2"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-medium transition-all duration-300 ${
                item.isActive
                  ? "opacity-100 font-semibold translate-y-0"
                  : "opacity-60 translate-y-0.5"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

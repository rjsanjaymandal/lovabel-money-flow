import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Newspaper, Gamepad2, Wallet, LogOut, Settings, Target, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/UserProfile";
import { ModeToggle } from "@/components/mode-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Signed out successfully");
  };

  const queryParams = new URLSearchParams(location.search);
  const currentTab = queryParams.get("tab") || "spend";

  const navItems = [
    {
      label: "Spends",
      icon: LayoutDashboard,
      href: "/dashboard?tab=spend",
      active: location.pathname === "/dashboard" && currentTab === "spend",
    },
    {
      label: "Budget",
      icon: Target,
      href: "/dashboard?tab=budget",
      active: location.pathname === "/dashboard" && currentTab === "budget",
    },
    {
      label: "Lending",
      icon: HandCoins,
      href: "/dashboard?tab=lend",
      active: location.pathname === "/dashboard" && currentTab === "lend",
    },
    {
        label: "News",
        icon: Newspaper,
        href: "/news",
        active: location.pathname === "/news",
    },
    {
        label: "Games",
        icon: Gamepad2,
        href: "/uno",
        active: location.pathname.startsWith("/uno"),
    },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col fixed left-0 top-0 bottom-0 bg-background/95 backdrop-blur border-r border-border/40 z-50">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-border/40">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/20">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Lovabel</span>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Money Flow</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              item.active 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className={`h-5 w-5 transition-transform duration-300 ${
              item.active ? "scale-110" : "group-hover:scale-110"
            }`} />
            <span className={`font-medium ${item.active ? "font-semibold" : ""}`}>
              {item.label}
            </span>
            {item.active && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border/40 space-y-4">
        {/* User Profile */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-background border border-border overflow-hidden">
                <img 
                    src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`} 
                    alt="Profile"
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {user?.email || "Signed In"}
                </p>
            </div>
            <ModeToggle />
        </div>

        <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
        >
            <LogOut className="h-4 w-4" />
            Sign Out
        </Button>
      </div>
    </aside>
  );
}

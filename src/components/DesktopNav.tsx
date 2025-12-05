import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Newspaper, Wallet } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export function DesktopNav() {
  const location = useLocation();

  // Only show on desktop
  // Hide on Auth page
  if (location.pathname === "/auth") return null;

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: location.pathname === "/dashboard" || location.pathname === "/",
    },
    {
      label: "News",
      icon: Newspaper,
      href: "/news",
      active: location.pathname === "/news",
    },
  ];

  return (
    <header className="hidden sm:flex sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link to="/dashboard" className="mr-6 flex items-center space-x-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              Lovabel
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${
                  item.active ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search could go here */}
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

import { useNavigate } from "react-router-dom";
import { Receipt, HandCoins, Settings, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface UserProfileProps {
  trigger?: React.ReactNode;
}

export function UserProfile({ trigger }: UserProfileProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigation = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="pb-safe rounded-t-[2rem] border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] bg-background/95 backdrop-blur-xl">
        <SheetHeader className="mb-6">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
          <SheetTitle className="text-center text-xl font-bold">
            Profile & Settings
          </SheetTitle>
          <SheetDescription className="text-center text-muted-foreground">
            Manage your account settings and preferences
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-4 h-14 text-base font-medium rounded-2xl border-muted hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all"
            onClick={() => handleNavigation("/transactions")}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            All Transactions
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-4 h-14 text-base font-medium rounded-2xl border-muted hover:bg-accent/5 hover:border-accent/20 hover:text-accent transition-all"
            onClick={() => handleNavigation("/lend-borrow")}
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
            onClick={() => setOpen(false)}
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
  );
}

import { useNavigate } from "react-router-dom";
import { Receipt, HandCoins, Settings, LogOut, User, Pencil, Sparkles, Shapes } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BadgesSection } from "@/components/BadgesSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfileDialog } from "./EditProfileDialog";

interface UserProfileProps {
  trigger?: React.ReactNode;
  userId?: string;
  onManageCategories?: () => void;
}

export function UserProfile({ trigger, userId, onManageCategories }: UserProfileProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserData(user);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUser();
    }
  }, [open]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigation = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleCategoryClick = () => {
    setOpen(false);
    onManageCategories?.();
  };

  const meta = userData?.user_metadata || {};
  const displayName = meta.full_name || "Expenses User";
  const avatarUrl = meta.avatar_url;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-safe rounded-t-none sm:rounded-t-[2rem] border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] bg-background/95 backdrop-blur-xl h-[100dvh] sm:h-[85vh] flex flex-col">
          <SheetTitle className="sr-only">Profile</SheetTitle>
          {/* Header Profile Section */}
          <div className="pt-2 pb-6 flex flex-col items-center justify-center relative">
            <div className="w-12 h-1.5 bg-muted/50 rounded-full mb-6" />
            
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <Avatar className="h-24 w-24 border-4 border-background shadow-2xl relative z-10">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl bg-muted">{displayName[0]}</AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg border-2 border-background z-20"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>

            <h2 className="text-2xl font-bold text-center flex items-center gap-2">
              {displayName}
              {meta.is_premium && <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />}
            </h2>
            <p className="text-sm text-muted-foreground">{userData?.email}</p>
          </div>

          <div className="space-y-4 px-1 flex-1 overflow-y-auto custom-scrollbar">
            {userId && <BadgesSection userId={userId} />}
            
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-16 text-base font-medium rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all border-0"
                onClick={() => handleNavigation("/transactions")}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <div className="leading-none mb-1">Transactions</div>
                  <div className="text-xs text-muted-foreground font-normal">View history</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-16 text-base font-medium rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all border-0"
                onClick={() => handleNavigation("/lend-borrow")}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <HandCoins className="h-5 w-5 text-indigo-500" />
                </div>
                 <div className="text-left">
                  <div className="leading-none mb-1">Lend & Borrow</div>
                  <div className="text-xs text-muted-foreground font-normal">Manage debts</div>
                </div>
              </Button>

              {onManageCategories && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-4 h-16 text-base font-medium rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all border-0"
                  onClick={handleCategoryClick}
                >
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Shapes className="h-5 w-5 text-orange-500" />
                  </div>
                   <div className="text-left">
                    <div className="leading-none mb-1">Categories</div>
                    <div className="text-xs text-muted-foreground font-normal">Manage budgets</div>
                  </div>
                </Button>
              )}
            </div>

          </div>

          <div className="pt-2 pb-6 px-1 mt-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
            
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-16 text-base font-medium rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all border-0"
                onClick={() => setEditOpen(true)}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-500/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="text-left">
                  <div className="leading-none mb-1">Settings</div>
                  <div className="text-xs text-muted-foreground font-normal">App preferences</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-16 text-base font-medium rounded-2xl border-white/5 bg-rose-500/5 hover:bg-rose-500/10 transition-all border-0 group"
                onClick={handleSignOut}
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                  <LogOut className="h-5 w-5 text-rose-500" />
                </div>
                <div className="text-left">
                  <div className="leading-none mb-1 text-rose-400 group-hover:text-rose-300 transition-colors">Sign Out</div>
                  <div className="text-xs text-rose-500/50 font-normal">Log out of account</div>
                </div>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <EditProfileDialog 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        initialName={displayName}
        initialAvatar={avatarUrl}
        onProfileUpdated={fetchUser}
      />
    </>
  );
}

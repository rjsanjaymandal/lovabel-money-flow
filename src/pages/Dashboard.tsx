import { useState, useEffect, useRef } from "react";
// Force rebuild
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Receipt, HandCoins, Settings, Search, X, Target, Gamepad2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CategoryManager } from "@/components/CategoryManager";
import { TransactionView } from "@/components/TransactionView";
import { BudgetView } from "@/components/BudgetView";
import { LendBorrowView } from "@/components/LendBorrowView";
import { UserProfile } from "@/components/UserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { StreakCounter } from "@/components/StreakCounter";

interface Person {
  name: string;
  balance: number;
}

const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Personal",
  "Other",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "lend" ? "lend" : "spend");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchPeople(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchPeople(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Sync activeTab with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "lend") setActiveTab("lend");
    else if (tab === "budget") setActiveTab("budget");
    else setActiveTab("spend");
  }, [searchParams]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const fetchPeople = async (userId: string) => {
    const { data: records } = await supabase
      .from("lend_borrow")
      .select("person_name, type, amount, status")
      .eq("user_id", userId);

    if (records) {
      const personMap = new Map<string, number>();

      records.forEach((record) => {
        if (record.status === "pending") {
          const current = personMap.get(record.person_name) || 0;
          const amount = record.type === "lent" ? record.amount : -record.amount;
          personMap.set(record.person_name, current + amount);
        } else if (!personMap.has(record.person_name)) {
          personMap.set(record.person_name, 0);
        }
      });

      const peopleList: Person[] = Array.from(personMap.entries()).map(([name, balance]) => ({
        name,
        balance,
      }));

      peopleList.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

      setPeople(peopleList);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-safe relative overflow-x-hidden">
      {/* Premium Header */}
      {/* Floating Island Navbar */}
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-40 sm:hidden bg-background/50 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between safe-top transition-all duration-300">
          {isSearchOpen ? (
            <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <Search className="w-5 h-5 text-primary flex-shrink-0" />
              <Input 
                ref={searchInputRef}
                placeholder="Search transactions..." 
                className="h-10 text-base bg-muted/50 border-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSearch}
                className="h-10 w-10 rounded-full hover:bg-muted flex-shrink-0"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <>
              <div 
                className="flex items-center gap-3 cursor-pointer select-none" 
                onClick={() => handleTabChange("spend")}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight leading-none text-foreground">
                    EasyExpense
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-medium">Financial Freedom</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <StreakCounter userId={user?.id} />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSearch}
                  className="h-10 w-10 rounded-full hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Search className="w-5 h-5" />
                </Button>
                <UserProfile 
                  userId={user?.id}
                  onManageCategories={() => setCategoryManagerOpen(true)}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/5 transition-colors p-0 overflow-hidden">
                      <div className="h-full w-full rounded-full border border-primary/10 overflow-hidden">
                         <img 
                           src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`} 
                           alt="Profile"
                           className="h-full w-full object-cover"
                         />
                      </div>
                    </Button>
                  }
                />
              </div>
            </>
          )}
      </header>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-center justify-between px-2 mb-6 mt-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
           <p className="text-sm text-muted-foreground">Overview of your activity</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 transition-all focus-within:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search..." 
                className="pl-9 h-10 bg-background/50 border-input/60 rounded-xl focus:bg-background transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
             {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          <StreakCounter userId={user?.id} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 pt-20 sm:pt-0 pb-24 sm:pb-8 max-w-7xl mx-auto w-full">
        <Tabs key={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="spend" className="mt-0 animate-slide-in">
            <TransactionView 
              userId={user?.id}
              user={user} // Pass user object
              categories={categories}
              onTransactionAdded={() => {}}
              searchQuery={searchQuery}
              onClearSearch={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
            />
          </TabsContent>

          <TabsContent value="budget" className="mt-0 animate-slide-in">
            <BudgetView userId={user?.id} categories={categories} />
          </TabsContent>
          
          <TabsContent value="lend" className="mt-0 animate-slide-in">
            <LendBorrowView 
              people={people}
              userId={user?.id}
              onPersonAdded={() => fetchPeople(user.id)}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Category Manager Modal */}
      <CategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        categories={categories}
        onCategoriesChange={setCategories}
      />
    </div>
  );
};

export default Dashboard;

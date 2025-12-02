import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Receipt, HandCoins, Settings, Search, X, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CategoryManager } from "@/components/CategoryManager";
import { TransactionView } from "@/components/TransactionView";
import { BudgetView } from "@/components/BudgetView";
import { LendBorrowView } from "@/components/LendBorrowView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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
  const [user, setUser] = useState<any>(null);
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
    setActiveTab(tab === "lend" ? "lend" : "spend");
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
      <header className="fixed top-0 left-0 right-0 z-40 sm:hidden bg-background/80 backdrop-blur-xl border-b border-border/5 px-4 h-16 flex items-center justify-between safe-top transition-all duration-300">
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
                className="flex items-center gap-2.5 cursor-pointer select-none" 
                onClick={() => handleTabChange("spend")}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <Wallet className="relative w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight leading-none bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    EasyExpense
                  </h1>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSearch}
                className="h-10 w-10 rounded-full hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Search className="w-6 h-6" />
              </Button>
            </>
          )}
      </header>

      {/* Floating Island Navbar (Desktop Only) */}
      <div className="fixed top-4 left-0 right-0 z-50 hidden sm:flex justify-center px-4 pointer-events-none">
        <header className="pointer-events-auto w-full max-w-5xl bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-2 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between transition-all duration-300 hover:bg-background/70 hover:shadow-primary/5 hover:scale-[1.005]">
          
          {/* Logo Section - Hide when search is open on desktop to save space if needed, or just keep it */}
          <div 
            className={`flex items-center gap-2 sm:gap-3 cursor-pointer group select-none pl-2 transition-all duration-300 ${isSearchOpen ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`} 
            onClick={() => handleTabChange("spend")}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors leading-none">
                EasyExpense
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium group-hover:text-primary/70 transition-colors">Financial Freedom</p>
            </div>
          </div>

          {/* Center Navigation Pills - Hide when search is open */}
          <nav className={`flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-white/5 transition-all duration-300 ${isSearchOpen ? 'w-0 opacity-0 overflow-hidden p-0 border-0' : 'w-auto opacity-100'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange("spend")}
              className={`rounded-full px-3 sm:px-5 h-8 sm:h-9 text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeTab === "spend" 
                  ? "bg-background shadow-sm text-foreground scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Spends
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange("budget")}
              className={`rounded-full px-3 sm:px-5 h-8 sm:h-9 text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeTab === "budget" 
                  ? "bg-background shadow-sm text-foreground scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Budget
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange("lend")}
              className={`rounded-full px-3 sm:px-5 h-8 sm:h-9 text-xs sm:text-sm font-medium transition-all duration-300 ${
                activeTab === "lend" 
                  ? "bg-background shadow-sm text-foreground scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <HandCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Lend
            </Button>
          </nav>

          {/* Right Actions & Search */}
          <div className={`flex items-center gap-2 pr-1 transition-all duration-300 ${isSearchOpen ? 'flex-1 pl-2' : ''}`}>
             {/* Desktop Search */}
            <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-full' : 'w-9'}`}>
              <div 
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 ${isSearchOpen ? 'left-3' : 'left-1/2 -translate-x-1/2'}`}
                onClick={() => !isSearchOpen && setIsSearchOpen(true)}
              >
                <Search className={`w-4 h-4 text-muted-foreground cursor-pointer ${isSearchOpen ? '' : 'hover:text-primary'}`} />
              </div>
              
              <Input 
                ref={isSearchOpen ? searchInputRef : null}
                placeholder="Search transactions..." 
                className={`h-9 bg-muted/50 border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary/50 transition-all duration-300 ${
                  isSearchOpen ? 'w-full pl-9 pr-9 opacity-100' : 'w-9 opacity-0 cursor-pointer'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => !isSearchOpen && setIsSearchOpen(true)}
              />
              
              {isSearchOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={toggleSearch}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className={`w-px h-4 bg-border/50 mx-1 ${isSearchOpen ? 'hidden' : 'block'}`} />
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCategoryManagerOpen(true)}
              className={`rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-background/80 hover:scale-105 transition-all ${isSearchOpen ? 'hidden' : 'flex'}`}
            >
              <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              className={`rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all ${isSearchOpen ? 'hidden' : 'flex'}`}
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </Button>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 pt-20 sm:pt-24 pb-24 sm:pb-8 max-w-7xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="spend" className="mt-0 animate-slide-in">
            <TransactionView 
              userId={user?.id}
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

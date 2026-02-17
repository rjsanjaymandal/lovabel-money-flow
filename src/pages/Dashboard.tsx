import { useState, useEffect, useRef } from "react";
// Force rebuild
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Wallet,
  Receipt,
  HandCoins,
  Settings,
  Search,
  X,
  Target,
  Gamepad2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CategoryManager } from "@/components/CategoryManager";
import { TransactionView } from "@/components/TransactionView";
import { BudgetView } from "@/components/BudgetView";
import { LendBorrowView } from "@/components/LendBorrowView";
import { UserProfile } from "@/components/UserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { StreakCounter } from "@/components/StreakCounter";
import { ZenBackground } from "@/components/ZenBackground";
import { MonthSelector } from "@/components/MonthSelector";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "lend" ? "lend" : "spend",
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchPeople(session.user.id);
      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
          const amount =
            record.type === "lent" ? record.amount : -record.amount;
          personMap.set(record.person_name, current + amount);
        } else if (!personMap.has(record.person_name)) {
          personMap.set(record.person_name, 0);
        }
      });

      const peopleList: Person[] = Array.from(personMap.entries()).map(
        ([name, balance]) => ({
          name,
          balance,
        }),
      );

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
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
      <ZenBackground />
      {/* Premium Header */}
      {/* Floating Island Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 sm:hidden pointer-events-none pt-[env(safe-area-inset-top)] mt-2 px-3">
        <div
          className={cn(
            "mx-auto bg-background/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] px-4 flex items-center justify-between transition-all duration-500 pointer-events-auto",
            isSearchOpen
              ? "h-16 rounded-[1.5rem] w-full"
              : "h-14 rounded-2xl w-full max-w-[400px]",
          )}
        >
          {isSearchOpen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex items-center w-full gap-3"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search transactions..."
                  className="h-10 pl-9 text-base bg-white/5 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSearch}
                className="h-10 w-10 rounded-xl hover:bg-white/10 flex-shrink-0 active:scale-90 transition-transform"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2.5">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer shrink-0"
                  onClick={() => handleTabChange("spend")}
                >
                  <Wallet className="w-5 h-5 text-white" />
                </motion.div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1 opacity-60 truncate">
                    {getGreeting()}
                  </span>
                  <h1 className="text-sm font-black tracking-tight leading-none text-foreground truncate">
                    {user?.user_metadata?.full_name?.split(" ")[0] || "Sanjay"}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <StreakCounter userId={user?.id} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSearch}
                  className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 text-muted-foreground active:scale-90 transition-all shrink-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <UserProfile
                  userId={user?.id}
                  onManageCategories={() => setCategoryManagerOpen(true)}
                  trigger={
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="h-9 w-9 rounded-xl border border-primary/20 p-0.5 overflow-hidden cursor-pointer bg-white/5 shrink-0 flex items-center justify-center"
                    >
                      <img
                        src={
                          user?.user_metadata?.avatar_url ||
                          `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.id}`
                        }
                        alt="Profile"
                        className="h-full w-full rounded-[0.55rem] object-cover flex-shrink-0"
                      />
                    </motion.div>
                  }
                />
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <div className="hidden sm:flex flex-col gap-6 px-4 md:px-6 mb-8 mt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {activeTab === "spend"
                ? "Financial Overview"
                : activeTab === "budget"
                  ? "Budget Planning"
                  : "Lending & Borrowing"}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {getGreeting()},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                {user?.user_metadata?.full_name?.split(" ")[0] ||
                  user?.email?.split("@")[0] ||
                  "Friend"}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-1.5 rounded-2xl shadow-sm">
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            <div className="h-8 w-px bg-border/50 mx-1" />
            <ModeToggle />
          </div>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
          <Input
            placeholder="Search transactions, people or categories..."
            className="pl-12 h-12 bg-card/40 border-border/50 rounded-2xl focus:bg-card focus:ring-primary/20 transition-all text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 px-3 sm:px-4 md:px-6 pt-20 sm:pt-0 pb-24 sm:pb-8 max-w-7xl mx-auto w-full relative z-0">
        <Tabs
          key={activeTab}
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full space-y-6"
        >
          {/* Mobile Tab Switcher (Segmented Control) */}
          <div className="sm:hidden px-1">
            <div className="bg-white/5 border border-white/5 p-1 rounded-[1.5rem] flex items-center relative gap-1 backdrop-blur-md">
              {["spend", "budget", "lend"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`relative flex-1 py-2.5 text-xs font-bold rounded-2xl transition-all duration-300 z-10 ${
                    activeTab === tab
                      ? "text-primary filter drop-shadow-[0_0_8px_rgba(235,113,101,0.5)]"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  {activeTab === tab && (
                    <div className="absolute inset-0 bg-white/10 rounded-2xl shadow-sm animate-in fade-in zoom-in-95 duration-200" />
                  )}
                  <span className="capitalize">
                    {tab === "spend"
                      ? "Spends"
                      : tab === "budget"
                        ? "Goals"
                        : "Lend"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-muted/30 p-1 rounded-2xl w-fit border border-border/50">
            <TabsList className="bg-transparent h-10 gap-1 p-0">
              <TabsTrigger
                value="spend"
                className="rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Expenses
              </TabsTrigger>
              <TabsTrigger
                value="budget"
                className="rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Budgets
              </TabsTrigger>
              <TabsTrigger
                value="lend"
                className="rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Lend/Borrow
              </TabsTrigger>
            </TabsList>
          </div>
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
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </TabsContent>

          <TabsContent value="budget" className="mt-0 animate-slide-in">
            <BudgetView
              userId={user?.id}
              categories={categories}
              selectedMonth={selectedMonth}
            />
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

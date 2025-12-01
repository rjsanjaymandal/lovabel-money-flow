import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, Receipt, HandCoins, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CategoryManager } from "@/components/CategoryManager";
import { TransactionView } from "@/components/TransactionView";
import { LendBorrowView } from "@/components/LendBorrowView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <header className="fixed top-0 left-0 right-0 z-40 sm:hidden bg-background/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between safe-top transition-all duration-300">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none" 
            onClick={() => handleTabChange("spend")}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">
                EasyExpense
              </h1>
            </div>
          </div>
      </header>

      {/* Floating Island Navbar (Desktop Only) */}
      <div className="fixed top-4 left-0 right-0 z-50 hidden sm:flex justify-center px-4 pointer-events-none">
        <header className="pointer-events-auto w-full max-w-5xl bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-2 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between transition-all duration-300 hover:bg-background/70 hover:shadow-primary/5 hover:scale-[1.005]">
          
          {/* Logo Section */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none pl-2" 
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

          {/* Center Navigation Pills */}
          <nav className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-white/5">
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

          {/* Right Actions */}
          <div className="flex items-center gap-1 pr-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCategoryManagerOpen(true)}
              className="rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-background/80 hover:scale-105 transition-all"
            >
              <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-muted-foreground" />
            </Button>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              className="rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all"
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

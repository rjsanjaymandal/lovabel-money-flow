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
      <header className="fixed top-0 left-0 right-0 z-40 glass-panel border-b-0 rounded-b-3xl sm:rounded-none sm:border-b transition-all duration-300 safe-top">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div 
            className="flex items-center gap-3 cursor-pointer group select-none" 
            onClick={() => handleTabChange("spend")}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 animate-in-up group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="animate-in-up" style={{ animationDelay: "0.1s" }}>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                EasyExpense
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium group-hover:text-primary/70 transition-colors">Financial Freedom</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1 bg-secondary/50 p-1 rounded-full backdrop-blur-md border border-white/10">
            <Button
              variant={activeTab === "spend" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleTabChange("spend")}
              className={`gap-2 rounded-full px-4 transition-all duration-300 ${activeTab === "spend" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
            >
              <Receipt className="w-4 h-4" />
              Spends
            </Button>
            <Button
              variant={activeTab === "lend" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleTabChange("lend")}
              className={`gap-2 rounded-full px-4 transition-all duration-300 ${activeTab === "lend" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
            >
              <HandCoins className="w-4 h-4" />
              Lend/Borrow
            </Button>
            <div className="w-px h-5 bg-border mx-2" />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCategoryManagerOpen(true)}
              className="rounded-full hover:bg-white/50 w-8 h-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              className="rounded-full hover:bg-destructive/10 hover:text-destructive w-8 h-8"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

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

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  });
  const [people, setPeople] = useState<Person[]>([]);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState("transactions");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchStats(session.user.id);
      await fetchPeople(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchStats(session.user.id);
        fetchPeople(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", userId);

    if (transactions) {
      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
      });
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Wallet className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                EasyExpense
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Track smarter, save better 💰</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCategoryManagerOpen(true)}
              className="hover:bg-muted rounded-full h-8 w-8 md:h-10 md:w-10"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full h-8 w-8 md:h-10 md:w-10"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="flex-1 p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 md:h-14">
            <TabsTrigger value="transactions" className="text-sm md:text-base flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span>Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="lending" className="text-sm md:text-base flex items-center gap-2">
              <HandCoins className="w-4 h-4" />
              <span>Lending/Borrowing</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="mt-0">
            <TransactionView 
              userId={user?.id}
              stats={stats}
              categories={categories}
              onTransactionAdded={() => fetchStats(user.id)}
            />
          </TabsContent>
          
          <TabsContent value="lending" className="mt-0">
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

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { SpendingChart } from "@/components/SpendingChart";
import { useToast } from "@/hooks/use-toast";
import { PeopleSidebar } from "@/components/PeopleSidebar";
import { PersonDetails } from "@/components/PersonDetails";
import { CategoryManager } from "@/components/CategoryManager";

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
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

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
      
      if (peopleList.length > 0 && !selectedPerson) {
        setSelectedPerson(peopleList[0].name);
      }
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
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      {/* Always Visible Sidebar - Horizontal on mobile, vertical on desktop */}
      <div className="md:h-screen md:overflow-y-auto border-b md:border-r md:border-b-0">
        <PeopleSidebar
          people={people}
          selectedPerson={selectedPerson}
          onSelectPerson={setSelectedPerson}
          onPersonAdded={() => fetchPeople(user.id)}
          onManageCategories={() => setCategoryManagerOpen(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  EasyExpense
                </h1>
                <p className="text-xs text-muted-foreground">Track smarter, save better 💰</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6">
          {/* Top Section: Quick Add Transaction + Lend/Borrow */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Add Transaction */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Quick Add Transaction</CardTitle>
                  <AddTransactionDialog 
                    onSuccess={() => fetchStats(user.id)}
                    categories={categories}
                  >
                    <Button size="sm" className="gradient-primary hover:opacity-90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </AddTransactionDialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Track your income and expenses with categories in ₹
                </p>
              </CardContent>
            </Card>

            {/* Lend/Borrow Quick Info */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Lend/Borrow</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPerson ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Currently viewing: <span className="font-semibold text-foreground">{selectedPerson}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Select a contact from sidebar to view full history and add transactions
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Select a contact from the sidebar to manage Given/Taken transactions
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lend/Borrow Details (when person selected) */}
          {selectedPerson && (
            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                <PersonDetails personName={selectedPerson} userId={user?.id} />
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group hover:scale-105">
              <div className="absolute inset-0 gradient-success opacity-5 group-hover:opacity-10 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-semibold">Total Income</CardTitle>
                <div className="w-10 h-10 rounded-full gradient-success flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-success">
                  ₹{stats.totalIncome.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Keep it up! 📈</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group hover:scale-105">
              <div className="absolute inset-0 gradient-accent opacity-5 group-hover:opacity-10 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-semibold">Total Expenses</CardTitle>
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-accent">
                  ₹{stats.totalExpenses.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Watch your spending 👀</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group hover:scale-105">
              <div className="absolute inset-0 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-semibold">Balance</CardTitle>
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-primary">
                  ₹{stats.balance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your net worth 💎</p>
              </CardContent>
            </Card>
          </div>

          {/* Spending Overview */}
          <Card className="border-2 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                Spending Overview 📊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingChart userId={user?.id} />
            </CardContent>
          </Card>
        </main>
      </div>

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

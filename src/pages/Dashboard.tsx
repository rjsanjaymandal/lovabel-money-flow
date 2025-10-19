import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, TrendingUp, TrendingDown, Users, Wallet } from "lucide-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionList } from "@/components/TransactionList";
import { SpendingChart } from "@/components/SpendingChart";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PeopleSidebar } from "@/components/PeopleSidebar";
import { PersonDetails } from "@/components/PersonDetails";

interface Person {
  name: string;
  balance: number;
}

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
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
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

        <div className="mb-8">
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
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-card transition-all">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="lend-borrow" className="rounded-lg data-[state=active]:shadow-md data-[state=active]:bg-card transition-all">
              <Users className="w-4 h-4 mr-2" />
              Lend/Borrow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Recent Transactions 💸</h2>
              <AddTransactionDialog onSuccess={() => fetchStats(user.id)}>
                <Button className="gradient-primary hover:opacity-90 transition-all hover:scale-105">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </AddTransactionDialog>
            </div>
            <TransactionList userId={user?.id} />
          </TabsContent>

          <TabsContent value="lend-borrow" className="mt-0">
            <SidebarProvider defaultOpen={true}>
              <div className="flex min-h-[calc(100vh-24rem)] w-full border-2 rounded-2xl overflow-hidden shadow-lg bg-card">
                <PeopleSidebar
                  people={people}
                  selectedPerson={selectedPerson}
                  onSelectPerson={setSelectedPerson}
                  onPersonAdded={() => fetchPeople(user.id)}
                />
                <div className="flex-1 p-8 overflow-auto bg-gradient-to-br from-background to-background/50">
                  {selectedPerson ? (
                    <PersonDetails personName={selectedPerson} userId={user?.id} />
                  ) : (
                    <Card className="border-2 border-dashed h-full flex items-center justify-center">
                      <CardContent className="p-12 text-center space-y-4">
                        <div className="w-24 h-24 rounded-full gradient-primary mx-auto flex items-center justify-center opacity-20">
                          <Users className="h-12 w-12 text-white" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-bold">Select a Contact</p>
                          <p className="text-muted-foreground">Choose someone from the sidebar to view their transactions</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </SidebarProvider>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;

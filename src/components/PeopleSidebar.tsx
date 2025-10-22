import { Users, Plus, TrendingUp, TrendingDown, Home, Receipt, HandCoins, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Person {
  name: string;
  balance: number;
}

interface PeopleSidebarProps {
  people: Person[];
  selectedPerson: string | null;
  onSelectPerson: (name: string) => void;
  onPersonAdded: () => void;
  onManageCategories: () => void;
}

export function PeopleSidebar({ people, selectedPerson, onSelectPerson, onPersonAdded, onManageCategories }: PeopleSidebarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    person_name: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("lend_borrow").insert({
        user_id: user.id,
        type: "lent",
        person_name: formData.person_name,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        date: formData.date,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: "Contact added successfully.",
      });

      setOpen(false);
      setFormData({
        person_name: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      onPersonAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <aside className="w-full md:w-80 md:min-w-[280px] lg:min-w-[320px] border-r bg-sidebar flex-shrink-0 md:h-screen overflow-y-auto">
      <div className="p-3 md:p-4 space-y-4 md:space-y-6">
        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="w-full justify-start h-10 md:h-12 text-sm md:text-base hover:bg-sidebar-accent"
          >
            <Home className="h-4 md:h-5 w-4 md:w-5 mr-2 md:mr-3" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Button
            onClick={() => navigate("/transactions")}
            variant="ghost"
            className="w-full justify-start h-10 md:h-12 text-sm md:text-base hover:bg-sidebar-accent"
          >
            <Receipt className="h-4 md:h-5 w-4 md:w-5 mr-2 md:mr-3" />
            <span className="hidden sm:inline">All Transactions</span>
          </Button>
          <Button
            onClick={() => navigate("/lend-borrow")}
            variant="ghost"
            className="w-full justify-start h-10 md:h-12 text-sm md:text-base hover:bg-sidebar-accent"
          >
            <HandCoins className="h-4 md:h-5 w-4 md:w-5 mr-2 md:mr-3" />
            <span className="hidden sm:inline">All Lend/Borrow</span>
          </Button>
          <Button
            onClick={onManageCategories}
            variant="ghost"
            className="w-full justify-start h-10 md:h-12 text-sm md:text-base hover:bg-sidebar-accent"
          >
            <Settings className="h-4 md:h-5 w-4 md:w-5 mr-2 md:mr-3" />
            <span className="hidden sm:inline">Categories</span>
          </Button>
        </div>

        <div className="h-px bg-border hidden md:block" />

        {/* Contacts Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Contacts</h3>
                <p className="text-xs text-muted-foreground">{people.length} people</p>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 w-9 p-0 rounded-full gradient-primary hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Add New Contact 👤</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="person">Contact Name</Label>
                    <Input
                      id="person"
                      placeholder="John Doe"
                      value={formData.person_name}
                      onChange={(e) =>
                        setFormData({ ...formData, person_name: e.target.value })
                      }
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Initial Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="Add notes..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="h-11"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 gradient-primary hover:opacity-90 transition-opacity">
                    Add Contact
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Contacts List */}
          <div className="space-y-1">
            {people.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No contacts yet</p>
                <p className="text-xs text-muted-foreground">Add someone to get started!</p>
              </div>
            ) : (
              people.map((person) => (
                <Card
                  key={person.name}
                  onClick={() => onSelectPerson(person.name)}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedPerson === person.name
                      ? "bg-sidebar-accent shadow-sm ring-2 ring-primary/20"
                      : "hover:bg-sidebar-accent/50"
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            person.balance >= 0 ? "gradient-success" : "gradient-accent"
                          }`}
                        >
                          {person.balance >= 0 ? (
                            <TrendingUp className="h-5 w-5 text-white" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{person.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {person.balance >= 0 ? "You'll get" : "You owe"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`font-bold text-xs px-2 py-1 ${
                          person.balance >= 0
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-accent/30 bg-accent/10 text-accent"
                        }`}
                      >
                        {person.balance >= 0 ? "+" : "-"}₹{Math.abs(person.balance).toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

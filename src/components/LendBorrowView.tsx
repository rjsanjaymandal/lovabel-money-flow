import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const amountSchema = z.number()
  .positive({ message: "Amount must be greater than zero" })
  .finite({ message: "Amount must be a valid number" })
  .max(99999999.99, { message: "Amount is too large" });

interface Person {
  name: string;
  balance: number;
}

interface LendBorrowViewProps {
  people: Person[];
  userId: string;
  onPersonAdded: () => void;
}

export function LendBorrowView({ people, userId, onPersonAdded }: LendBorrowViewProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
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

      // Validate amount only if provided
      let validatedAmount = 0;
      if (formData.amount) {
        const parsedAmount = parseFloat(formData.amount);
        const validationResult = amountSchema.safeParse(parsedAmount);
        
        if (!validationResult.success) {
          throw new Error(validationResult.error.errors[0].message);
        }
        validatedAmount = validationResult.data;
      }

      const { error } = await supabase.from("lend_borrow").insert({
        user_id: user.id,
        type: "lent",
        person_name: formData.person_name,
        amount: validatedAmount,
        description: formData.description || null,
        date: formData.date,
        status: validatedAmount > 0 ? "pending" : "settled",
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
      const message = error.message.includes("Amount") 
        ? error.message 
        : "Unable to add contact. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Contacts Header - Redesigned */}
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardContent className="p-4 sm:p-6 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-md" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  My Contacts
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {people.length} {people.length === 1 ? 'person' : 'people'}
                  </p>
                </div>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="gradient-primary hover:opacity-90 transition-all duration-300 h-10 sm:h-11 touch-manipulation hover:scale-105 active:scale-95 shadow-lg px-3 sm:px-4"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline font-semibold">Add</span>
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
                      maxLength={100}
                      value={formData.person_name}
                      onChange={(e) =>
                        setFormData({ ...formData, person_name: e.target.value })
                      }
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Initial Amount (₹) - Optional</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="99999999.99"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                      maxLength={500}
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
        </CardContent>
      </Card>

      {/* Contacts List - Redesigned */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {people.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/20 shadow-sm col-span-full bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
            <CardContent className="py-12 sm:py-16 text-center space-y-4 relative">
              <div className="relative inline-block">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto flex items-center justify-center animate-pulse shadow-lg">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent animate-bounce shadow-md flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm sm:text-base font-semibold text-foreground">No contacts yet</p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                  Start tracking by adding your first contact above! 👆
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          people.map((person, index) => (
            <Card
              key={person.name}
              onClick={() => navigate(`/person/${encodeURIComponent(person.name)}`)}
              className="cursor-pointer transition-all duration-300 border-2 hover:border-primary/50 touch-manipulation active:scale-95 hover:scale-[1.02] hover:shadow-xl group overflow-hidden relative animate-fade-in bg-gradient-to-br from-card to-card/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-accent/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <CardContent className="p-4 sm:p-5 relative">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                      person.balance >= 0 ? "gradient-success" : "gradient-accent"
                    }`}
                  >
                    {person.balance >= 0 ? (
                      <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-md" />
                    ) : (
                      <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-md" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-base sm:text-lg font-bold truncate mb-1 group-hover:text-primary transition-colors">
                      {person.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${person.balance >= 0 ? 'bg-success' : 'bg-accent'} animate-pulse`} />
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                        {person.balance >= 0 ? "You'll receive" : "You owe them"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-xl p-3 sm:p-3.5 text-center transition-all duration-300 ${
                  person.balance >= 0
                    ? "bg-gradient-to-br from-success/15 to-success/5 border border-success/20 group-hover:from-success/20 group-hover:to-success/10"
                    : "bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 group-hover:from-accent/20 group-hover:to-accent/10"
                }`}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`text-xl sm:text-2xl font-bold ${
                      person.balance >= 0 ? "text-success" : "text-accent"
                    }`}>
                      {person.balance >= 0 ? "+" : "-"}₹{Math.abs(person.balance).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">
                    Outstanding Balance
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { SplitBillDialog } from "@/components/SplitBillDialog";

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

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalOwedToYou = people
      .filter(p => p.balance > 0)
      .reduce((sum, p) => sum + p.balance, 0);
    
    const totalYouOwe = people
      .filter(p => p.balance < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance), 0);

    return { totalOwedToYou, totalYouOwe };
  }, [people]);

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
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Summary Section - Nano Style */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 sm:p-5 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-500">
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">You're Owed</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-500">
              ₹{stats.totalOwedToYou.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-rose-500/10 to-rose-500/5 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 sm:p-5 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-rose-500/20 text-rose-500">
                <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">You Owe</span>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-rose-500">
              ₹{stats.totalYouOwe.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header & Add Button */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">People</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {people.length} active {people.length === 1 ? 'contact' : 'contacts'}
          </p>
        </div>

        <div className="flex gap-2">
          <SplitBillDialog people={people} onSuccess={onPersonAdded} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 bg-primary text-primary-foreground px-4 sm:px-6">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md border-none bg-card/95 backdrop-blur-xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Add Contact
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="person">Name</Label>
                <Input
                  id="person"
                  placeholder="e.g. John Doe"
                  maxLength={100}
                  value={formData.person_name}
                  onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                  required
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Optional)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
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
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Note (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What's this for?"
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl h-11 text-base font-medium shadow-lg shadow-primary/20">
                Create Contact
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    {/* People Grid */}
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {people.length === 0 ? (
        <Card className="col-span-full border-dashed border-2 border-muted bg-muted/5 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No contacts yet</h3>
            <p className="text-sm text-muted-foreground">
              Add people to start tracking who owes you and who you owe.
            </p>
          </Card>
        ) : (
          people.map((person, index) => (
            <Card
              key={person.name}
              onClick={() => navigate(`/person/${encodeURIComponent(person.name)}`)}
              className="group cursor-pointer border-none bg-card/40 hover:bg-card/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${
                person.balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
              
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg ${
                      person.balance >= 0 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg leading-none mb-1.5 group-hover:text-primary transition-colors">
                        {person.name}
                      </h3>
                      <Badge variant="secondary" className={`text-[10px] sm:text-xs font-medium border-0 ${
                        person.balance >= 0 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {person.balance >= 0 ? 'Owes you' : 'You owe'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg sm:text-xl font-bold tracking-tight ${
                      person.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      ₹{Math.abs(person.balance).toLocaleString()}
                    </p>
                    <ArrowUpRight className={`w-4 h-4 ml-auto mt-1 opacity-50 ${
                      person.balance >= 0 ? 'text-emerald-500' : 'text-rose-500 rotate-180'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

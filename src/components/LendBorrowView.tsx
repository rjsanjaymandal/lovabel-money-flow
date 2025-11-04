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
import { PersonDetails } from "@/components/PersonDetails";
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
  const [open, setOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
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
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Contacts Header */}
      <Card className="border shadow-md sm:shadow-lg">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold">Contacts</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{people.length} people</p>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary hover:opacity-90 transition-opacity h-9 sm:h-10 touch-manipulation">
                  <Plus className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden xs:inline ml-1.5">Add Contact</span>
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

      {/* Contacts List */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.length === 0 ? (
          <Card className="border shadow-sm col-span-full">
            <CardContent className="py-8 sm:py-12 text-center space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">No contacts yet</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Add someone to get started!</p>
            </CardContent>
          </Card>
        ) : (
          people.map((person) => (
            <Card
              key={person.name}
              onClick={() => setSelectedPerson(person.name)}
              className={`cursor-pointer transition-all duration-200 border touch-manipulation active:scale-95 sm:hover:shadow-md ${
                selectedPerson === person.name
                  ? "ring-2 ring-primary/50 shadow-md sm:shadow-lg"
                  : "hover:border-primary/30"
              }`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      person.balance >= 0 ? "gradient-success" : "gradient-accent"
                    }`}
                  >
                    {person.balance >= 0 ? (
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    ) : (
                      <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold truncate">{person.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {person.balance >= 0 ? "You'll get" : "You owe"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`w-full justify-center font-bold text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 ${
                    person.balance >= 0
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-accent/30 bg-accent/10 text-accent"
                  }`}
                >
                  {person.balance >= 0 ? "+" : "-"}₹{Math.abs(person.balance).toFixed(0)}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Person Details */}
      {selectedPerson && (
        <Card className="border shadow-sm sm:shadow-lg">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <PersonDetails personName={selectedPerson} userId={userId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

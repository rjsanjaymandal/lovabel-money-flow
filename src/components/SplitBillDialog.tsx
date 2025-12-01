import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Calculator } from "lucide-react";

interface Person {
  name: string;
  balance: number;
}

interface SplitBillDialogProps {
  people: Person[];
  onSuccess: () => void;
}

const amountSchema = z.number()
  .positive({ message: "Amount must be greater than zero" })
  .finite({ message: "Amount must be a valid number" })
  .max(99999999.99, { message: "Amount is too large" });

export const SplitBillDialog = ({ people, onSuccess }: SplitBillDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    selectedPeople: [] as string[],
    includeSelf: true,
  });

  const handlePersonToggle = (name: string) => {
    setFormData(prev => {
      const selected = prev.selectedPeople.includes(name)
        ? prev.selectedPeople.filter(p => p !== name)
        : [...prev.selectedPeople, name];
      return { ...prev, selectedPeople: selected };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedPeople.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one person to split with.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate amount
      const parsedAmount = parseFloat(formData.amount);
      const validationResult = amountSchema.safeParse(parsedAmount);
      
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
      }

      const totalAmount = validationResult.data;
      const splitCount = formData.selectedPeople.length + (formData.includeSelf ? 1 : 0);
      const splitAmount = totalAmount / splitCount;

      // Create records for each selected person
      const records = formData.selectedPeople.map(personName => ({
        user_id: user.id,
        type: "lent", // You paid, so you lent them money
        person_name: personName,
        amount: parseFloat(splitAmount.toFixed(2)),
        description: `Split Bill: ${formData.description || "Expense"}`,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      }));

      const { error } = await supabase.from("lend_borrow").insert(records);

      if (error) throw error;

      toast({
        title: "Bill Split Successfully! 🎉",
        description: `Added ₹${splitAmount.toFixed(2)} to ${formData.selectedPeople.length} people.`,
      });

      setOpen(false);
      setFormData({
        amount: "",
        description: "",
        selectedPeople: [],
        includeSelf: true,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to split bill.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full shadow-sm hover:shadow-md transition-all">
          <Calculator className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Split Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-none bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Split Bill
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Dinner, Taxi, etc."
              maxLength={100}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Select People</Label>
            <ScrollArea className="h-[150px] border rounded-md p-2">
              {people.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No contacts found.</p>
              ) : (
                <div className="space-y-2">
                  {people.map((person) => (
                    <div key={person.name} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                      <Checkbox 
                        id={`person-${person.name}`}
                        checked={formData.selectedPeople.includes(person.name)}
                        onCheckedChange={() => handlePersonToggle(person.name)}
                      />
                      <Label htmlFor={`person-${person.name}`} className="flex-1 cursor-pointer font-medium">
                        {person.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="includeSelf" 
              checked={formData.includeSelf}
              onCheckedChange={(checked) => setFormData({ ...formData, includeSelf: checked as boolean })}
            />
            <Label htmlFor="includeSelf" className="cursor-pointer">
              Include myself in the split
            </Label>
          </div>

          {formData.amount && formData.selectedPeople.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span>Total:</span>
                <span className="font-bold">₹{parseFloat(formData.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Split by:</span>
                <span>{formData.selectedPeople.length + (formData.includeSelf ? 1 : 0)} people</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/50 text-primary font-bold">
                <span>Per Person:</span>
                <span>₹{(parseFloat(formData.amount) / (formData.selectedPeople.length + (formData.includeSelf ? 1 : 0))).toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full rounded-xl h-11 shadow-lg" disabled={loading}>
            {loading ? "Splitting..." : "Split Bill"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

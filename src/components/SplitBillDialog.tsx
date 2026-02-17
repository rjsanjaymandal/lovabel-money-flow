import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Receipt,
  Calculator,
  Users,
  IndianRupee,
  Check,
  X,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface Person {
  name: string;
  balance: number;
}

interface SplitBillDialogProps {
  people: Person[];
  onSuccess: () => void;
}

const amountSchema = z
  .number()
  .positive({ message: "Amount must be greater than zero" })
  .finite({ message: "Amount must be a valid number" })
  .max(99999999.99, { message: "Amount is too large" });

export const SplitBillDialog = ({
  people,
  onSuccess,
}: SplitBillDialogProps) => {
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
    setFormData((prev) => {
      const selected = prev.selectedPeople.includes(name)
        ? prev.selectedPeople.filter((p) => p !== name)
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate amount
      const parsedAmount = parseFloat(formData.amount);
      const validationResult = amountSchema.safeParse(parsedAmount);

      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
      }

      const totalAmount = validationResult.data;
      const splitCount =
        formData.selectedPeople.length + (formData.includeSelf ? 1 : 0);
      const splitAmount = totalAmount / splitCount;

      // Create records for each selected person
      const records = formData.selectedPeople.map((personName) => ({
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
        description: `Added ₹${splitAmount.toFixed(2)} to ${
          formData.selectedPeople.length
        } people.`,
      });

      setOpen(false);
      setFormData({
        amount: "",
        description: "",
        selectedPeople: [],
        includeSelf: true,
      });
      onSuccess();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to split bill.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();

  const SplitForm = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="amount"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1"
          >
            Total Amount (₹)
          </Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <IndianRupee className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
              className="pl-12 h-14 rounded-2xl text-2xl font-bold bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1"
          >
            Description
          </Label>
          <Input
            id="description"
            placeholder="Dinner, Taxi, etc."
            maxLength={100}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
            Select People
          </Label>
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
            <ScrollArea className="h-[180px] p-2">
              {people.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-40">
                  <Users className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">No contacts found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {people.map((person) => (
                    <div
                      key={person.name}
                      onClick={() => handlePersonToggle(person.name)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98]",
                        formData.selectedPeople.includes(person.name)
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-white/5 border border-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                          formData.selectedPeople.includes(person.name)
                            ? "bg-primary border-primary text-white"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {formData.selectedPeople.includes(person.name) && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "flex-1 font-medium text-sm",
                          formData.selectedPeople.includes(person.name)
                            ? "text-primary"
                            : "text-foreground/70",
                        )}
                      >
                        {person.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div
          onClick={() =>
            setFormData((prev) => ({ ...prev, includeSelf: !prev.includeSelf }))
          }
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer active:scale-[0.98] transition-all"
        >
          <Checkbox id="includeSelf" checked={formData.includeSelf} />
          <Label
            htmlFor="includeSelf"
            className="cursor-pointer text-sm font-semibold text-foreground/80"
          >
            Include myself in the split
          </Label>
        </div>

        {formData.amount && formData.selectedPeople.length > 0 && (
          <div className="bg-primary/5 border border-primary/10 p-4 rounded-[1.5rem] animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-1 text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
              <span>Per Person</span>
              <span>
                Split by{" "}
                {formData.selectedPeople.length +
                  (formData.includeSelf ? 1 : 0)}{" "}
                People
              </span>
            </div>
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-black text-primary tracking-tight">
                ₹
                {(
                  parseFloat(formData.amount) /
                  (formData.selectedPeople.length +
                    (formData.includeSelf ? 1 : 0))
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h3>
              <div className="text-[10px] font-bold text-primary/60 mb-1">
                Total ₹{parseFloat(formData.amount).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/25 bg-primary active:scale-95 transition-all mt-4"
        disabled={loading}
      >
        <Calculator className="w-5 h-5 mr-2" />
        {loading ? "Processing..." : "Finish Split"}
      </Button>
    </form>
  );

  const TriggerButton = (
    <Button
      variant="outline"
      className="rounded-full shadow-sm hover:shadow-md transition-all h-10 px-4 border-white/10 bg-white/5"
    >
      <Calculator className="w-4 h-4 mr-2" />
      Split Bill
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="bg-background/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] p-6 pt-2 max-h-[96vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-6" />
          <DrawerHeader className="p-0 mb-6">
            <DrawerTitle className="text-2xl font-black tracking-tight text-center">
              Split Bill
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Split an expense with your contacts
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto no-scrollbar pb-10">{SplitForm}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/5 bg-card/95 backdrop-blur-2xl shadow-2xl p-8 rounded-[2.5rem]">
        <DialogHeader className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight text-center">
            Split Bill
          </DialogTitle>
        </DialogHeader>
        {SplitForm}
      </DialogContent>
    </Dialog>
  );
};

import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { SplitBillDialog } from "@/components/SplitBillDialog";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const amountSchema = z
  .number()
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

export function LendBorrowView({
  people,
  userId,
  onPersonAdded,
}: LendBorrowViewProps) {
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
      .filter((p) => p.balance > 0)
      .reduce((sum, p) => sum + p.balance, 0);

    const totalYouOwe = people
      .filter((p) => p.balance < 0)
      .reduce((sum, p) => sum + Math.abs(p.balance), 0);

    return { totalOwedToYou, totalYouOwe };
  }, [people]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.includes("Amount")
          ? error.message
          : "Unable to add contact. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isMobile = useIsMobile();

  const AddContactForm = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="person"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1"
          >
            Name
          </Label>
          <div className="relative group">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="person"
              placeholder="e.g. John Doe"
              maxLength={100}
              value={formData.person_name}
              onChange={(e) =>
                setFormData({ ...formData, person_name: e.target.value })
              }
              required
              className="pl-10 h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1"
            >
              Amount (Optional)
            </Label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors font-bold text-sm">
                ₹
              </span>
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
                className="pl-7 h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all font-bold"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="date"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1"
            >
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
              className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1"
          >
            Note (Optional)
          </Label>
          <Input
            id="description"
            placeholder="What's this for?"
            maxLength={500}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/20 bg-primary active:scale-95 transition-all mt-4"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create Contact
      </Button>
    </form>
  );

  const DrawerDialogContent = isMobile ? (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 bg-primary text-primary-foreground px-4 sm:px-6 h-12 font-bold">
          <Plus className="w-5 h-5 mr-2" />
          Add New
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-background/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] p-6 pt-2 max-h-[90vh]">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-6" />
        <DrawerHeader className="p-0 mb-6">
          <DrawerTitle className="text-2xl font-black tracking-tight text-center">
            Add Contact
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Create a new contact to track lending
          </DrawerDescription>
        </DrawerHeader>
        <div className="pb-10">{AddContactForm}</div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 bg-primary text-primary-foreground px-4 sm:px-6 h-11 font-bold">
          <Plus className="w-5 h-5 mr-2" />
          Add New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/5 bg-card/95 backdrop-blur-2xl shadow-2xl p-8 rounded-[2.5rem]">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-black tracking-tight text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Add Contact
          </DialogTitle>
        </DialogHeader>
        {AddContactForm}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* ... previous content ... */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Summary Cards */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 sm:p-5 relative">
            <div className="absolute top-2 right-2 opacity-10 rotate-12">
              <ArrowUpRight className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="relative pt-12">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 font-bold shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                  You're Owed
                </span>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600 tracking-tight">
                ₹{stats.totalOwedToYou.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-rose-500/10 to-rose-500/5 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-4 sm:p-5 relative">
            <div className="absolute top-2 right-2 opacity-10 -rotate-12">
              <ArrowDownLeft className="w-24 h-24 text-rose-500" />
            </div>
            <div className="relative pt-12">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500 font-bold shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                  You Owe
                </span>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-rose-600 tracking-tight">
                ₹{stats.totalYouOwe.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header & Add Button */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            People
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {people.length} active{" "}
            {people.length === 1 ? "contact" : "contacts"}
          </p>
        </div>

        <div className="flex gap-2">
          <AddTransactionDialog>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 shadow-sm border-white/10 bg-white/5 active:scale-90"
              title="Add Transaction"
            >
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </Button>
          </AddTransactionDialog>
          <SplitBillDialog people={people} onSuccess={onPersonAdded} />
          {DrawerDialogContent}
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
              onClick={() =>
                navigate(`/person/${encodeURIComponent(person.name)}`)
              }
              className="group cursor-pointer border-none bg-card/40 hover:bg-card/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${
                  person.balance >= 0 ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />

              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg ${
                        person.balance >= 0
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg leading-none mb-1.5 group-hover:text-primary transition-colors">
                        {person.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] sm:text-xs font-medium border-0 ${
                          person.balance >= 0
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {person.balance >= 0 ? "Owes you" : "You owe"}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg sm:text-xl font-bold tracking-tight ${
                        person.balance >= 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      ₹{Math.abs(person.balance).toLocaleString()}
                    </p>
                    <ArrowUpRight
                      className={`w-4 h-4 ml-auto mt-1 opacity-50 ${
                        person.balance >= 0
                          ? "text-emerald-500"
                          : "text-rose-500 rotate-180"
                      }`}
                    />
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

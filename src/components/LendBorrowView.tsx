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
import { motion } from "framer-motion";

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
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-500/10 backdrop-blur-3xl border border-emerald-500/10 p-6 flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <ArrowUpRight className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative pt-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                You're Owed
              </span>
            </div>
            <p className="text-3xl font-black text-foreground tracking-tighter">
              ₹{stats.totalOwedToYou.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] bg-rose-500/10 backdrop-blur-3xl border border-rose-500/10 p-6 flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <ArrowDownLeft className="w-24 h-24 text-rose-500" />
          </div>
          <div className="relative pt-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/80">
                You Owe
              </span>
            </div>
            <p className="text-3xl font-black text-foreground tracking-tighter">
              ₹{stats.totalYouOwe.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Header & Actions */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            People
            <span className="text-xs font-bold text-muted-foreground/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {people.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <AddTransactionDialog>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl w-12 h-12 bg-white/5 border border-white/5 text-muted-foreground active:scale-90"
            >
              <Wallet className="w-5 h-5" />
            </Button>
          </AddTransactionDialog>
          <SplitBillDialog people={people} onSuccess={onPersonAdded} />
          {DrawerDialogContent}
        </div>
      </div>

      {/* People List/Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {people.length === 0 ? (
          <div className="col-span-full py-20 px-4 rounded-[3rem] bg-white/5 border border-dashed border-white/10 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-muted-foreground/20">
              <Users className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground/80">
                No contacts yet
              </h3>
              <p className="text-sm text-muted-foreground/40 max-w-[200px] mx-auto">
                Start tracking who owes you and who you owe.
              </p>
            </div>
          </div>
        ) : (
          people.map((person, index) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() =>
                navigate(`/person/${encodeURIComponent(person.name)}`)
              }
              className="relative group cursor-pointer"
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-[2.25rem] transition-all duration-300 group-hover:scale-[1.02] -z-10 bg-background/40 backdrop-blur-3xl border border-white/5 shadow-xl group-hover:shadow-primary/5 group-hover:border-white/10",
                  person.balance >= 0
                    ? "group-hover:bg-emerald-500/5"
                    : "group-hover:bg-rose-500/5",
                )}
              />

              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg transition-transform duration-500 group-hover:rotate-6",
                      person.balance >= 0
                        ? "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10"
                        : "bg-rose-500/10 text-rose-500 shadow-rose-500/10",
                    )}
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-lg text-foreground truncate">
                      {person.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0 animate-pulse",
                          person.balance >= 0
                            ? "bg-emerald-500"
                            : "bg-rose-500",
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          person.balance >= 0
                            ? "text-emerald-500/60"
                            : "text-rose-500/60",
                        )}
                      >
                        {person.balance >= 0
                          ? "Settlement Pending"
                          : "Payment Overdue"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <p
                    className={cn(
                      "text-xl font-black tracking-tighter tabular-nums",
                      person.balance >= 0
                        ? "text-emerald-500"
                        : "text-rose-500",
                    )}
                  >
                    ₹{Math.abs(person.balance).toLocaleString()}
                  </p>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/10",
                      person.balance >= 0
                        ? "text-emerald-500"
                        : "text-rose-500",
                    )}
                  >
                    <ArrowUpRight
                      className={cn(
                        "w-4 h-4",
                        person.balance < 0 && "rotate-180",
                      )}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

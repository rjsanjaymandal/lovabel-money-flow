import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Tag,
  FileText,
  IndianRupee,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScanReceiptButton } from "@/components/ScanReceiptButton";
import { ScannedReceiptData } from "@/utils/receiptParser";
import { checkAchievement } from "@/utils/gamification";
import { VoiceInput } from "@/components/VoiceInput";
import { VoiceData } from "@/utils/voiceParser";

interface AddTransactionDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
  categories?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValues?: {
    amount: string;
    description: string;
    type: "expense" | "income";
    category?: string;
  };
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

const amountSchema = z
  .number()
  .positive({ message: "Amount must be greater than zero" })
  .finite({ message: "Amount must be a valid number" })
  .max(99999999.99, { message: "Amount is too large" });

export const AddTransactionDialog = ({
  children,
  onSuccess,
  categories = DEFAULT_CATEGORIES,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultValues,
}: AddTransactionDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const [formData, setFormData] = useState({
    type: "expense" as "expense" | "income",
    amount: "",
    category: "",
    description: "",
    date: new Date(),
  });

  // Update form data when defaultValues change or dialog opens
  useEffect(() => {
    if (defaultValues && open) {
      setFormData((prev) => ({
        ...prev,
        ...defaultValues,
        category: defaultValues.category || prev.category,
        date: new Date(),
      }));
    }
  }, [defaultValues, open]);

  // Reset or populate on open
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && defaultValues) {
      setFormData((prev) => ({
        ...prev,
        ...defaultValues,
        category: defaultValues.category || prev.category,
      }));
    } else if (newOpen) {
      // Reset if no default values
      setFormData({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date(),
      });
    }
  };

  const handleScanComplete = (data: ScannedReceiptData) => {
    setFormData((prev) => ({
      ...prev,
      amount: data.amount ? data.amount.toString() : prev.amount,
      date: data.date || prev.date,
      description: data.merchant || prev.description,
      category: data.category || prev.category,
      type: "expense", // Receipts are usually expenses
    }));
  };

  const handleVoiceResult = (data: VoiceData) => {
    setFormData((prev) => ({
      ...prev,
      amount: data.amount || prev.amount,
      category: data.category || prev.category,
      description: data.description || prev.description,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: formData.type,
        amount: validationResult.data,
        category: formData.category || "Other",
        description: formData.description || null,
        date: format(formData.date, "yyyy-MM-dd"),
      });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: `${
          formData.type === "expense" ? "Expense" : "Income"
        } of ₹${formData.amount} added.`,
        className: "bg-emerald-500 text-white border-none",
      });

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.includes("Amount")
          ? error.message
          : "Unable to add transaction. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-0">
      <div className="px-6 pb-6">
        <Tabs
          defaultValue="expense"
          value={formData.type}
          onValueChange={(v) =>
            setFormData({ ...formData, type: v as "expense" | "income" })
          }
          className="w-full mb-6"
        >
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
            <TabsTrigger
              value="expense"
              className="rounded-lg data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all font-bold"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Expense
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all font-bold"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Income
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Amount Input - Hero Style */}
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <IndianRupee
              className={cn(
                "h-8 w-8 transition-colors",
                formData.type === "expense"
                  ? "text-rose-500"
                  : "text-emerald-500",
              )}
            />
          </div>
          <Input
            type="number"
            step="0.01"
            placeholder="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className={cn(
              "pl-12 h-20 text-5xl font-bold border-2 border-muted bg-transparent shadow-none focus-visible:ring-0 transition-colors rounded-2xl",
              formData.type === "expense"
                ? "focus:border-rose-500 text-rose-500 placeholder:text-rose-200"
                : "focus:border-emerald-500 text-emerald-500 placeholder:text-emerald-200",
            )}
            required
            autoFocus
          />
        </div>

        <div className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">
              Category
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground mr-2" />
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                required
              >
                <SelectTrigger className="pl-10 h-12 rounded-xl bg-muted/30 border-muted-foreground/10 focus:ring-primary/20">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/5 bg-background/95 backdrop-blur-xl">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="rounded-lg mb-1"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal h-12 rounded-xl bg-muted/30 border-muted-foreground/10 hover:bg-muted/40",
                    !formData.date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {formData.date ? (
                    format(formData.date, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-3xl overflow-hidden border-white/5"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) =>
                    date && setFormData({ ...formData, date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider">
              Note
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                placeholder="What was this for?"
                maxLength={500}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="pl-10 min-h-[100px] rounded-xl bg-muted/30 border-muted-foreground/10 resize-none focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-2">
        <Button
          type="submit"
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-95",
            formData.type === "expense"
              ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/25"
              : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25",
          )}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : `Save ${formData.type === "expense" ? "Expense" : "Income"}`}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="bg-background/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] max-h-[96vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-3 mb-2" />
          <DrawerHeader className="relative px-6">
            <div className="absolute right-6 top-0 flex gap-2">
              <ScanReceiptButton
                onScanComplete={handleScanComplete}
                variant="ghost"
                className="h-10 w-10 p-0 rounded-full bg-muted/50"
              />
              <VoiceInput
                onResult={handleVoiceResult}
                variant="ghost"
                className="h-10 w-10 p-0 rounded-full bg-muted/50"
              />
            </div>
            <DrawerTitle className="text-2xl font-black tracking-tight text-center mt-2">
              {formData.type === "expense" ? "New Expense" : "New Income"}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Enter transaction details
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto no-scrollbar pb-8">{FormContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px] border-white/5 bg-card/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
        <DialogHeader className="p-8 pb-2 relative">
          <div className="absolute left-8 top-8 z-10 flex gap-2">
            <ScanReceiptButton
              onScanComplete={handleScanComplete}
              className="h-10 w-10 p-0 rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
            />
            <VoiceInput
              onResult={handleVoiceResult}
              className="h-10 w-10 p-0 rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
            />
          </div>
          <DialogTitle className="text-3xl font-black text-center tracking-tight">
            {formData.type === "expense" ? "New Expense" : "New Income"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Enter the details of your new {formData.type}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">{FormContent}</div>
      </DialogContent>
    </Dialog>
  );
};

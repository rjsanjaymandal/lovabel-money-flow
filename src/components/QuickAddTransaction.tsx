import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
    Plus,
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar as CalendarIcon,
    Tag,
    FileText,
    Mic,
    Scan,
    Check,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInput } from "./VoiceInput";
import { ScanReceiptButton } from "./ScanReceiptButton";

interface QuickAddTransactionProps {
    userId: string;
    categories: string[];
    onSuccess: () => void;
}

export function QuickAddTransaction({
    userId,
    categories,
    onSuccess,
}: QuickAddTransactionProps) {
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        type: "expense" as "expense" | "income",
        amount: "",
        category: "",
        description: "",
        date: new Date(),
    });

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.amount || !formData.category) {
            toast({
                title: "Missing info",
                description: "Please enter an amount and category.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const parsedAmount = parseFloat(formData.amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error("Invalid amount");
            }

            const { error } = await supabase.from("transactions").insert({
                user_id: userId,
                type: formData.type,
                amount: parsedAmount,
                category: formData.category,
                description: formData.description || null,
                date: format(formData.date, "yyyy-MM-dd"),
            });

            if (error) throw error;

            toast({
                title: "Transaction Added",
                description: `₹${formData.amount} added to ${formData.category}`,
                className: "bg-emerald-500 text-white border-none",
            });

            // Reset form
            setFormData({
                type: "expense",
                amount: "",
                category: "",
                description: "",
                date: new Date(),
            });
            setIsExpanded(false);
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full relative group">
            <motion.div
                layout
                className={cn(
                    "bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl transition-all duration-500 overflow-hidden",
                    isExpanded ? "p-6" : "p-2"
                )}
            >
                {!isExpanded ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="flex-1 flex items-center gap-3 px-4 py-3 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium tracking-tight">Quick add transaction...</span>
                        </button>
                        <div className="flex items-center gap-1.5 px-2">
                            <VoiceInput
                                onResult={(data) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        amount: data.amount || prev.amount,
                                        category: data.category || prev.category,
                                        description: data.description || prev.description,
                                    }));
                                    setIsExpanded(true);
                                }}
                                variant="ghost"
                                className="h-10 w-10 rounded-xl hover:bg-white/10 text-primary"
                            />
                            <ScanReceiptButton
                                onScanComplete={(data) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        amount: data.amount?.toString() || prev.amount,
                                        description: data.merchant || prev.description,
                                        category: data.category || prev.category,
                                        date: data.date || prev.date,
                                    }));
                                    setIsExpanded(true);
                                }}
                                variant="ghost"
                                className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-primary"
                            />
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Header with Type Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex bg-muted/30 p-1 rounded-2xl gap-1">
                                <button
                                    onClick={() => setFormData({ ...formData, type: "expense" })}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                        formData.type === "expense"
                                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <ArrowDownCircle className="w-3.5 h-3.5" />
                                    Expense
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, type: "income" })}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                        formData.type === "income"
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <ArrowUpCircle className="w-3.5 h-3.5" />
                                    Income
                                </button>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpanded(false)}
                                className="h-8 w-8 rounded-full hover:bg-white/10"
                            >
                                <Plus className="w-4 h-4 rotate-45" />
                            </Button>
                        </div>

                        {/* Main Inputs Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Amount - Hero Style */}
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold opacity-30 group-focus-within:opacity-100 transition-opacity">₹</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="h-16 pl-10 text-3xl font-black bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 transition-all placeholder:text-muted-foreground/20"
                                    autoFocus
                                />
                            </div>

                            {/* Category, Date & Note Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Category Select */}
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 text-base font-medium">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-primary/60" />
                                            <SelectValue placeholder="Category" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat} className="rounded-xl mb-1">{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Date Popover */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-14 px-4 bg-white/5 border-white/5 rounded-2xl hover:bg-white/10 transition-all text-sm font-medium"
                                        >
                                            <CalendarIcon className="w-4 h-4 mr-2 text-primary/60" />
                                            {format(formData.date, "MMM d, yyyy")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-white/10 bg-background/95 backdrop-blur-xl" align="center">
                                        <Calendar
                                            mode="single"
                                            selected={formData.date}
                                            onSelect={(d) => d && setFormData({ ...formData, date: d })}
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* Note/Description */}
                                <div className="relative group sm:col-span-2 lg:col-span-1">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Add Note"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="h-14 pl-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 transition-all placeholder:text-muted-foreground/20"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Footer Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <VoiceInput
                                    onResult={(data) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            amount: data.amount || prev.amount,
                                            category: data.category || prev.category,
                                            description: data.description || prev.description,
                                        }));
                                    }}
                                    variant="outline"
                                    className="h-12 w-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-primary"
                                />
                                <ScanReceiptButton
                                    onScanComplete={(data) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            amount: data.amount?.toString() || prev.amount,
                                            description: data.merchant || prev.description,
                                            category: data.category || prev.category,
                                            date: data.date || prev.date,
                                        }));
                                    }}
                                    variant="outline"
                                    className="h-12 w-12 p-0 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-primary"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsExpanded(false)}
                                    className="h-12 px-6 rounded-2xl font-semibold text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleSubmit()}
                                    disabled={loading}
                                    className={cn(
                                        "h-12 px-8 rounded-2xl font-bold shadow-xl transition-all active:scale-95",
                                        formData.type === "expense"
                                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                            : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                                    )}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Check className="w-5 h-5" />
                                            Add {formData.type === "expense" ? "Expense" : "Income"}
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

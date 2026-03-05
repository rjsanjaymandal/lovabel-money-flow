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
        } catch (error) {
            toast({
                title: "Error",
                description: (error as Error).message || "Something went wrong",
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
                    "glass-card transition-all duration-500 overflow-hidden",
                    isExpanded ? "p-6 sm:p-8" : "p-2"
                )}
            >
                {!isExpanded ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="flex-1 flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white/70 transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-violet-400" />
                            </div>
                            <span className="font-semibold tracking-tight text-lg">Quick add transaction...</span>
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
                                className="h-10 w-10 rounded-xl hover:bg-white/10 text-violet-400"
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
                                className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-violet-400"
                            />
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        {/* Header with Type Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] gap-1.5 backdrop-blur-xl border border-white/5">
                                <button
                                    onClick={() => setFormData({ ...formData, type: "expense" })}
                                    className={cn(
                                        "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2",
                                        formData.type === "expense"
                                            ? "gradient-error-vibrant shadow-rose-500/40"
                                            : "text-white/40 hover:text-white/70"
                                    )}
                                >
                                    <ArrowDownCircle className="w-4 h-4" />
                                    Expense
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, type: "income" })}
                                    className={cn(
                                        "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2",
                                        formData.type === "income"
                                            ? "gradient-success-vibrant shadow-emerald-500/40"
                                            : "text-white/40 hover:text-white/70"
                                    )}
                                >
                                    <ArrowUpCircle className="w-4 h-4" />
                                    Income
                                </button>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpanded(false)}
                                className="h-10 w-10 rounded-2xl hover:bg-white/10 text-white/50"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </Button>
                        </div>

                        {/* Main Inputs Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            {/* Amount - Hero Style */}
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black opacity-20 group-focus-within:opacity-100 transition-opacity text-violet-400">₹</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="h-24 pl-14 text-5xl font-black bg-white/5 border-white/5 rounded-[2rem] focus:ring-violet-500/30 transition-all placeholder:text-white/10 text-white selection:bg-violet-500/30"
                                    autoFocus
                                />
                            </div>

                            {/* Category, Date & Note Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Category Select */}
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger className="h-16 bg-white/5 border-white/5 rounded-2xl focus:ring-violet-500/30 text-white/80 font-semibold group hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Tag className="w-5 h-5 text-violet-400/60 group-hover:text-violet-400 transition-colors" />
                                            <SelectValue placeholder="Category" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-3xl border-white/10 bg-slate-900/90 backdrop-blur-3xl text-white">
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat} className="rounded-2xl mb-1 focus:bg-violet-500/20 focus:text-white">{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Date Popover */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-16 px-6 bg-white/5 border-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/80 font-semibold flex justify-start gap-3"
                                        >
                                            <CalendarIcon className="w-5 h-5 text-violet-400/60" />
                                            {format(formData.date, "MMM d, yyyy")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-[2.5rem] overflow-hidden border-white/10 bg-slate-900/95 backdrop-blur-3xl" align="center">
                                        <Calendar
                                            mode="single"
                                            selected={formData.date}
                                            onSelect={(d) => d && setFormData({ ...formData, date: d })}
                                            className="p-4"
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* Note/Description */}
                                <div className="relative group sm:col-span-2 lg:col-span-1">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-violet-400 transition-colors" />
                                    <Input
                                        placeholder="Add a quick note..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="h-16 pl-12 bg-white/5 border-white/5 rounded-2xl focus:ring-violet-500/30 transition-all placeholder:text-white/10 text-white"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
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
                                    className="h-14 w-14 rounded-2xl border-white/5 bg-white/5 hover:bg-violet-500/20 text-violet-400 transition-all"
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
                                    className="h-14 w-14 p-0 rounded-2xl border-white/5 bg-white/5 hover:bg-violet-500/20 text-violet-400 transition-all"
                                />
                                <span className="text-xs font-bold text-white/20 uppercase tracking-widest ml-2">Smart Input</span>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsExpanded(false)}
                                    className="h-14 px-8 rounded-2xl font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all flex-1 sm:flex-none"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleSubmit()}
                                    disabled={loading}
                                    className={cn(
                                        "h-14 px-10 rounded-2xl font-black shadow-2xl transition-all active:scale-95 flex-1 sm:flex-none text-lg",
                                        formData.type === "expense"
                                            ? "gradient-error-vibrant"
                                            : "gradient-success-vibrant"
                                    )}
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Check className="w-6 h-6" />
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

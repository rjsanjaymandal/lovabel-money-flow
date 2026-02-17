import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import {
  format,
  subDays,
  isSameDay,
  isAfter,
  startOfWeek,
  endOfWeek,
  subWeeks,
} from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import { Transaction } from "@/types/finance";

interface AIInsightsProps {
  userId: string;
  selectedMonth: Date;
  income: number;
  expenses: number;
  transactions: Transaction[];
  budget?: number;
  userName?: string;
}

type MessageType = "text" | "chart" | "list" | "insight";

interface Message {
  role: "ai" | "user";
  content: string;
  type?: MessageType;
  data?: unknown; // Changed from any to unknown
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Spending breakdown",
  "Top expenses",
  "Budget health",
  "Recent food spend",
];

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
];

// ... (Keep existing Helper Functions: CATEGORY_ALIASES, getRandomResponse, findCategory, filterTransactionsByTime) ...
// --- 1. Expanded Dictionary ---
const CATEGORY_ALIASES: Record<string, string[]> = {
  food: [
    "groceries",
    "dining",
    "restaurants",
    "eating out",
    "swiggy",
    "zomato",
    "snacks",
    "lunch",
    "dinner",
    "breakfast",
    "coffee",
    "cafe",
    "drinks",
    "bar",
    "pizza",
    "burger",
  ],
  transport: [
    "transportation",
    "uber",
    "ola",
    "rapido",
    "taxi",
    "cab",
    "fuel",
    "gas",
    "petrol",
    "diesel",
    "bus",
    "train",
    "metro",
    "flight",
    "ticket",
    "travel",
  ],
  shopping: [
    "clothing",
    "clothes",
    "apparel",
    "myntra",
    "ajio",
    "amazon",
    "flipkart",
    "electronics",
    "gadgets",
    "shoes",
    "accessories",
    "mall",
  ],
  bills: [
    "utilities",
    "rent",
    "internet",
    "wifi",
    "broadband",
    "phone",
    "recharge",
    "mobile",
    "electricity",
    "water",
    "gas bill",
    "maintenance",
  ],
  entertainment: [
    "movies",
    "cinema",
    "bookmyshow",
    "netflix",
    "prime",
    "hotstar",
    "spotify",
    "games",
    "steam",
    "playstation",
    "xbox",
    "fun",
    "outing",
  ],
  health: [
    "medical",
    "doctor",
    "medicine",
    "pharmacy",
    "gym",
    "fitness",
    "yoga",
    "hospital",
    "checkup",
  ],
  education: [
    "fees",
    "tuition",
    "books",
    "course",
    "learning",
    "school",
    "college",
    "udemy",
    "coursera",
  ],
};

const getRandomResponse = (responses: string[]) =>
  responses[Math.floor(Math.random() * responses.length)];

const findCategory = (query: string, categories: string[]) => {
  const lowerQuery = query.toLowerCase();
  const direct = categories.find((c) => lowerQuery.includes(c.toLowerCase()));
  if (direct) return direct;
  for (const [key, values] of Object.entries(CATEGORY_ALIASES)) {
    if (
      lowerQuery.includes(key) ||
      values.some((v) => lowerQuery.includes(v))
    ) {
      const match = categories.find((c) => c.toLowerCase().includes(key));
      if (match) return match;
      const aliasMatch = categories.find((c) =>
        values.some((v) => c.toLowerCase().includes(v)),
      );
      if (aliasMatch) return aliasMatch;
    }
  }
  return null;
};

const filterTransactionsByTime = (
  transactions: Transaction[],
  query: string,
) => {
  const lowerQuery = query.toLowerCase();
  const today = new Date();
  if (lowerQuery.includes("yesterday"))
    return transactions.filter((t) =>
      isSameDay(new Date(t.date), subDays(today, 1)),
    );
  if (lowerQuery.includes("today"))
    return transactions.filter((t) => isSameDay(new Date(t.date), today));
  if (lowerQuery.includes("last week")) {
    const start = startOfWeek(subWeeks(today, 1));
    const end = endOfWeek(subWeeks(today, 1));
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return isAfter(d, start) && d < end;
    });
  }
  return transactions;
};

export const AIInsights = ({
  userId,
  selectedMonth,
  income,
  expenses,
  transactions,
  budget = 0,
  userName = "Friend",
}: AIInsightsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: `Hey! I'm ready to analyze your finances. 📊\nAsk me about your budget, spending trends, or specific purchases.`,
      type: "text",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const clearChat = () =>
    setMessages([
      {
        role: "ai",
        content: `Chat history cleared. What's on your mind?`,
        timestamp: new Date(),
      },
    ]);

  // ... (Keep existing analyzeRequest Logic exactly as is) ...
  const analyzeRequest = (query: string): Partial<Message> => {
    const lowerQuery = query.toLowerCase();
    const relevantTransactions = filterTransactionsByTime(transactions, query);
    const timeContext = lowerQuery.includes("yesterday")
      ? "yesterday"
      : lowerQuery.includes("last week")
        ? "last week"
        : "this month";
    const categories = [
      ...new Set(transactions.map((t) => t.category || "")),
    ].filter(Boolean);

    try {
      if (
        lowerQuery.includes("breakdown") ||
        lowerQuery.includes("chart") ||
        lowerQuery.includes("graph") ||
        (lowerQuery.includes("where") && lowerQuery.includes("go"))
      ) {
        const categoryTotals: Record<string, number> = {};
        relevantTransactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            const cat = t.category || "Uncategorized";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
          });
        const chartData = Object.entries(categoryTotals)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        if (chartData.length > 0)
          return {
            content: `Spending breakdown for ${timeContext}. Top: **${chartData[0].name}**.`,
            type: "chart",
            data: chartData,
          };
        return { content: `No spending data for ${timeContext}.` };
      }
      if (
        lowerQuery.includes("highest") ||
        lowerQuery.includes("biggest") ||
        lowerQuery.includes("top expense")
      ) {
        const topExpenses = relevantTransactions
          .filter((t) => t.type === "expense")
          .sort((a, b) => Number(b.amount) - Number(a.amount))
          .slice(0, 3);
        if (topExpenses.length > 0)
          return {
            content: `Top expenses for ${timeContext}:`,
            type: "list",
            data: topExpenses,
          };
        return { content: "No major expenses found." };
      }
      if (
        lowerQuery.includes("show") ||
        lowerQuery.includes("list") ||
        lowerQuery.includes("find")
      ) {
        const foundCategory = findCategory(query, categories);
        if (foundCategory) {
          const categoryTxns = relevantTransactions
            .filter((t) => t.category === foundCategory)
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 5);
          if (categoryTxns.length > 0)
            return {
              content: `Found ${categoryTxns.length} recent **${foundCategory}** transactions:`,
              type: "list",
              data: categoryTxns,
            };
        }
      }
      if (lowerQuery.includes("budget")) {
        if (budget === 0)
          return { content: "No budget set. Go to the Budget tab! 🎯" };
        const remaining = budget - expenses,
          percent = (expenses / budget) * 100;
        return {
          content:
            remaining > 0
              ? `✅ **₹${remaining.toLocaleString()}** left (${(
                  100 - percent
                ).toFixed(1)}%).`
              : `🚨 Over by **₹${Math.abs(remaining).toLocaleString()}**!`,
          type: "insight",
          data: { remaining, budget, expenses, percent },
        };
      }
      return {
        content: getRandomResponse([
          "Try asking: 'Spending breakdown', 'Top expenses', or 'Budget status'.",
        ]),
      };
    } catch (err: unknown) {
      console.error(err);
      return { content: "Error processing request." };
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, type: "text", timestamp: new Date() },
    ]);
    setInputValue("");
    setIsTyping(true);
    const delay = Math.floor(Math.random() * 500) + 600;
    setTimeout(() => {
      const response = analyzeRequest(text);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: response.content || "Error",
          type: response.type || "text",
          data: response.data,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, delay);
  };

  const renderMessageContent = (msg: Message) => (
    <div className="space-y-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p
        className="whitespace-pre-wrap leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br/>"),
        }}
      />
      {msg.type === "chart" && msg.data && (
        <div className="h-40 w-full bg-black/20 rounded-xl border border-white/5 p-2 mt-2 backdrop-blur-md shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={msg.data as Record<string, unknown>[]}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={50}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {msg.data &&
                  (msg.data as { name: string; value: number }[]).map(
                    (entry, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ),
                  )}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend iconSize={6} wrapperStyle={{ fontSize: "9px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {msg.type === "list" && msg.data && (
        <div className="space-y-1.5 mt-2">
          {msg.data &&
            (msg.data as Transaction[]).map((txn, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded-lg text-xs hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      txn.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span className="truncate max-w-[90px] text-muted-foreground">
                    {txn.description || txn.category}
                  </span>
                </div>
                <span
                  className={`font-medium ${
                    txn.type === "income" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {txn.type === "income" ? "+" : "-"}₹
                  {Number(txn.amount).toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="border-border/50 shadow-lg animate-scale-in bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative z-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/5 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            AI Financial Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get instant answers about your spending, budget, and financial
            health.
          </p>
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 cursor-pointer relative z-50 transition-all hover:scale-[1.02]"
          >
            <Bot className="w-4 h-4" />
            Open Assistant
          </Button>
        </CardContent>
      </Card>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] sm:h-[85vh] sm:max-w-lg sm:mx-auto sm:rounded-t-[32px] p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">FinBot</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 px-4 sm:px-6 py-4 bg-gradient-to-b from-transparent to-black/5">
            <div className="space-y-6 pb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-white/5 mt-1">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm transition-all duration-300 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/10"
                        : "bg-muted/50 text-foreground border border-white/5 rounded-tl-sm backdrop-blur-md"
                    }`}
                  >
                    {renderMessageContent(msg)}
                    <div
                      className={`text-[9px] mt-1.5 opacity-60 font-medium ${
                        msg.role === "user"
                          ? "text-indigo-100"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(msg.timestamp, "h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-white/5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="bg-muted/30 rounded-2xl rounded-tl-sm px-4 py-3 border border-border/30 flex items-center gap-1.5 h-10">
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Floating Input Area */}
          <div className="p-4 sm:p-5 pb-safe pt-2 bg-gradient-to-t from-background via-background to-transparent z-10 shrink-0">
            {messages.length === 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-1 px-1">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap rounded-full text-xs h-7 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:text-indigo-400"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 p-1.5 bg-muted/40 border border-white/10 rounded-[28px] shadow-lg backdrop-blur-xl transition-all focus-within:ring-1 focus-within:ring-indigo-500/30 focus-within:bg-muted/60">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full ml-0.5"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex-1 flex items-center"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask FinBot..."
                  className="border-0 bg-transparent focus-visible:ring-0 px-2 h-10 py-2.5 text-base placeholder:text-muted-foreground/60"
                />
              </form>
              <Button
                onClick={() => handleSendMessage(inputValue)}
                size="icon"
                className={`h-9 w-9 rounded-full shrink-0 transition-all duration-300 ${
                  inputValue.trim() || isTyping
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25"
                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                }`}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

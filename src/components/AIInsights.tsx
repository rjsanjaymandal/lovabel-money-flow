import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Send, Bot, User, Trash2, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, CreditCard, ChevronRight } from "lucide-react";
import { format, subDays, isSameDay, isAfter, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AIInsightsProps {
  userId: string;
  selectedMonth: Date;
  income: number;
  expenses: number;
  transactions: any[];
  budget?: number;
  userName?: string;
}

type MessageType = "text" | "chart" | "list" | "insight";

interface Message {
  role: "ai" | "user";
  content: string;
  type?: MessageType;
  data?: any;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Spending breakdown",
  "Top expenses this month",
  "Budget checker",
  "Where did my money go?",
];

const COLORS = ['#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

// --- 1. Expanded Dictionary ---
const CATEGORY_ALIASES: Record<string, string[]> = {
  "food": ["groceries", "dining", "restaurants", "eating out", "swiggy", "zomato", "snacks", "lunch", "dinner", "breakfast", "coffee", "cafe", "drinks", "bar", "pizza", "burger"],
  "transport": ["transportation", "uber", "ola", "rapido", "taxi", "cab", "fuel", "gas", "petrol", "diesel", "bus", "train", "metro", "flight", "ticket", "travel"],
  "shopping": ["clothing", "clothes", "apparel", "myntra", "ajio", "amazon", "flipkart", "electronics", "gadgets", "shoes", "accessories", "mall"],
  "bills": ["utilities", "rent", "internet", "wifi", "broadband", "phone", "recharge", "mobile", "electricity", "water", "gas bill", "maintenance"],
  "entertainment": ["movies", "cinema", "bookmyshow", "netflix", "prime", "hotstar", "spotify", "games", "steam", "playstation", "xbox", "fun", "outing"],
  "health": ["medical", "doctor", "medicine", "pharmacy", "gym", "fitness", "yoga", "hospital", "checkup"],
  "education": ["fees", "tuition", "books", "course", "learning", "school", "college", "udemy", "coursera"],
};

// --- 2. Helper Functions ---
const getRandomResponse = (responses: string[]) => responses[Math.floor(Math.random() * responses.length)];

const findCategory = (query: string, categories: string[]) => {
  const lowerQuery = query.toLowerCase();
  const direct = categories.find(c => lowerQuery.includes(c.toLowerCase()));
  if (direct) return direct;
  for (const [key, values] of Object.entries(CATEGORY_ALIASES)) {
    if (lowerQuery.includes(key) || values.some(v => lowerQuery.includes(v))) {
      const match = categories.find(c => c.toLowerCase().includes(key));
      if (match) return match;
      const aliasMatch = categories.find(c => values.some(v => c.toLowerCase().includes(v)));
      if (aliasMatch) return aliasMatch;
    }
  }
  return null;
};

const filterTransactionsByTime = (transactions: any[], query: string) => {
  const lowerQuery = query.toLowerCase();
  const today = new Date();
  if (lowerQuery.includes("yesterday")) return transactions.filter(t => isSameDay(new Date(t.date), subDays(today, 1)));
  if (lowerQuery.includes("today")) return transactions.filter(t => isSameDay(new Date(t.date), today));
  if (lowerQuery.includes("last week")) {
    const start = startOfWeek(subWeeks(today, 1));
    const end = endOfWeek(subWeeks(today, 1));
    return transactions.filter(t => { const d = new Date(t.date); return isAfter(d, start) && d < end; });
  }
  return transactions;
};

export const AIInsights = ({ userId, selectedMonth, income, expenses, transactions, budget = 0, userName = "Friend" }: AIInsightsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: `Hi ${userName}! I'm your advanced financial assistant. 🧠\n\nI can show you charts, list transactions, and analyze your budget. Try asking for a "Spending breakdown"!`,
      type: "text",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const clearChat = () => setMessages([{
    role: "ai",
    content: `Memory wiped! 🧹 Ready for a fresh start.`,
    timestamp: new Date(),
  }]);

  const analyzeRequest = (query: string): Partial<Message> => {
    const lowerQuery = query.toLowerCase();
    const relevantTransactions = filterTransactionsByTime(transactions, query);
    const timeContext = lowerQuery.includes("yesterday") ? "yesterday" : lowerQuery.includes("last week") ? "last week" : "this month";
    const categories = [...new Set(transactions.map(t => t.category || ""))].filter(Boolean);

    try {
      // --- Intent: Spending Breakdown (Chart) ---
      if (lowerQuery.includes("breakdown") || lowerQuery.includes("chart") || lowerQuery.includes("graph") || lowerQuery.includes("where") && lowerQuery.includes("go")) {
        const categoryTotals: Record<string, number> = {};
        relevantTransactions.filter(t => t.type === "expense").forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
        });

        const chartData = Object.entries(categoryTotals)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5

        if (chartData.length > 0) {
          return {
            content: `Here is your spending breakdown for ${timeContext}. The top category is **${chartData[0].name}**.`,
            type: "chart",
            data: chartData
          };
        } else {
          return { content: `No spending data found for ${timeContext} to generate a chart.` };
        }
      }

      // --- Intent: High Expenses (List) ---
      if (lowerQuery.includes("highest") || lowerQuery.includes("biggest") || lowerQuery.includes("top expense")) {
        const topExpenses = relevantTransactions
          .filter(t => t.type === "expense")
          .sort((a, b) => Number(b.amount) - Number(a.amount))
          .slice(0, 3);

        if (topExpenses.length > 0) {
          return {
            content: `Here are your biggest expenses for ${timeContext}:`,
            type: "list",
            data: topExpenses
          };
        } else {
          return { content: "No major expenses found." };
        }
      }

      // --- Intent: Specific Category List ---
      if (lowerQuery.includes("show") || lowerQuery.includes("list") || lowerQuery.includes("find")) {
        const foundCategory = findCategory(query, categories);
        if (foundCategory) {
           const categoryTxns = relevantTransactions
            .filter(t => t.category === foundCategory)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
            
           if (categoryTxns.length > 0) {
             return {
               content: `Found ${categoryTxns.length} recent transactions for **${foundCategory}**:`,
               type: "list",
               data: categoryTxns
             };
           }
        }
      }

      // --- Intent: Budget Check ---
      if (lowerQuery.includes("budget")) {
        if (budget === 0) return { content: "You haven't set a budget yet! Go to the Budget tab to set one up. 🎯" };
        const remaining = budget - expenses;
        const percent = (expenses / budget) * 100;
        return {
           content: remaining > 0 
             ? `✅ You have **₹${remaining.toLocaleString()}** left (${(100-percent).toFixed(1)}%).` 
             : `🚨 Over budget by **₹${Math.abs(remaining).toLocaleString()}**!`,
           type: "insight",
           data: { remaining, budget, expenses, percent }
        };
      }

      // Fallback
      return { content: getRandomResponse(["I can show you a 'breakdown', list 'top expenses', or check your 'budget'.", "Try asking: 'Show me food spending' or 'Spending breakdown'."]) };

    } catch (err) {
      console.error(err);
      return { content: "My circuits jammed! Try a simpler question." };
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text, type: "text", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const delay = Math.floor(Math.random() * 500) + 600;
    setTimeout(() => {
      const response = analyzeRequest(text);
      const aiMsg: Message = { 
        role: "ai", 
        content: response.content || "Error", 
        type: response.type || "text",
        data: response.data,
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  };

  const renderMessageContent = (msg: Message) => {
    return (
      <div className="space-y-3 w-full">
        <p className="whitespace-pre-wrap leading-relaxed" 
           dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} 
        />
        
        {/* Chart Render */}
        {msg.type === "chart" && msg.data && (
          <div className="h-48 w-full bg-background/50 rounded-xl border border-white/5 p-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={msg.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {msg.data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* List Render */}
        {msg.type === "list" && msg.data && (
          <div className="space-y-2 mt-2">
            {msg.data.map((txn: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-background/50 border border-white/5 rounded-xl text-xs">
                 <div className="flex items-center gap-2">
                   <div className={`p-1.5 rounded-full ${txn.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {txn.type === 'income' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                   </div>
                   <div>
                      <p className="font-medium truncate max-w-[100px]">{txn.description || txn.category}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(txn.date), 'MMM d')}</p>
                   </div>
                 </div>
                 <span className={`font-semibold ${txn.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {txn.type === 'income' ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
                 </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="border-border/50 shadow-lg animate-scale-in bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative z-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Financial Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Analysis, Charts & Smart Insights.
          </p>
          <Button 
            onClick={() => setIsOpen(true)} 
            className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 cursor-pointer relative z-50"
          >
            <Bot className="w-4 h-4" />
            Chat with Advisor
          </Button>
        </CardContent>
      </Card>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[600px] sm:max-w-md sm:mx-auto sm:rounded-t-3xl p-0 flex flex-col bg-background/95 backdrop-blur-xl border-t border-white/10">
          <SheetHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Bot className="w-5 h-5 text-indigo-500" />
              </div>
              Financial Advisor
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 pb-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-indigo-500/10 text-indigo-500"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-2xl p-3 max-w-[85%] text-sm shadow-sm ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none px-4 py-2" 
                      : "bg-muted/50 text-foreground rounded-tl-none border border-border/50"
                  }`}>
                    {renderMessageContent(msg)}
                    <p className="text-[10px] opacity-50 mt-1 text-right">
                      {format(msg.timestamp, 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3 border border-border/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Suggested Questions</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap rounded-full text-xs h-8 border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-500"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm flex gap-2 items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearChat} 
              className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2 flex-1"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your spending..."
                className="rounded-full bg-muted/50 border-border/50 focus-visible:ring-indigo-500/50 flex-1"
              />
              <Button type="submit" size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 shrink-0" disabled={!inputValue.trim() || isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
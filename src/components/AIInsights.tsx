import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Send, Bot, User, Trash2, RefreshCw } from "lucide-react";
import { format, subDays, isSameDay, isAfter, startOfWeek, endOfWeek, subWeeks } from "date-fns";

interface AIInsightsProps {
  userId: string;
  selectedMonth: Date;
  income: number;
  expenses: number;
  transactions: any[];
  budget?: number; // New prop
  userName?: string;
}

interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "How much budget left?",
  "Spending yesterday?",
  "Where did my money go?",
  "Any savings?",
];

// --- 1. Expanded Dictionary (The "Brain") ---
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

const getRandomResponse = (responses: string[]) => {
  return responses[Math.floor(Math.random() * responses.length)];
};

const findCategory = (query: string, categories: string[]) => {
  const lowerQuery = query.toLowerCase();
  
  // Direct match
  const direct = categories.find(c => lowerQuery.includes(c.toLowerCase()));
  if (direct) return direct;

  // Fuzzy match using aliases
  for (const [key, values] of Object.entries(CATEGORY_ALIASES)) {
    if (lowerQuery.includes(key) || values.some(v => lowerQuery.includes(v))) {
      // Find the first matching category in the user's actual categories that matches the key or alias
      // This is a bit tricky: we map "swiggy" -> "food", but user might have "Dining" or "Groceries".
      // We try to find a category that contains the key (e.g. "Food") or is commonly associated.
      
      // Simple heuristic: check if any user category contains the key
      const match = categories.find(c => c.toLowerCase().includes(key));
      if (match) return match;
      
      // Fallback: check if any user category matches any alias (less likely but possible)
      const aliasMatch = categories.find(c => values.some(v => c.toLowerCase().includes(v)));
      if (aliasMatch) return aliasMatch;
    }
  }
  
  return null;
};

const filterTransactionsByTime = (transactions: any[], query: string) => {
  const lowerQuery = query.toLowerCase();
  const today = new Date();

  if (lowerQuery.includes("yesterday")) {
    const yesterday = subDays(today, 1);
    return transactions.filter(t => isSameDay(new Date(t.date), yesterday));
  }
  
  if (lowerQuery.includes("today")) {
    return transactions.filter(t => isSameDay(new Date(t.date), today));
  }

  if (lowerQuery.includes("last week")) {
    const lastWeekStart = startOfWeek(subWeeks(today, 1));
    const lastWeekEnd = endOfWeek(subWeeks(today, 1));
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isAfter(d, lastWeekStart) && d < lastWeekEnd; // Rough check
    });
  }

  // Default: Return all (current month context)
  return transactions;
};

export const AIInsights = ({ userId, selectedMonth, income, expenses, transactions, budget = 0, userName = "Friend" }: AIInsightsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: `Hi ${userName}! I'm your upgraded AI Financial Advisor. 🧠\n\nI can analyze your budget, track specific days (like "yesterday"), and understand more categories. Try me!`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const clearChat = () => {
    setMessages([{
      role: "ai",
      content: `Memory wiped! 🧹 Ready for a fresh start.`,
      timestamp: new Date(),
    }]);
  };

  const analyzeRequest = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // 1. Time Filtering
    const relevantTransactions = filterTransactionsByTime(transactions, query);
    const isTimeSpecific = relevantTransactions.length !== transactions.length;
    const timeContext = lowerQuery.includes("yesterday") ? "yesterday" : lowerQuery.includes("last week") ? "last week" : "this month";

    try {
      const categories = [...new Set(transactions.map(t => t.category || ""))].filter(Boolean);

      // --- Intent: Budget Check ---
      if (lowerQuery.includes("budget") || (lowerQuery.includes("safe") && lowerQuery.includes("spend"))) {
        if (budget === 0) {
          return "You haven't set a budget yet! Go to the Budget tab to set one up. 🎯";
        }
        const remaining = budget - expenses;
        const percentUsed = (expenses / budget) * 100;
        
        if (remaining > 0) {
          if (percentUsed > 80) {
            return getRandomResponse([
              `⚠️ Careful! You have **₹${remaining.toLocaleString()}** left. You've used ${percentUsed.toFixed(0)}% of your budget.`,
              `Tight squeeze! Only **₹${remaining.toLocaleString()}** remaining. Watch your spending!`,
            ]);
          } else {
            return getRandomResponse([
              `You're safe! ✅ You have **₹${remaining.toLocaleString()}** left to spend.`,
              `Green light! 🟢 **₹${remaining.toLocaleString()}** remaining in your budget.`,
            ]);
          }
        } else {
          return getRandomResponse([
            `🚨 Alert! You're over budget by **₹${Math.abs(remaining).toLocaleString()}**.`,
            `Stop spending! 🛑 You've exceeded your budget by **₹${Math.abs(remaining).toLocaleString()}**.`,
          ]);
        }
      }

      // --- Intent: Spending Breakdown ---
      if (lowerQuery.includes("breakdown") || lowerQuery.includes("where") || lowerQuery.includes("go")) {
        const categoryTotals: Record<string, number> = {};
        relevantTransactions.filter(t => t.type === "expense").forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
        });

        const sorted = Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);

        if (sorted.length > 0) {
          const list = sorted.map(([cat, amount]) => `• **${cat}**: ₹${amount.toLocaleString()}`).join("\n");
          return `Here's your top spending for ${timeContext}:\n\n${list}`;
        } else {
          return `No spending recorded for ${timeContext}. Good job? 🤷‍♂️`;
        }
      }

      // --- Intent: Savings Analysis ---
      if (lowerQuery.includes("save") || lowerQuery.includes("savings")) {
        const savings = income - expenses;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        
        if (savings > 0) {
          return getRandomResponse([
            `You're a saver! 💰 **₹${savings.toLocaleString()}** saved (${savingsRate.toFixed(1)}%). High five! ✋`,
            `Nest egg growing! 🥚 You've saved **₹${savings.toLocaleString()}** this month.`,
          ]);
        } else {
          return `No savings right now. You're down by **₹${Math.abs(savings).toLocaleString()}**. Time to tighten the belt! 📉`;
        }
      }

      // --- Intent: Category Spending (Fuzzy) ---
      if (lowerQuery.includes("spend") || lowerQuery.includes("much") || lowerQuery.includes("cost") || lowerQuery.includes("on")) {
        const foundCategory = findCategory(query, categories);

        if (foundCategory) {
          const total = relevantTransactions
            .filter(t => t.category === foundCategory && t.type === "expense")
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          
          const count = relevantTransactions.filter(t => t.category === foundCategory && t.type === "expense").length;

          if (total === 0) {
            return `You haven't spent anything on **${foundCategory}** ${timeContext}. Nice! 👏`;
          }
          return `You spent **₹${total.toLocaleString()}** on **${foundCategory}** ${timeContext} (${count} transactions).`;
        }
      }

      // --- Intent: Highest Expense ---
      if (lowerQuery.includes("highest") || lowerQuery.includes("biggest")) {
        const expenseTxns = relevantTransactions.filter(t => t.type === "expense");
        if (expenseTxns.length > 0) {
          const highest = expenseTxns.reduce((prev, current) => ((Number(prev.amount) || 0) > (Number(current.amount) || 0)) ? prev : current);
          return `Biggest hit: **₹${highest.amount.toLocaleString()}** for "${highest.description || highest.category}" on ${format(new Date(highest.date), 'MMM d')}. 💸`;
        } else {
          return "No big expenses found.";
        }
      }

      // --- Intent: Transaction Counts ---
      if (lowerQuery.includes("how many") || lowerQuery.includes("times")) {
        const foundCategory = findCategory(query, categories);
        if (foundCategory) {
           const count = relevantTransactions.filter(t => t.category === foundCategory).length;
           return `You visited **${foundCategory}** **${count}** times ${timeContext}.`;
        }
      }

      // --- Intent: General Balance ---
      if (lowerQuery.includes("balance") || lowerQuery.includes("left")) {
        const balance = income - expenses;
        return `Balance: **₹${balance.toLocaleString()}**. ${balance > 0 ? "Keep it green! 💚" : "In the red! 🔴"}`;
      }

      // Fallback
      return getRandomResponse([
        "I'm smart, but I didn't catch that. Try asking about 'budget', 'savings', or specific categories like 'swiggy'.",
        "Hmm, not sure. Ask me 'Where did my money go?' or 'How much budget left?'",
      ]);

    } catch (err) {
      console.error("Error in analyzeRequest:", err);
      return "My circuits are fried! ⚡ Try a simpler question.";
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking delay (randomized)
    const delay = Math.floor(Math.random() * 500) + 800; // 800-1300ms
    setTimeout(() => {
      const aiResponse = analyzeRequest(text);
      const aiMsg: Message = { role: "ai", content: aiResponse, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
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
            Get instant answers about your spending, budget, and financial health.
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
            <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 pb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-indigo-500/10 text-indigo-500"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-2xl p-3 max-w-[80%] text-sm ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted/50 text-foreground rounded-tl-none border border-border/50"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ 
                      __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                    }} />
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

          {/* Suggested Prompts */}
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

          <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your spending..."
                className="rounded-full bg-muted/50 border-border/50 focus-visible:ring-indigo-500/50"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Send, Bot, User, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface AIInsightsProps {
  userId: string;
  selectedMonth: Date;
  income: number;
  expenses: number;
  transactions: any[];
  userName?: string;
}

interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Where did my money go?",
  "How much did I save?",
  "Spending on Food?",
  "Highest expense?",
];

// Helper to find category with fuzzy matching
const findCategory = (query: string, categories: string[]) => {
  const lowerQuery = query.toLowerCase();
  
  // Direct match
  const direct = categories.find(c => lowerQuery.includes(c.toLowerCase()));
  if (direct) return direct;

  // Common aliases
  const aliases: Record<string, string[]> = {
    "food": ["groceries", "dining", "restaurants", "food", "eating out"],
    "transport": ["transportation", "uber", "taxi", "fuel", "gas", "bus", "train"],
    "shopping": ["clothing", "clothes", "electronics", "gadgets", "amazon"],
    "bills": ["utilities", "rent", "internet", "phone", "electricity", "water"],
    "entertainment": ["movies", "games", "netflix", "subscriptions", "fun"],
  };

  for (const [key, values] of Object.entries(aliases)) {
    if (lowerQuery.includes(key)) {
      // Find the first matching category in the user's actual categories
      const match = categories.find(c => values.some(v => c.toLowerCase().includes(v)));
      if (match) return match;
    }
  }
  
  return null;
};

export const AIInsights = ({ userId, selectedMonth, income, expenses, transactions, userName = "Friend" }: AIInsightsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: `Hi ${userName}! I'm your AI Financial Advisor. 🤖\n\nI can analyze your spending for ${format(selectedMonth, 'MMMM yyyy')}. Ask me anything!`,
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
      content: `Chat cleared! Ready for new questions. 🧹`,
      timestamp: new Date(),
    }]);
  };

  const analyzeRequest = (query: string) => {
    const lowerQuery = query.toLowerCase();
    let response = "I'm not sure about that yet. 🤔 Try asking about your spending breakdown, savings, or specific categories.";

    try {
      const categories = [...new Set(transactions.map(t => t.category || ""))].filter(Boolean);

      // 1. Spending Breakdown (Top 3)
      if (lowerQuery.includes("breakdown") || lowerQuery.includes("where") || lowerQuery.includes("go")) {
        const categoryTotals: Record<string, number> = {};
        transactions.filter(t => t.type === "expense").forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
        });

        const sorted = Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);

        if (sorted.length > 0) {
          const list = sorted.map(([cat, amount]) => `• **${cat}**: ₹${amount.toLocaleString()}`).join("\n");
          response = `Here's where most of your money went:\n\n${list}`;
        } else {
          response = "You haven't spent anything yet! 🎉";
        }
      }

      // 2. Savings Analysis
      else if (lowerQuery.includes("save") || lowerQuery.includes("savings")) {
        const savings = income - expenses;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        
        if (savings > 0) {
          response = `You've saved **₹${savings.toLocaleString()}** this month! 💰\nThat's a **${savingsRate.toFixed(1)}%** savings rate. Keep it up!`;
        } else if (savings < 0) {
          response = `You've overspent by **₹${Math.abs(savings).toLocaleString()}** this month. 📉\nTry to cut back on discretionary spending.`;
        } else {
          response = "You've broken even this month. No savings yet, but no debt either! ⚖️";
        }
      }

      // 3. Category Spending (Fuzzy Match)
      else if (lowerQuery.includes("spend") || lowerQuery.includes("much") || lowerQuery.includes("cost")) {
        const foundCategory = findCategory(query, categories);

        if (foundCategory) {
          const total = transactions
            .filter(t => t.category === foundCategory && t.type === "expense")
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          
          const count = transactions.filter(t => t.category === foundCategory && t.type === "expense").length;
          const avg = count > 0 ? total / count : 0;

          response = `You spent **₹${total.toLocaleString()}** on **${foundCategory}** across ${count} transactions.\nAverage per transaction: ₹${avg.toFixed(0)}.`;
        } else {
          response = "I couldn't find that specific category. Try asking for a 'breakdown' to see your top categories.";
        }
      }

      // 4. Highest Expense
      else if (lowerQuery.includes("highest") || lowerQuery.includes("biggest") || lowerQuery.includes("most expensive")) {
        const expenseTxns = transactions.filter(t => t.type === "expense");
        if (expenseTxns.length > 0) {
          const highest = expenseTxns.reduce((prev, current) => ((Number(prev.amount) || 0) > (Number(current.amount) || 0)) ? prev : current);
          response = `Your biggest purchase was **₹${highest.amount.toLocaleString()}** for "${highest.description || highest.category}" on ${format(new Date(highest.date), 'MMM d')}. 💸`;
        } else {
          response = "No expenses recorded yet.";
        }
      }

      // 5. Transaction Counts
      else if (lowerQuery.includes("how many") || lowerQuery.includes("times")) {
        const foundCategory = findCategory(query, categories);
        if (foundCategory) {
           const count = transactions.filter(t => t.category === foundCategory).length;
           response = `You had **${count}** transactions in **${foundCategory}** this month.`;
        } else {
           response = `You've had a total of **${transactions.length}** transactions this month.`;
        }
      }

      // 6. Total Income/Expense
      else if (lowerQuery.includes("income") || lowerQuery.includes("earned")) {
        response = `Total Income: **₹${income.toLocaleString()}** 📈`;
      }
      else if (lowerQuery.includes("expense") || lowerQuery.includes("spent") || lowerQuery.includes("total")) {
        response = `Total Expenses: **₹${expenses.toLocaleString()}** 📉`;
      }

      // 7. Balance
      else if (lowerQuery.includes("balance") || lowerQuery.includes("left")) {
        const balance = income - expenses;
        response = `Current Balance: **₹${balance.toLocaleString()}** 🏦\n${balance > 0 ? "Looking good! 🌟" : "Careful, you're in the red. ⚠️"}`;
      }

    } catch (err) {
      console.error("Error in analyzeRequest:", err);
      response = "My brain short-circuited! ⚡ Please try asking something simpler.";
    }

    return response;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse = analyzeRequest(text);
      const aiMsg: Message = { role: "ai", content: aiResponse, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
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
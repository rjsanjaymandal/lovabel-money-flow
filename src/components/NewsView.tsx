import { useState, useEffect, useRef } from "react";
import { NewsCard, NewsItem } from "./NewsCard";
import { Loader2, RefreshCw, WifiOff, ArrowLeft, Sparkles, X, Share2, ExternalLink, Clock, Newspaper, BrainCircuit, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ZenBackground } from "@/components/ZenBackground";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const RSS_FEEDS = [
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" },
  { url: "https://www.livemint.com/rss/money", source: "Mint Money" },
  { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "Economic Times" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" }
];

export function NewsView() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // AI State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini_api_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const navigate = useNavigate();

  const fetchNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const allNews: NewsItem[] = [];
      
      await Promise.all(RSS_FEEDS.map(async (feed) => {
        try {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
          const data = await res.json();
          
          if (data.status === "ok") {
            const items = data.items.map((item: any) => ({
              ...item,
              source: feed.source,
              contentSnippet: item.description?.replace(/<[^>]*>/g, '').slice(0, 150) + "..." || "",
              description: item.description // Keep raw HTML
            }));
            allNews.push(...items);
          }
        } catch (err) {
          console.error(`Failed to fetch ${feed.source}`, err);
        }
      }));

      const sortedNews = allNews.sort((a, b) => 
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );

      const uniqueNews = sortedNews.filter((item, index, self) =>
        index === self.findIndex((t) => t.title === item.title)
      );

      setNews(uniqueNews);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Reset AI summary when closing or changing cards
  useEffect(() => {
    if (!selectedId) {
      setAiSummary(null);
      setIsAnalyzing(false);
      setShowKeyInput(false);
    }
  }, [selectedId]);

  const handleAnalyze = async (newsItem: NewsItem) => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setIsAnalyzing(true);
    setAiSummary(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are a financial analyst explaining news to a beginner investor.
        Analyze this news article and provide a "Smart Summary".
        
        Title: ${newsItem.title}
        Snippet: ${newsItem.contentSnippet}
        
        Output Format:
        **Why it matters:** [One sentence explanation]
        **Key Takeaways:**
        * [Point 1]
        * [Point 2]
        * [Point 3]
        
        Keep it concise, simple, and actionable. Use emojis where appropriate.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setAiSummary(text);
    } catch (err) {
      console.error("AI Error:", err);
      toast.error("Failed to generate summary. Check your API key.");
      setShowKeyInput(true); // Assume key might be wrong
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("gemini_api_key", key);
    setShowKeyInput(false);
    toast.success("API Key saved!");
  };

  // Helper to get image URL
  const getImageUrl = (item: NewsItem) => {
    if (item.image) return item.image;
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];
    const lowerTitle = item.title.toLowerCase();
    if (lowerTitle.includes("crypto") || lowerTitle.includes("bitcoin")) return "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80";
    if (lowerTitle.includes("stock") || lowerTitle.includes("market")) return "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&q=80";
    if (lowerTitle.includes("tech") || lowerTitle.includes("ai")) return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80";
    return "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80";
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse text-muted-foreground">Curating your discover feed...</p>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-6 p-6 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <WifiOff className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Unable to load news</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            We couldn't connect to the financial feeds. Please check your connection.
          </p>
        </div>
        <Button onClick={fetchNews} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const selectedNews = news.find(n => n.guid === selectedId);

  return (
    <div className="min-h-screen bg-background relative pb-24 sm:pb-10">
      <ZenBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="sm:hidden -ml-2"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Discover</h1>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchNews}
            className="text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="container max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {news.map((item) => (
            <NewsCard 
              key={item.guid} 
              news={item} 
              layoutId={item.guid} 
              onClick={() => setSelectedId(item.guid)} 
            />
          ))}
        </div>
      </div>

      {/* Expanded View Overlay */}
      <AnimatePresence>
        {selectedId && selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8 bg-black/60 backdrop-blur-sm">
            <motion.div 
              layoutId={selectedId} 
              className="w-full h-full sm:max-w-2xl sm:h-[85vh] bg-background sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            >
              {/* Close Button */}
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute top-4 right-4 z-50 rounded-full h-10 w-10 bg-black/20 backdrop-blur-md hover:bg-black/40 text-white border border-white/10"
                onClick={() => setSelectedId(null)}
              >
                <X className="w-5 h-5" />
              </Button>

              <ScrollArea className="flex-1 h-full">
                {/* Hero Image */}
                <div className="relative w-full h-[40vh] sm:h-[300px]">
                  <motion.div 
                    layoutId={`image-${selectedId}`}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${getImageUrl(selectedNews)})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-primary/20 backdrop-blur-md text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-primary/20">
                        <Newspaper className="w-3 h-3" />
                        {selectedNews.source || "News"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium bg-background/50 px-2 py-1 rounded-md backdrop-blur-sm">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(selectedNews.pubDate), { addSuffix: true })}
                      </div>
                    </div>
                    <motion.h2 layoutId={`title-${selectedId}`} className="text-2xl sm:text-3xl font-bold leading-tight">
                      {selectedNews.title}
                    </motion.h2>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 pt-0 space-y-6">
                  
                  {/* AI Analysis Section */}
                  <div className="space-y-4">
                    {!aiSummary && !isAnalyzing && !showKeyInput && (
                      <Button 
                        onClick={() => handleAnalyze(selectedNews)}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
                      >
                        <BrainCircuit className="w-4 h-4 mr-2" />
                        Analyze with AI
                      </Button>
                    )}

                    {showKeyInput && (
                      <div className="p-4 rounded-xl bg-card border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Key className="w-4 h-4" />
                          Enter Gemini API Key
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get a free key from Google AI Studio. Stored locally on your device.
                        </p>
                        <div className="flex gap-2">
                          <Input 
                            type="password" 
                            placeholder="Paste API Key here..." 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="bg-background/50"
                          />
                          <Button onClick={() => saveApiKey(apiKey)}>Save</Button>
                        </div>
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="p-6 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center gap-3 animate-pulse">
                        <BrainCircuit className="w-5 h-5 text-primary animate-bounce" />
                        <span className="text-sm font-medium text-muted-foreground">AI is reading the news...</span>
                      </div>
                    )}

                    {aiSummary && (
                      <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-4 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                          <BrainCircuit className="w-4 h-4" />
                          Smart Summary
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Render HTML Content safely */}
                  <div 
                    className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedNews.description || selectedNews.contentSnippet 
                    }} 
                  />
                  
                  <div className="flex flex-col gap-4 pt-8 border-t border-border/50">
                    <Button 
                      className="w-full h-12 text-base font-semibold gap-2"
                      onClick={() => window.open(selectedNews.link, "_blank")}
                    >
                      Read Full Story on Source <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full h-12 gap-2"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: selectedNews.title,
                            url: selectedNews.link
                          });
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share Article
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { NewsCard, NewsItem } from "./NewsCard";
import { Loader2, RefreshCw, WifiOff, ArrowLeft, Sparkles, X, Share2, ExternalLink, Clock, Newspaper, BrainCircuit, Zap, Volume2, StopCircle, TrendingUp, TrendingDown, Tag, Search, Download, Camera, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ZenBackground } from "@/components/ZenBackground";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarketTicker } from "./MarketTicker";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { MarketStories } from "./MarketStories";
import { Send } from "lucide-react";

const RSS_FEEDS = [
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" },
  { url: "https://www.livemint.com/rss/money", source: "Mint Money" },
  { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "Economic Times" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" }
];

const CATEGORIES = ["All", "Saved", "Crypto", "Tech", "Energy", "Banking", "Auto"];

export function NewsView() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Local NLP State
  const [highlights, setHighlights] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Audio State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem("news_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleBookmark = (guid: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newBookmarks = bookmarks.includes(guid) 
      ? bookmarks.filter(id => id !== guid)
      : [...bookmarks, guid];
    setBookmarks(newBookmarks);
    localStorage.setItem("news_bookmarks", JSON.stringify(newBookmarks));
    if (bookmarks.includes(guid)) toast.info("Removed from bookmarks");
    else toast.success("Saved to bookmarks");
  };

  // Personalization State
  const [userInterests, setUserInterests] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("user_interests");
    return saved ? JSON.parse(saved) : {};
  });

  const navigate = useNavigate();
  const shareRef = useRef<HTMLDivElement>(null);

  // Helper to analyze sentiment and sector
  const analyzeNews = (item: any) => {
    const text = (item.title + " " + item.description).toLowerCase();
    
    // Sentiment Analysis
    let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
    if (text.match(/surge|soar|record|high|profit|jump|gain|bull|rally|growth|positive/)) sentiment = "bullish";
    if (text.match(/crash|plunge|drop|loss|bear|fall|down|negative|warn|risk|crisis/)) sentiment = "bearish";

    // Sector Analysis
    let sector = "General";
    if (text.match(/bitcoin|crypto|eth|blockchain|coin/)) sector = "Crypto";
    else if (text.match(/ai|tech|apple|google|microsoft|nvidia|software/)) sector = "Tech";
    else if (text.match(/oil|energy|gas|power/)) sector = "Energy";
    else if (text.match(/bank|rbi|fed|rate|loan|debt/)) sector = "Banking";
    else if (text.match(/auto|car|vehicle|tesla|tata motors/)) sector = "Auto";

    return { sentiment, sector };
  };

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
            const items = data.items.map((item: any) => {
              const { sentiment, sector } = analyzeNews(item);
              return {
                ...item,
                source: feed.source,
                contentSnippet: item.description?.replace(/<[^>]*>/g, '').slice(0, 150) + "..." || "",
                description: item.description, // Keep raw HTML
                sentiment,
                sector
              };
            });
            allNews.push(...items);
          }
        } catch (err) {
          console.error(`Failed to fetch ${feed.source}`, err);
        }
      }));

      // Smart Sorting: Prioritize user interests
      const sortedNews = allNews.sort((a, b) => {
        // First by interest score
        const scoreA = userInterests[a.sector || "General"] || 0;
        const scoreB = userInterests[b.sector || "General"] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        // Then by date
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });

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
  }, []); // Re-fetch isn't strictly needed on interest change, but could be added

  // Track Interest
  const handleCardClick = (item: NewsItem) => {
    setSelectedId(item.guid);
    if (item.sector && item.sector !== "General") {
      const newInterests = { ...userInterests, [item.sector]: (userInterests[item.sector] || 0) + 1 };
      setUserInterests(newInterests);
      localStorage.setItem("user_interests", JSON.stringify(newInterests));
    }
  };

  // Reset state when closing
  useEffect(() => {
    if (!selectedId) {
      setHighlights([]);
      setIsGenerating(false);
      setChatHistory([]); // Reset Chat
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [selectedId]);

  // Audio Logic
  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Local NLP Logic
  const generateLocalHighlights = (htmlContent: string) => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

      const scoredSentences = sentences.map(sentence => {
        let score = 0;
        const lower = sentence.toLowerCase();
        if (lower.match(/(\$|₹|€|£)\d+/)) score += 5;
        if (lower.match(/\d+(\.\d+)?%/)) score += 5;
        if (lower.includes("million") || lower.includes("billion")) score += 4;
        if (lower.match(/surge|plunge|soar|crash|record|high|low|profit|loss/)) score += 3;
        if (sentence.length < 20 || sentence.length > 300) score -= 5;
        return { text: sentence.trim(), score };
      });

      const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(s => s.text);

      setHighlights(topSentences.length > 0 ? topSentences : ["No key highlights found."]);
      setIsGenerating(false);
    }, 800);
  };

  // Insta-Share Logic
  const handleInstaShare = async () => {
    if (shareRef.current) {
      try {
        const dataUrl = await toPng(shareRef.current, { cacheBust: true });
        const link = document.createElement('a');
        link.download = 'news-story.png';
        link.href = dataUrl;
        link.click();
        toast.success("Image saved! Ready to share.");
      } catch (err) {
        console.error("Share failed", err);
        toast.error("Failed to generate image.");
      }
    }
  };

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

  // Filter Logic
  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.contentSnippet.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === "Saved") {
      return matchesSearch && bookmarks.includes(item.guid);
    }
    
    const matchesCategory = selectedCategory === "All" || item.sector === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedNews = news.find(n => n.guid === selectedId);
  const relatedNews = selectedNews 
    ? news.filter(n => n.sector === selectedNews.sector && n.guid !== selectedNews.guid).slice(0, 3)
    : [];

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

  return (
    <div className="min-h-screen bg-background relative pb-24 sm:pb-10">
      <ZenBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
        <MarketTicker />
        
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
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">Discover</h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search news..." 
                className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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

        {/* Stories & Filters Container */}
        <div className="container max-w-7xl mx-auto px-0 sm:px-4 pb-0 bg-background/50 border-b border-border/50">
           {/* Category Filters (Keep Sticky) */}
           <div className="px-4 sm:px-0 pb-3 pt-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <Badge 
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-1.5 rounded-full transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Market Stories (Scrollable) */}
      <div className="container max-w-7xl mx-auto px-0 sm:px-4 pt-4 sm:pt-6">
         <div className="border-b border-border/50 sm:border-0 pb-4 sm:pb-2">
            <h2 className="px-4 sm:px-0 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Market Pulse</h2>
            <MarketStories />
         </div>
      </div>

      {/* Feed Grid */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6">
          {filteredNews.map((item) => (
            <NewsCard 
              key={item.guid} 
              news={item} 
              layoutId={item.guid} 
              onClick={() => handleCardClick(item)} 
            />
          ))}
          {filteredNews.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>No news found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded View Overlay */}
      <AnimatePresence>
        {selectedId && selectedNews && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-8 bg-black/60 backdrop-blur-sm">
            <motion.div 
              layoutId={selectedId} 
              className="w-full h-[100dvh] sm:max-w-3xl sm:h-[85vh] bg-background sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-white/10"
            >
              {/* Close Button */}
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute top-4 right-4 z-50 rounded-full h-10 w-10 bg-black/20 backdrop-blur-md hover:bg-black/40 text-white border border-white/10 transition-transform active:scale-95"
                onClick={() => setSelectedId(null)}
              >
                <X className="w-5 h-5" />
              </Button>

              <ScrollArea className="flex-1 h-full">
                {/* Hero Image */}
                <div className="relative w-full h-[35vh] sm:h-[350px]">
                  <motion.div 
                    layoutId={`image-${selectedId}`}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${getImageUrl(selectedNews)})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <div className="bg-primary/20 backdrop-blur-md text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-primary/20">
                        <Newspaper className="w-3 h-3" />
                        {selectedNews.source || "News"}
                      </div>
                      
                      {/* Sentiment Badge */}
                      {selectedNews.sentiment && selectedNews.sentiment !== "neutral" && (
                        <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border backdrop-blur-md ${
                          selectedNews.sentiment === "bullish" 
                            ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/30" 
                            : "bg-rose-500/20 text-rose-100 border-rose-500/30"
                        }`}>
                          {selectedNews.sentiment === "bullish" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {selectedNews.sentiment}
                        </div>
                      )}

                      {/* Sector Badge */}
                      {selectedNews.sector && selectedNews.sector !== "General" && (
                        <div className="bg-blue-500/20 backdrop-blur-md text-blue-100 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-500/30">
                          <Tag className="w-3 h-3" />
                          {selectedNews.sector}
                        </div>
                      )}

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
                <div className="p-6 pt-0 space-y-6 pb-32">
                  
                  {/* Action Bar */}
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <Button 
                      onClick={() => generateLocalHighlights(selectedNews.description || selectedNews.contentSnippet)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/20 min-w-[140px]"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Highlights
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleSpeech(selectedNews.contentSnippet)}
                      className={`flex-1 gap-2 min-w-[100px] ${isSpeaking ? "bg-primary/10 text-primary border-primary/50" : ""}`}
                    >
                      {isSpeaking ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {isSpeaking ? "Stop" : "Listen"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleInstaShare}
                      className="flex-1 gap-2 min-w-[140px] border-pink-500/30 text-pink-500 hover:bg-pink-500/10 hover:text-pink-600"
                    >
                      <Camera className="w-4 h-4" />
                      Insta-Share
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => toggleBookmark(selectedNews.guid, e)}
                      className={`flex-1 gap-2 min-w-[50px] ${bookmarks.includes(selectedNews.guid) ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-primary/10"}`}
                    >
                      {bookmarks.includes(selectedNews.guid) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Highlights Section */}
                  {isGenerating && (
                    <div className="p-6 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center gap-3 animate-pulse">
                      <BrainCircuit className="w-5 h-5 text-primary animate-bounce" />
                      <span className="text-sm font-medium text-muted-foreground">Extracting insights...</span>
                    </div>
                  )}

                  {highlights.length > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                        <Zap className="w-4 h-4" />
                        Key Highlights
                      </div>
                      <ul className="space-y-2">
                        {highlights.map((point, i) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                            <span className="text-emerald-500 font-bold">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Render HTML Content safely */}
                  <div 
                    className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedNews.description || selectedNews.contentSnippet 
                    }} 
                  />

                  {/* AI Analyst Chat Section */}
                  <div className="mt-8 rounded-2xl bg-muted/30 border border-border/50 overflow-hidden">
                    <div className="p-4 border-b border-border/50 bg-black/20 backdrop-blur-sm flex items-center gap-3">
                       <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <BrainCircuit className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="font-bold text-sm">FinBot Analyst</h3>
                          <p className="text-[10px] text-muted-foreground">Ask about impacts, sectors, or trends</p>
                       </div>
                    </div>
                    
                    <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                       {/* Initial Greeting */}
                       <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                             <Sparkles className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="bg-card border border-border/50 p-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                             <p>I've analyzed this article. Ask me anything! e.g., "Is this good for Banking stocks?"</p>
                          </div>
                       </div>

                       {/* Chat History */}
                       {chatHistory.map((msg, i) => (
                         <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/10' : 'bg-indigo-500/10'}`}>
                               {msg.role === 'user' ? <div className="w-4 h-4 bg-primary rounded-full" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[80%] ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                : 'bg-card border border-border/50 rounded-tl-none'
                            }`}>
                               <p>{msg.content}</p>
                            </div>
                         </div>
                       ))}
                       
                       {isAnalyzing && (
                         <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                               <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            </div>
                            <div className="bg-card border border-border/50 p-3 rounded-2xl rounded-tl-none text-sm text-muted-foreground shadow-sm">
                               <span className="animate-pulse">Thinking...</span>
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="p-4 bg-background/50 backdrop-blur-sm border-t border-border/50 flex gap-2">
                       <Input 
                         placeholder="Type your question..." 
                         className="bg-background border-border"
                         disabled={isAnalyzing}
                         onKeyDown={async (e) => {
                           if (e.key === "Enter" && !isAnalyzing) {
                              const input = e.currentTarget;
                              const question = input.value;
                              if (!question.trim()) return;
                              
                              setChatHistory(prev => [...prev, { role: 'user', content: question }]);
                              input.value = "";
                              setIsAnalyzing(true);
                              
                              // Mock AI Delay & Response
                              setTimeout(() => {
                                setIsAnalyzing(false);
                                const response = `Based on current market sentiment (${selectedNews.sentiment}), this indicates a potential ${selectedNews.sentiment === 'bullish' ? 'uptrend' : 'correction'} for ${selectedNews.sector || 'the market'}. ${question.toLowerCase().includes('time') ? "It might be a good time to watch." : "Keep an eye on volume."}`;
                                setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
                              }, 1500);
                           }
                         }}
                       />
                       <Button size="icon" className="shrink-0" disabled={isAnalyzing}>
                          <Send className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                  
                  {/* Related Stories */}
                  {relatedNews.length > 0 && (
                    <div className="pt-8 border-t border-border/50">
                      <h3 className="text-lg font-bold mb-4">Related in {selectedNews.sector}</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {relatedNews.map(item => (
                          <div 
                            key={item.guid} 
                            className="flex gap-4 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors cursor-pointer border border-border/50"
                            onClick={() => handleCardClick(item)}
                          >
                            <div 
                              className="w-24 h-24 rounded-lg bg-cover bg-center shrink-0"
                              style={{ backgroundImage: `url(${getImageUrl(item)})` }}
                            />
                            <div className="flex flex-col justify-between py-1">
                              <h4 className="font-semibold line-clamp-2 text-sm">{item.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 pt-8 border-t border-border/50">
                    <Button 
                      className="w-full h-12 text-base font-semibold gap-2"
                      onClick={() => window.open(selectedNews.link, "_blank")}
                    >
                      Read Full Story on Source <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
              
              {/* Hidden Share Template */}
              <div 
                ref={shareRef}
                className="absolute top-0 left-0 w-[1080px] h-[1920px] bg-background p-16 flex flex-col justify-between pointer-events-none opacity-0"
                style={{ zIndex: -1 }}
              >
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary rounded-2xl">
                      <Sparkles className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary">Lovabel Money Flow</h1>
                  </div>
                  
                  <div className="w-full h-[600px] rounded-3xl bg-cover bg-center shadow-2xl" style={{ backgroundImage: `url(${getImageUrl(selectedNews)})` }} />
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <span className="px-6 py-2 rounded-full bg-primary/10 text-primary text-2xl font-bold uppercase tracking-wider">
                        {selectedNews.source}
                      </span>
                      {selectedNews.sentiment && (
                        <span className={`px-6 py-2 rounded-full text-2xl font-bold uppercase tracking-wider ${
                          selectedNews.sentiment === "bullish" ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                        }`}>
                          {selectedNews.sentiment}
                        </span>
                      )}
                    </div>
                    <h2 className="text-6xl font-black leading-tight">{selectedNews.title}</h2>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-12 rounded-3xl bg-card border border-border/50 shadow-xl">
                    <h3 className="text-3xl font-bold mb-6 text-primary">Key Highlights</h3>
                    <ul className="space-y-4">
                      {(highlights.length > 0 ? highlights : [selectedNews.contentSnippet]).slice(0, 3).map((point, i) => (
                        <li key={i} className="text-3xl text-muted-foreground leading-relaxed">
                          • {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-center text-2xl text-muted-foreground">Read more on Lovabel Money Flow</p>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

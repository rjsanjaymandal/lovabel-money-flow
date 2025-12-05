import { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink, Clock, Newspaper, TrendingUp, TrendingDown, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  isoDate: string;
  image?: string;
  source?: string;
  description?: string; // Raw HTML description
  sentiment?: "bullish" | "bearish" | "neutral";
  sector?: string;
}

interface NewsCardProps {
  news: NewsItem;
  layoutId: string;
  onClick: () => void;
}

export const NewsCard = memo(({ news, layoutId, onClick }: NewsCardProps) => {
  // Extract image from content if not explicitly provided
  const imageUrl = useMemo(() => {
    if (news.image) return news.image;
    
    const imgMatch = news.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];
    
    const lowerTitle = news.title.toLowerCase();
    if (lowerTitle.includes("crypto") || lowerTitle.includes("bitcoin")) 
      return "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80";
    if (lowerTitle.includes("stock") || lowerTitle.includes("market")) 
      return "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&q=80";
    if (lowerTitle.includes("tech") || lowerTitle.includes("ai")) 
      return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80";
      
    return "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80"; 
  }, [news.image, news.content, news.title]);

  const timeAgo = formatDistanceToNow(new Date(news.pubDate), { addSuffix: true });

  return (
    <motion.div layoutId={layoutId} onClick={onClick} className="h-full">
      <Card 
        className="group overflow-hidden border border-border/50 bg-card rounded-2xl sm:rounded-xl shadow-sm hover:shadow-xl hover:bg-card/80 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
      >
        {/* Image Container */}
        <div className="relative w-full aspect-[16/9] sm:pt-[56.25%] overflow-hidden bg-muted">
          <motion.div 
            layoutId={`image-${layoutId}`}
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 will-change-transform"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 sm:opacity-60 transition-opacity" />
          
          {/* Badges Container - Clean & Minimal */}
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-2 z-10">
            {/* Source Badge */}
            <div className="bg-white/90 backdrop-blur-xl text-black px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Newspaper className="w-3 h-3" />
              {news.source || "News"}
            </div>

            {/* Sentiment Badge (Clean Dot style) */}
            {news.sentiment && news.sentiment !== "neutral" && (
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-xl shadow-sm ${
                news.sentiment === "bullish" 
                  ? "bg-emerald-500/90 text-white" 
                  : "bg-rose-500/90 text-white"
              }`}>
                {news.sentiment === "bullish" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="hidden xs:inline">{news.sentiment}</span>
              </div>
            )}
            
            {/* Time Badge (Mobile Overlay) */}
            <div className="ml-auto text-[10px] font-medium text-white/90 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10 sm:hidden">
               <Clock className="w-3 h-3" />
               {timeAgo}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-4 flex flex-col flex-1 gap-2 sm:gap-3 bg-card relative z-20">
          <motion.h3 layoutId={`title-${layoutId}`} className="font-bold text-[17px] sm:text-lg leading-[1.4] group-hover:text-primary transition-colors line-clamp-2">
            {news.title}
          </motion.h3>

          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed flex-1 hidden sm:block">
            {news.contentSnippet}
          </p>

          {/* Desktop Footer Only */}
          <div className="hidden sm:flex items-center justify-between pt-3 mt-auto border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs font-semibold gap-1 hover:text-primary px-2"
            >
              Read <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

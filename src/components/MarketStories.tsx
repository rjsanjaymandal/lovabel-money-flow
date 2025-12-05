import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Zap, Globe, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Story {
  id: string;
  title: string;
  type: "market" | "crypto" | "gold" | "tech";
  gradient: string;
  icon: React.ElementType;
  content: {
    headline: string;
    stats: { label: string; value: string; isUp: boolean }[];
    summary: string;
  };
}

const STORIES: Story[] = [
  {
    id: "market-wrap",
    title: "Market Wrap",
    type: "market",
    gradient: "from-blue-500 to-indigo-600",
    icon: Globe,
    content: {
      headline: "Nifty Hits All-Time High! 🚀",
      stats: [
        { label: "NIFTY 50", value: "22,450 (+1.2%)", isUp: true },
        { label: "SENSEX", value: "73,980 (+1.1%)", isUp: true },
        { label: "BANK NIFTY", value: "47,850 (-0.2%)", isUp: false },
      ],
      summary: "Indian markets rallied today led by IT and Auto stocks. FIIs were net buyers for the 3rd straight day.",
    }
  },
  {
    id: "crypto-pulse",
    title: "Crypto Pulse",
    type: "crypto",
    gradient: "from-orange-500 to-red-600",
    icon: Bitcoin,
    content: {
      headline: "Bitcoin Testing $70k Resistance 💎",
      stats: [
        { label: "BTC", value: "$69,420 (+2.5%)", isUp: true },
        { label: "ETH", value: "$3,850 (+1.8%)", isUp: true },
        { label: "SOL", value: "$145 (-1.2%)", isUp: false },
      ],
      summary: "Crypto markets are heating up ahead of the halving event. Altcoins are showing mixed signals.",
    }
  },
  {
    id: "tech-watch",
    title: "Tech Watch",
    type: "tech",
    gradient: "from-cyan-500 to-blue-500",
    icon: Zap,
    content: {
      headline: "AI Rally Continues 🤖",
      stats: [
        { label: "NVIDIA", value: "$920 (+4%)", isUp: true },
        { label: "TAPA ELXSI", value: "₹7,850 (+2%)", isUp: true },
      ],
      summary: "Global AI stocks continue to surge as demand for chips outpaces supply.",
    }
  }
];

export function MarketStories() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  return (
    <>
      {/* Story Row */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 sm:px-0 scrollbar-hide">
        {STORIES.map((story) => (
          <div key={story.id} className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => setSelectedStory(story)}>
            {/* Story Circle */}
            <div className={`w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full p-[2px] bg-gradient-to-tr ${story.gradient} transition-transform group-active:scale-95`}>
               <div className="w-full h-full rounded-full bg-background p-[2px]">
                 <div className="w-full h-full rounded-full bg-muted/10 flex items-center justify-center relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-tr ${story.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <story.icon className={`w-7 h-7 sm:w-8 sm:h-8 text-foreground/90 transition-transform group-hover:scale-110`} />
                 </div>
               </div>
            </div>
            
            <span className="text-[11px] font-medium text-muted-foreground text-center line-clamp-1 max-w-[70px]">
              {story.title}
            </span>
          </div>
        ))}
      </div>

      {/* Full Screen Story Overlay */}
      <AnimatePresence>
        {selectedStory && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-0 sm:p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full h-full sm:max-w-sm sm:h-[85vh] bg-gradient-to-br from-gray-900 to-black rounded-none sm:rounded-[32px] relative overflow-hidden flex flex-col shadow-2xl border sm:border-white/10"
            >
              {/* Progress Bar (Simulated) */}
              <div className="flex gap-1 p-2 absolute top-0 left-0 right-0 z-20">
                 <motion.div 
                   initial={{ width: "0%" }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 5, ease: "linear" }}
                   className="h-1 bg-white/50 rounded-full flex-1"
                   onAnimationComplete={() => setSelectedStory(null)} 
                 />
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-20 text-white hover:bg-white/10 rounded-full"
                onClick={() => setSelectedStory(null)}
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Content */}
              <div className={`flex-1 flex flex-col p-8 bg-gradient-to-br ${selectedStory.gradient}`}>
                 <div className="mt-12 mb-8">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/30">
                       <selectedStory.icon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight">{selectedStory.content.headline}</h2>
                 </div>

                 <div className="space-y-4 bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    {selectedStory.content.stats.map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0 last:pb-0">
                         <span className="text-white/80 font-medium">{stat.label}</span>
                         <div className={`flex items-center gap-1 font-bold ${stat.isUp ? "text-emerald-300" : "text-rose-300"}`}>
                            {stat.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {stat.value}
                         </div>
                      </div>
                    ))}
                 </div>

                 <p className="mt-8 text-white/90 text-lg leading-relaxed font-medium">
                   {selectedStory.content.summary}
                 </p>
                 
                 <div className="mt-auto text-center">
                    <p className="text-white/50 text-xs uppercase tracking-widest">Tap to close</p>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

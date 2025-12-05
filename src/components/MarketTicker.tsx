import { useEffect, useState, useMemo, memo } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Signal, WifiOff } from "lucide-react";

interface StockItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean;
  marketState: "REGULAR" | "CLOSED" | "PRE" | "POST";
  source: "LIVE" | "INDICATED";
  history: number[]; // Array of prices for sparkline
}

const INDICES = [
  { key: "^NSEI", name: "NIFTY 50", fallback: 22450.30 },
  { key: "^BSESN", name: "SENSEX", fallback: 73980.15 },
  { key: "^NSEBANK", name: "BANK NIFTY", fallback: 47850.00 },
  { key: "RELIANCE.NS", name: "RELIANCE", fallback: 2950.45 },
  { key: "TCS.NS", name: "TCS", fallback: 3980.10 },
  { key: "HDFCBANK.NS", name: "HDFC BANK", fallback: 1540.25 },
  { key: "^CNXIT", name: "NIFTY IT", fallback: 34500.20 },
];

// Memoized Sparkline Component to prevent re-renders on parent updates
const Sparkline = memo(({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length < 2) return null;
  
  const width = 60;
  const height = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Downsample to 10 points (was 20) for better performance
  const step = Math.ceil(data.length / 10);
  const points = data.filter((_, i) => i % step === 0);
  
  const path = points.map((val, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * height; // Invert Y
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`; // Limit precision
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}, (prev, next) => {
  // Custom comparison: only re-render if color changes or data length changes significantly
  // or if the last value changed (approx comparison to save cycles)
  return prev.color === next.color && prev.data[prev.data.length-1] === next.data[next.data.length-1];
});

// Memoized Ticker Item
const TickerItem = memo(({ item }: { item: StockItem }) => (
  <div className="flex items-center gap-4 mx-6 text-sm font-medium cursor-default group/item opacity-90 transition-opacity hover:opacity-100 will-change-transform">
    <div className="flex flex-col justify-center leading-none gap-0.5">
      <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">{item.name}</span>
          {item.source === "INDICATED" && <span className="text-[8px] text-yellow-500/50">●</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs font-semibold text-white tracking-tight">
          <span className="text-[10px] text-muted-foreground mr-0.5">₹</span>
          {item.price}
        </div>
        {/* Mini Sparkline */}
        <div className="w-[60px] h-5 flex items-center">
          <Sparkline data={item.history} color={item.isUp ? "#34d399" : "#fb7185"} />
        </div>
        <span className={`flex items-center text-[10px] font-bold ${item.isUp ? "text-emerald-400" : "text-rose-400"}`}>
          {item.isUp ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
          {item.changePercent}
        </span>
      </div>
    </div>
    {/* Minimal Divider */}
    <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent ml-2" />
  </div>
));

export function MarketTicker() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [marketStatus, setMarketStatus] = useState<string>("CLOSED");

  // Helper to get fallback data (simulated history)
  const getFallbackData = () => {
    return INDICES.map(index => {
       const drift = (Math.random() * 0.4 - 0.2); 
       const price = index.fallback * (1 + drift / 100);
       
       // Generate fake history for sparkline
       const history = Array.from({ length: 20 }, (_, i) => index.fallback * (1 + (Math.sin(i) * 0.005)));

       return {
         symbol: index.key,
         name: index.name,
         price: price.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
         change: (price - index.fallback).toFixed(2),
         changePercent: Math.abs(drift).toFixed(2) + "%",
         isUp: drift >= 0,
         marketState: "CLOSED",
         source: "INDICATED",
         history
       } as StockItem;
    });
  };

  const fetchIndianStocks = async () => {
    try {
      const promises = INDICES.map(async (index) => {
        const url = `https://api.allorigins.win/get?url=` + encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${index.key}?interval=5m&range=1d`);
        
        const res = await fetch(url);
        const json = await res.json();
        const data = JSON.parse(json.contents);
        
        if (!data.chart || !data.chart.result) throw new Error("Invalid Data");

        const result = data.chart.result[0];
        const meta = result.meta;
        const quotes = result.indicators.quote[0];
        // Filter nulls from history
        const history = quotes.close.filter((p: number | null) => p !== null) as number[];

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        return {
          symbol: index.key,
          name: index.name,
          price: price.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
          change: change.toFixed(2),
          changePercent: Math.abs(changePercent).toFixed(2) + "%",
          isUp: change >= 0,
          marketState: meta.tradingPeriod,
          source: "LIVE",
          history
        } as StockItem;
      });

      const results = await Promise.all(promises);
      setStocks(results);
      setUsingFallback(false);
    } catch (e) {
      // Only switch to fallback if we don't have ANY data yet
      if (stocks.length === 0) {
        setStocks(getFallbackData());
        setUsingFallback(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial Load
    setStocks(getFallbackData());
    setLoading(false);
    
    fetchIndianStocks();
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 60 + minutes;
    if (time >= 555 && time <= 930 && now.getDay() !== 0 && now.getDay() !== 6) {
      setMarketStatus("Market Open");
    } else {
      setMarketStatus("Closed");
    }

    const interval = setInterval(fetchIndianStocks, 30000); // 30s refresh for chart data
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 overflow-hidden h-10 flex items-center relative z-50">
      
      {/* India Market Badge */}
      <div className="absolute left-0 z-10 bg-gradient-to-r from-black via-black/95 to-transparent pr-8 pl-3 h-full flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Tricolor Bar */}
          <div className="flex flex-col h-3 w-4 rounded-[1px] overflow-hidden opacity-90 shadow-sm border border-white/10">
             <div className="h-1 w-full bg-[#FF9933]"/>
             <div className="h-1 w-full bg-white"/>
             <div className="h-1 w-full bg-[#138808]"/>
          </div>
          <span className="text-[10px] font-bold text-white tracking-wider uppercase hidden sm:block">NSE</span>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
          usingFallback 
            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
            : marketStatus === "Market Open" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
              : "bg-orange-500/10 border-orange-500/20 text-orange-500"
        }`}>
          {usingFallback ? (
             <WifiOff className="w-2 h-2" />
          ) : (
             <div className={`w-1.5 h-1.5 rounded-full ${marketStatus === "Market Open" ? "bg-emerald-500 animate-pulse" : "bg-orange-500"}`} />
          )}
          <span className="text-[9px] font-bold tracking-wide whitespace-nowrap">
            {usingFallback ? "OFFLINE" : marketStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Ticker Content */}
      <div className="flex whitespace-nowrap animate-marquee hover:pause pl-40 group-hover:pause will-change-transform">
        {/* Render only 2 sets of items instead of 3 to reduce DOM if list is long */}
        {[...stocks, ...stocks].map((item, index) => (
          <TickerItem key={`${item.symbol}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}

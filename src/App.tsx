import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { BottomNav } from "./components/BottomNav";
import { Loader2 } from "lucide-react";

// Lazy Load Pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AllTransactions = lazy(() => import("./pages/AllTransactions"));
const AllLendBorrow = lazy(() => import("./pages/AllLendBorrow"));
const PersonHistory = lazy(() => import("./pages/PersonHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));
// Lazy Load Heavy Components
const NewsView = lazy(() => import("./components/NewsView").then(module => ({ default: module.NewsView })));
const UnoPage = lazy(() => import("./pages/UnoPage"));
const UnoBotPage = lazy(() => import("./pages/UnoBotPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Data stays fresh for 1 min
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Routes for the application */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<AllTransactions />} />
            <Route path="/lend-borrow" element={<AllLendBorrow />} />
            <Route path="/person/:personName" element={<PersonHistory />} />
            <Route path="/news" element={<NewsView />} />
            <Route path="/uno" element={<UnoPage />} />
            <Route path="/uno/bot" element={<UnoBotPage />} />
            <Route path="/uno/:roomCode" element={<UnoPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { BottomNav } from "./components/BottomNav";
import { MainLayout } from "./components/MainLayout";
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
const NewsView = lazy(() =>
  import("./components/NewsView").then((module) => ({
    default: module.NewsView,
  })),
);
const UnoPage = lazy(() => import("./pages/UnoPage"));
const UnoBotPage = lazy(() => import("./pages/UnoBotPage"));

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public / Standalone Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              <Route element={<ProtectedRoute />}>
                {/* Game Routes (Full Screen) */}
                <Route path="/uno/bot" element={<UnoBotPage />} />
                <Route path="/uno/:roomCode" element={<UnoPage />} />

                {/* Application Layout Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transactions" element={<AllTransactions />} />
                  <Route path="/lend-borrow" element={<AllLendBorrow />} />
                  <Route
                    path="/person/:personName"
                    element={<PersonHistory />}
                  />
                  <Route path="/news" element={<NewsView />} />
                  {/* Uno Lobby */}
                  <Route path="/uno" element={<UnoPage />} />
                </Route>
              </Route>

              {/* Fallback for authenticated 404s or generic */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

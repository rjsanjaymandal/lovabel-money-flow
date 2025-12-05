import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowRight, Sparkles, UserPlus, LogIn, Mail, Lock } from "lucide-react";
import { getSafeErrorMessage } from "@/lib/error-handler";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard?tab=spend");
      }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard?tab=spend");
      } else {
        // --- 1. Sign Up ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }, // Store metadata directly
            emailRedirectTo: `${window.location.origin}/dashboard?tab=spend`,
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // --- 2. Manual Profile Creation Fix ---
          // Attempt to create profile explicitly to ensure it exists.
          // Note: 'profiles' table currently only validates 'id'. Name is stored in Auth Metadata.
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: authData.user.id,
              // Add other columns here if you add them to the DB schema (e.g. full_name)
            }, { onConflict: 'id' });

          if (profileError) {
             console.error("Manual profile creation failed:", profileError);
          }
        }

        toast({
          title: "Account Created! 🎉",
          description: "Welcome to EasyExpense. Check your email if required.",
        });
        
        // Auto login handling if session established
        if (authData.session) {
           navigate("/dashboard?tab=spend");
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden selection:bg-indigo-500/30">
      {/* --- Ambient Background --- */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <div className="glass-card rounded-[32px] p-1 shadow-2xl backdrop-blur-3xl border border-white/10 bg-black/40">
          <div className="bg-background/40 rounded-[28px] p-6 sm:p-8 backdrop-blur-md">
            
            {/* --- Header --- */}
            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5 shadow-inner mb-2">
                <Wallet className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  EasyExpense
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Smart finance for modern life</p>
              </div>
            </div>

            {/* --- Tabs --- */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mb-8">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1 rounded-2xl h-12">
                <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all duration-300">
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* --- Form --- */}
            <form onSubmit={handleAuth} className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {activeTab === "signup" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground ml-1">Full Name</Label>
                      <div className="relative">
                        <Input
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-11 bg-white/5 border-white/10 focus:ring-indigo-500/50 rounded-xl transition-all hover:bg-white/10 focus:bg-white/10"
                        />
                        <div className="absolute left-3 top-3 text-muted-foreground/50">
                          <LogIn className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Email Address</Label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11 bg-white/5 border-white/10 focus:ring-indigo-500/50 rounded-xl transition-all hover:bg-white/10 focus:bg-white/10"
                      />
                      <div className="absolute left-3 top-3 text-muted-foreground/50">
                        <Mail className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Password</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-11 bg-white/5 border-white/10 focus:ring-indigo-500/50 rounded-xl transition-all hover:bg-white/10 focus:bg-white/10"
                      />
                      <div className="absolute left-3 top-3 text-muted-foreground/50">
                        <Lock className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4" 
                disabled={loading}
              >
                {loading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2 font-medium">
                    {activeTab === "login" ? "Welcome Back" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
          
          {/* --- Footer Decoration --- */}
           <div className="p-4 text-center">
             <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest">
               Secure • Private • Encrypted
             </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;

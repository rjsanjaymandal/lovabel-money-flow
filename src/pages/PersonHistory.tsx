import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonDetails } from "@/components/PersonDetails";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PersonHistory = () => {
  const { personName } = useParams<{ personName: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkUser();
  }, [navigate]);

  if (!personName || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur-md shadow-sm safe-top">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{decodeURIComponent(personName)}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Transaction History</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <PersonDetails personName={decodeURIComponent(personName)} userId={userId} />
      </main>
    </div>
  );
};

export default PersonHistory;

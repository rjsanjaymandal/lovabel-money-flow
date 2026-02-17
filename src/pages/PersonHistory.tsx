import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonDetails } from "@/components/PersonDetails";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const PersonHistory = () => {
  const { personName } = useParams<{ personName: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkUser();
  }, [navigate]);

  const handleDeletePerson = async () => {
    if (!userId || !personName) return;

    try {
      const { error } = await supabase
        .from("lend_borrow")
        .delete()
        .eq("user_id", userId)
        .eq("person_name", decodeURIComponent(personName));

      if (error) throw error;

      toast({
        title: "Person Deleted",
        description: `All records for ${decodeURIComponent(
          personName
        )} have been deleted.`,
      });

      navigate("/dashboard?tab=lend");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete person. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!personName || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-6">
      {/* Mobile-optimized Header */}
      <header className="sticky top-0 z-40 border-b bg-card/98 backdrop-blur-lg shadow-md safe-top">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard?tab=lend")}
            className="rounded-full h-9 w-9 sm:h-10 sm:w-10 touch-manipulation active:scale-95 transition-transform hover:bg-accent/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">
              {decodeURIComponent(personName)}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Transaction History
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation active:scale-95 transition-transform"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90%] sm:w-full max-w-lg rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Person?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  <strong>{decodeURIComponent(personName)}</strong> and all
                  associated transaction history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeletePerson}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Content */}
      <main className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <PersonDetails
          personName={decodeURIComponent(personName)}
          userId={userId}
        />
      </main>
    </div>
  );
};

export default PersonHistory;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
  userId: string;
  selectedMonth: Date;
  income: number;
  expenses: number;
  transactions: any[];
}

export const AIInsights = ({ userId, selectedMonth, income, expenses, transactions }: AIInsightsProps) => {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: {
          userId,
          month: selectedMonth.toISOString(),
          income,
          expenses,
          transactions,
        },
      });

      if (error) throw error;

      setInsights(data.insights);
    } catch (error: any) {
      console.error("Error generating insights:", error);
      toast({
        title: "Failed to generate insights",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-lg animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights && !isLoading && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Get personalized insights about your spending patterns
            </p>
            <Button
              onClick={generateInsights}
              disabled={transactions.length === 0}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Insights
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {insights && !isLoading && (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-foreground whitespace-pre-wrap">{insights}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
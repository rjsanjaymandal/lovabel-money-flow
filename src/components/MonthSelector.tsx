import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const MonthSelector = ({ selectedMonth, onMonthChange }: MonthSelectorProps) => {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl bg-gradient-to-br from-card/50 to-card border border-border/50 shadow-lg backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        className="hover:bg-muted/80 transition-all hover:scale-110 h-8 w-8 sm:h-9 sm:w-9 rounded-full"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
      
      <div className="flex flex-col items-center flex-1">
        <h2 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          {format(selectedMonth, "MMMM yyyy")}
        </h2>
        {isCurrentMonth && (
          <span className="text-[10px] sm:text-xs text-muted-foreground">Current Month</span>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className="hover:bg-muted/80 transition-all hover:scale-110 h-8 w-8 sm:h-9 sm:w-9 rounded-full disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
    </div>
  );
};
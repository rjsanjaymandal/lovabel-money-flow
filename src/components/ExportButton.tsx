import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, File } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Transaction {
  date: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
}

interface ExportButtonProps {
  transactions: Transaction[];
  selectedMonth: Date;
  income: number;
  expenses: number;
}

export const ExportButton = ({ transactions, selectedMonth, income, expenses }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const csvContent = [
        ["Date", "Type", "Category", "Amount", "Description"],
        ...transactions.map((t) => [
          format(new Date(t.date), "yyyy-MM-dd"),
          t.type,
          t.category,
          t.amount.toString(),
          t.description || "",
        ]),
        [],
        ["Summary"],
        ["Total Income", income.toString()],
        ["Total Expenses", expenses.toString()],
        ["Net", (income - expenses).toString()],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${format(selectedMonth, "yyyy-MM")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: "Exported to CSV successfully" });
    } catch (error) {
      toast({ title: "Failed to export", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    toast({ 
      title: "PDF export coming soon", 
      description: "This feature will be available in the next update" 
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting || transactions.length === 0}
          className="gap-2 hover:bg-muted transition-all hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <File className="w-4 h-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const ExportButton = ({ transactions, selectedMonth, income, expenses, className, variant = "outline" }: ExportButtonProps) => {
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
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text("Monthly Transaction Report", 14, 22);

      // Date
      doc.setFontSize(11);
      doc.text(`Month: ${format(selectedMonth, "MMMM yyyy")}`, 14, 30);

      // Summary
      doc.text(`Total Income: ${income}`, 14, 40);
      doc.text(`Total Expenses: ${expenses}`, 14, 46);
      doc.text(`Net Balance: ${income - expenses}`, 14, 52);

      // Table
      const tableColumn = ["Date", "Type", "Category", "Amount", "Description"];
      const tableRows = transactions.map((t) => [
        format(new Date(t.date), "yyyy-MM-dd"),
        t.type,
        t.category,
        t.amount.toString(),
        t.description || "",
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
      });

      doc.save(`transactions-${format(selectedMonth, "yyyy-MM")}.pdf`);
      toast({ title: "Exported to PDF successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to export PDF", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          disabled={isExporting || transactions.length === 0}
          className={`gap-2 hover:bg-muted transition-all hover:scale-105 ${className}`}
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
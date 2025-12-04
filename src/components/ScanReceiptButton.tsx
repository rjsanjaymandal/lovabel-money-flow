import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { parseReceiptImage, ScannedReceiptData } from "@/utils/receiptParser";
import { useToast } from "@/hooks/use-toast";

interface ScanReceiptButtonProps {
  onScanComplete: (data: ScannedReceiptData) => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ScanReceiptButton({ onScanComplete, className, variant = "outline" }: ScanReceiptButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const data = await parseReceiptImage(file);
      onScanComplete(data);
      toast({
        title: "Receipt Scanned!",
        description: `Found amount: ${data.amount || 'Unknown'}, Date: ${data.date ? data.date.toLocaleDateString() : 'Unknown'}`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not read the receipt. Please try again or enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment" // Opens camera on mobile
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant={variant}
        size="icon"
        className={`rounded-full ${className}`}
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
      >
        {isScanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}

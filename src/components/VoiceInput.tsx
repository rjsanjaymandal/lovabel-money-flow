import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onResult: (data: { amount: string; description: string; type: "expense" | "income" }) => void;
}

export const VoiceInput = ({ onResult }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast({
        title: "Error",
        description: "Could not hear you. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript:", transcript);
      processTranscript(transcript);
    };

    recognition.start();
  };

  const processTranscript = (text: string) => {
    const lowerText = text.toLowerCase();
    let type: "expense" | "income" = "expense";
    let amount = "";
    let description = "";

    // Detect Type
    if (lowerText.includes("income") || lowerText.includes("received") || lowerText.includes("got") || lowerText.includes("salary")) {
      type = "income";
    }

    // Extract Amount (simple regex for numbers)
    const amountMatch = lowerText.match(/(\d+(\.\d{1,2})?)/);
    if (amountMatch) {
      amount = amountMatch[0];
    }

    // Extract Description (remove keywords and amount)
    // Remove "spent", "paid", "income", "received", "on", "for", and the amount
    let cleanText = lowerText
      .replace(/spent|paid|income|received|got|salary/g, "")
      .replace(amount, "")
      .replace(/\s(on|for|from)\s/g, " ") // Remove prepositions
      .trim();
    
    // Capitalize first letter
    description = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);

    if (amount) {
      onResult({ amount, description, type });
      toast({
        title: "Voice Input Recognized",
        description: `Detected: ${type === "income" ? "+" : "-"}₹${amount} for "${description}"`,
      });
    } else {
      toast({
        title: "Could not detect amount",
        description: "Please say something like 'Spent 100 on Coffee'",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) return null;

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      className={`rounded-full transition-all duration-300 ${isListening ? "animate-pulse scale-110" : "hover:scale-105"}`}
      onClick={startListening}
      title="Voice Input"
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </Button>
  );
};

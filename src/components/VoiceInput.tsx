import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseVoiceInput, VoiceData } from "@/utils/voiceParser";

interface VoiceInputProps {
  onResult: (data: VoiceData) => void;
}

export function VoiceInput({ onResult }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // Default to Indian English

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsProcessing(true);
        
        // Process the text
        const data = parseVoiceInput(transcript);
        
        toast({
          title: "Heard:",
          description: `"${transcript}"`,
        });

        onResult(data);
        setIsProcessing(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "Could not understand audio. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Web Speech API not supported");
    }
  }, [onResult, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={toggleListening}
      className={`rounded-full transition-all duration-300 ${
        isListening ? "animate-pulse scale-110 shadow-lg shadow-red-500/20" : "hover:bg-primary/10 hover:text-primary"
      }`}
      title="Tap to Speak"
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </Button>
  );
}

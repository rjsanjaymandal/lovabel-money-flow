import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseVoiceInput, VoiceData } from "@/utils/voiceParser";

interface VoiceInputProps {
  onResult: (data: VoiceData) => void;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

// Add interfaces for Speech Recognition to avoid 'any'
interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: {
    readonly [index: number]: SpeechRecognitionResult;
    readonly length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

export function VoiceInput({
  onResult,
  className,
  variant = "outline",
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const win = window as unknown as Record<
        string,
        new () => SpeechRecognition
      >;
      const recognitionConstructor = win.webkitSpeechRecognition;
      const recognition = new recognitionConstructor() as SpeechRecognition;
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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
      variant={isListening ? "destructive" : variant}
      size="icon"
      onClick={toggleListening}
      className={`rounded-full transition-all duration-300 ${
        isListening
          ? "animate-pulse scale-110 shadow-lg shadow-red-500/20"
          : "hover:bg-primary/10 hover:text-primary"
      } ${className}`}
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

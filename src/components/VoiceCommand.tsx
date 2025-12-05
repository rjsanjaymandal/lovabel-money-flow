import { useState, useEffect, useRef } from "react";
import { Mic, X, Check, Loader2, Sparkles, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCommandProps {
  userId: string;
  onTransactionAdded?: () => void;
}

export function VoiceCommand({ userId, onTransactionAdded }: VoiceCommandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("Tap to speak...");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setFeedback("Listening...");
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If we have a final transcript, process it
        if (transcript.length > 2) {
            handleCommand(transcript);
        } else {
            setFeedback("Didn't catch that. Try again.");
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Error", event.error);
        setIsListening(false);
        setFeedback("Error accessing microphone.");
      };
    }
  }, [transcript]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleCommand = async (text: string) => {
      setIsProcessing(true);
      setFeedback("Processing...");
      const lowerText = text.toLowerCase();

      try {
        // PARSE COMMAND
        // Patterns: "Spent 500 on Pizza", "Paid 20 for Taxi", "Add 1000 to Salary"
        
        const amountMatch = lowerText.match(/(\d+)/);
        if (!amountMatch) {
            throw new Error("Could not find an amount.");
        }
        const amount = parseFloat(amountMatch[0]);

        let type: "expense" | "income" = "expense";
        if (lowerText.includes("income") || lowerText.includes("received") || lowerText.includes("salary") || lowerText.includes("got")) {
            type = "income";
        }

        // Extract "Category/Note" - simplistically taking words after "on" or "for"
        let note = "Voice Entry";
        let category = "Others";

        const splitWords = lowerText.split(/on |for |from /);
        if (splitWords.length > 1) {
            note = splitWords[1].trim(); // "Pizza"
        }

        // Auto-Categorize based on keywords
        if (note.match(/food|pizza|burger|meal|lunch|dinner/)) category = "Food";
        else if (note.match(/uber|ola|taxi|bus|train|fuel/)) category = "Travel";
        else if (note.match(/movie|netflix|game|fun/)) category = "Entertainment";
        else if (note.match(/salary|paycheck/)) category = "Salary";
        else if (note.match(/grocery|milk|veg/)) category = "Grocery";

        // Insert into Supabase
        const { error } = await supabase.from("transactions").insert({
            user_id: userId,
            amount: amount,
            type: type,
            category: category,
            description: note, // Using description as note
            date: new Date().toISOString()
        });

        if (error) throw error;

        // Success Feedback
        setFeedback("Success!");
        speak(`Logged ${amount} for ${note}`);
        toast.success(`Logged: ${amount} (${category})`);
        
        setTimeout(() => {
            setIsOpen(false);
            setTranscript("");
            if (onTransactionAdded) onTransactionAdded();
        }, 1500);

      } catch (err: any) {
        console.error(err);
        setFeedback("I didn't understand. Try 'Spent 500 on Food'.");
        speak("Sorry, I couldn't understand that transaction.");
      } finally {
        setIsProcessing(false);
      }
  };

  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
    } else {
        setTranscript("");
        recognitionRef.current?.start();
    }
  };

  return (
    <>
      {/* Trigger Button - Floating or Header integrated */}
      <AnimatePresence>
        {!isOpen && (
            <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0 }}
               className="fixed bottom-24 right-4 z-30 sm:bottom-8 sm:right-8"
            >
                <Button 
                    size="icon" 
                    className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-white/20 hover:scale-110 transition-transform"
                    onClick={() => setIsOpen(true)}
                >
                    <Mic className="w-6 h-6 text-white" />
                </Button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
                 {/* Close Button */}
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => {
                        recognitionRef.current?.stop();
                        setIsOpen(false);
                    }}
                 >
                    <X className="w-8 h-8" />
                 </Button>

                 <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="flex flex-col items-center gap-12 max-w-sm text-center p-6"
                 >
                     {/* The ORB Visualizer */}
                     <div className="relative cursor-pointer" onClick={toggleListening}>
                         {/* Core */}
                         <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-md flex items-center justify-center transition-all duration-300 ${isListening ? 'scale-110 shadow-[0_0_100px_rgba(168,85,247,0.5)]' : 'scale-100 opacity-80'}`}>
                             {isProcessing ? (
                                <Loader2 className="w-12 h-12 text-white animate-spin" />
                             ) : (
                                <Mic className={`w-12 h-12 text-white transition-transform ${isListening ? 'scale-125' : ''}`} />
                             )}
                         </div>
                         
                         {/* Outer Rings (Animations) */}
                         {isListening && (
                             <>
                                <motion.div 
                                   animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                   transition={{ repeat: Infinity, duration: 2 }}
                                   className="absolute inset-0 rounded-full border border-white/30"
                                />
                                <motion.div 
                                   animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                   transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                   className="absolute inset-0 rounded-full border border-white/20"
                                />
                             </>
                         )}
                     </div>

                     <div className="space-y-4">
                         <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            {isListening ? "Listening..." : isProcessing ? "Thinking..." : "Tap to Speak"}
                         </h2>
                         
                         {transcript && (
                             <p className="text-2xl font-medium text-white/90 leading-relaxed">
                                "{transcript}"
                             </p>
                         )}
                         
                         <div className="h-8">
                            <p className="text-sm text-indigo-300 font-medium animate-pulse">
                                {feedback}
                            </p>
                         </div>
                     </div>

                     {/* Hints */}
                     {!isListening && !transcript && (
                        <div className="flex flex-col gap-3 opacity-50">
                            <p className="text-xs uppercase tracking-widest text-white/40">Try saying</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white">
                                    "Spent 500 on Pizza"
                                </span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white">
                                    "Paid 200 for Taxi"
                                </span>
                            </div>
                        </div>
                     )}
                 </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
}

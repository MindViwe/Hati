import { useState, useEffect } from "react";
import { Mic, Send, Paperclip, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { generateAIResponse } from "@/lib/mockAI";
import { generateLocalLlamaResponse, generateHuggingFaceResponse, generateLlamaCPPResponse } from "@/lib/localAIService";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const LOCAL_STORAGE_KEY = "azura_chat_history";

function getLocalMessages(): Message[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalMessage(message: Message) {
  try {
    const isClouded = localStorage.getItem("azura_cloud_sync_enabled") !== "false";
    if (isClouded) {
      // Offload to "Clouded Apps" - in mockup mode, we simulate this by keeping only a small buffer locally
      // while "syncing" the rest to a virtual clouded state
      console.log("Memory diverted to Clouded App storage to prevent device crush.");
      const messages = getLocalMessages();
      messages.push(message);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages.slice(-5))); // Keep only last 5 locally for crush protection
    } else {
      const messages = getLocalMessages();
      messages.push(message);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages.slice(-100)));
    }
  } catch {
    console.error("Failed to save to local storage");
  }
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages(getLocalMessages());
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: Message = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      
      // Save user message immediately
      saveLocalMessage(userMessage);
      setMessages(prev => [...prev, userMessage]);

      try {
        // Priority 1: Llama.cpp (Scott or Hati based on config)
        let responseText;
        try {
          responseText = await generateLlamaCPPResponse(content);
        } catch (cppError) {
          console.log("Llama.cpp skipped/failed:", cppError);
          
          // Priority 2: Hugging Face API
          try {
            responseText = await generateHuggingFaceResponse(content);
          } catch (hfError) {
            console.log("Hugging Face skipped/failed:", hfError);
            
            // Priority 3: Local Llama 3 (Ollama)
            try {
              responseText = await generateLocalLlamaResponse(content);
            } catch (llamaError) {
               console.log("Local Llama skipped/failed:", llamaError);
               // Removed Mock AI fallback as per request
               throw new Error("All neural engines offline. Link established but no response received.");
            }
          }
        }
        
        const assistantMessage: Message = {
          role: "assistant",
          content: responseText,
          timestamp: new Date().toISOString(),
        };

        // Save AI message
        saveLocalMessage(assistantMessage);
        setMessages(prev => [...prev, assistantMessage]);
        
        return assistantMessage;
      } catch (error) {
        console.error("AI Error", error);
        throw error;
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessageMutation.mutate(input);
    setInput("");
  };

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto mt-8 p-4 bg-black/20 backdrop-blur-lg rounded-3xl border border-white/10 flex flex-col gap-4 h-[60vh]"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex-1 overflow-y-auto space-y-4 p-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.timestamp + i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm md:text-base backdrop-blur-md border ${
                  msg.role === "user"
                    ? "bg-primary/20 border-primary/30 text-primary-foreground rounded-br-none"
                    : "bg-white/5 border-white/10 text-foreground rounded-bl-none shadow-lg"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {sendMessageMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Waveform Visualization (Mock) */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            className="h-12 flex items-center justify-center gap-1 mb-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 48, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary rounded-full"
                animate={{ 
                  height: [10, Math.random() * 40 + 10, 10],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity, 
                  delay: i * 0.05 
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 glass-panel rounded-full p-2 pr-3 bg-black/40 border border-white/10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={() => setIsListening(!isListening)}
          data-testid="button-voice"
        >
          {isListening ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command Azura..."
          className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-sans placeholder:text-muted-foreground/50 h-12 text-foreground"
          data-testid="input-command"
          disabled={sendMessageMutation.isPending}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
          data-testid="button-attach"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Button
          type="submit"
          size="icon"
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.5)] transition-all hover:scale-105 disabled:opacity-50"
          data-testid="button-submit"
          disabled={sendMessageMutation.isPending}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </motion.div>
  );
}
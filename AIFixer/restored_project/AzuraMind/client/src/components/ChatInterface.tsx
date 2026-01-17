import { useState, useEffect } from "react";
import { Mic, Send, Paperclip, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";

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
    const messages = getLocalMessages();
    messages.push(message);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages.slice(-100)));
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
      
      const assistantMessage: Message = {
        role: "assistant",
        content: `Acknowledged: "${content}". Neural processing complete. How may I assist further?`,
        timestamp: new Date().toISOString(),
      };

      // Save locally first (works offline)
      saveLocalMessage(userMessage);
      saveLocalMessage(assistantMessage);
      setMessages(prev => [...prev, userMessage, assistantMessage]);

      // Try to sync with server (optional - gracefully fails offline)
      try {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content }),
        });

        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: assistantMessage.content,
          }),
        });
      } catch {
        // Offline mode - already saved locally
      }

      return assistantMessage;
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
      className="w-full max-w-2xl mx-auto mt-8 p-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {/* Voice Waveform Visualization (Mock) */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            className="h-12 flex items-center justify-center gap-1 mb-4"
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

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 glass-panel rounded-full p-2 pr-3">
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
          className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-sans placeholder:text-muted-foreground/50 h-12"
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

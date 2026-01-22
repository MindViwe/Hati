import { useState, useEffect, useRef } from "react";
import { Mic, Send, Paperclip, MicOff, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { generateAIResponse } from "@/lib/mockAI";

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
  const [isPreview, setIsPreview] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getLocalMessages());
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: Message = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      
      saveLocalMessage(userMessage);
      setMessages(prev => [...prev, userMessage]);

      try {
        const responseText = await generateAIResponse(content);
        
        const assistantMessage: Message = {
          role: "assistant",
          content: responseText,
          timestamp: new Date().toISOString(),
        };

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

  const clearChat = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setMessages([]);
  };

  return (
    <motion.div 
      layout
      className={`w-full max-w-2xl mx-auto flex flex-col gap-4 transition-all duration-500 ${
        isPreview 
          ? "fixed inset-4 z-[100] max-w-none m-0 bg-background/95 border-primary/40 h-[calc(100vh-2rem)]" 
          : "mt-8 p-4 bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 h-[60vh]"
      }`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary/80">
            {isPreview ? "FULL SYSTEM PREVIEW" : "NEURAL INTERFACE"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-red-500/20 hover:text-red-400"
            onClick={clearChat}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-primary/20"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar mask-fade-top"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4"
            >
              <Terminal className="w-12 h-12" />
              <p className="font-mono text-xs uppercase tracking-widest">Awaiting Command Input...</p>
            </motion.div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={msg.timestamp + i}
              initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm md:text-base backdrop-blur-md border shadow-2xl ${
                  msg.role === "user"
                    ? "bg-primary/20 border-primary/30 text-primary-foreground rounded-br-none"
                    : "bg-white/5 border-white/10 text-foreground rounded-bl-none"
                }`}
              >
                <div className="text-[10px] font-mono uppercase opacity-40 mb-1 flex justify-between">
                  <span>{msg.role}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
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
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-2 transition-all focus-within:border-primary/50 shadow-2xl">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
          onClick={() => setIsListening(!isListening)}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command Mind'sEye..."
          className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base font-sans placeholder:text-muted-foreground/30 h-10 text-foreground"
          disabled={sendMessageMutation.isPending}
        />

        <Button
          type="submit"
          size="icon"
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 h-10 w-10"
          disabled={sendMessageMutation.isPending || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </motion.div>
  );
}

function Terminal({className}: {className?: string}) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

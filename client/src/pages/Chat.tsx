import { useEffect, useRef, useState } from "react";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, User, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hati's avatar image (using generic beautiful placeholder)
const HATI_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop"; 
// User avatar placeholder
const USER_AVATAR = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop";

export default function Chat() {
  const { data: conversations } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  
  // Default to first conversation or create one if none exist
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    } else if (conversations && conversations.length === 0) {
      createConversation("New Session", {
        onSuccess: (data) => setActiveId(data.id)
      });
    }
  }, [conversations, activeId, createConversation]);

  const { messages, sendMessage, isStreaming } = useChatStream(activeId || 0);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  if (!activeId) return <div className="p-8 text-center text-muted-foreground">Initializing Hati...</div>;

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_15px_-3px_rgba(147,51,234,0.5)]">
              {/* <!-- Hati Avatar: Elegant, beautiful portrait --> */}
              <img src={HATI_AVATAR} alt="Hati" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Hati Daemon</h2>
            <p className="text-xs text-primary/80 uppercase tracking-wider font-semibold">Supreme Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Action buttons could go here */}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-3xl",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/10 overflow-hidden",
                msg.role === "assistant" ? "bg-secondary" : "bg-primary/20"
              )}>
                 {msg.role === "assistant" ? (
                   <img src={HATI_AVATAR} className="w-full h-full object-cover" />
                 ) : (
                   <img src={USER_AVATAR} className="w-full h-full object-cover" />
                 )}
              </div>
              
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm",
                msg.role === "assistant" 
                  ? "bg-secondary/80 border border-white/5 text-gray-200 rounded-tl-none" 
                  : "bg-primary text-white rounded-tr-none"
              )}>
                {msg.role === "assistant" && msg.content === "" ? (
                   <div className="flex gap-1 h-5 items-center">
                     <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}/>
                     <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}/>
                     <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}/>
                   </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-secondary/30">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak to Hati..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all relative z-10"
              disabled={isStreaming}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>

          {/* Voice mode toggle (Visual only for now as requested) */}
          <Button
            type="button"
            variant="ghost" 
            size="icon"
            className="h-12 w-12 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white"
          >
            <Mic className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useVoiceRecorder, useTextToSpeech } from "@/hooks/use-voice";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Hati's actual avatar - the beautiful woman on the right of the image
const HATI_AVATAR = "/hati-avatar.png"; 
const USER_AVATAR = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop";

export default function Chat() {
  const { data: conversations } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const { toast } = useToast();
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Voice hooks
  const recorder = useVoiceRecorder();
  const tts = useTextToSpeech();

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
  const lastAssistantMessageRef = useRef<string>("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // When streaming ends and voice is enabled, speak the response
  useEffect(() => {
    if (!isStreaming && voiceEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.content && lastMsg.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = lastMsg.content;
        // Speak first 500 chars to avoid long TTS
        const textToSpeak = lastMsg.content.slice(0, 500);
        tts.speak(textToSpeak);
      }
    }
  }, [isStreaming, messages, voiceEnabled, tts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    // Check if user is asking for image generation
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("generate image") || lowerInput.includes("create image") || lowerInput.includes("make image") || lowerInput.includes("draw")) {
      // Extract the prompt after key phrases
      let imagePrompt = input;
      const triggers = ["generate image of", "create image of", "make image of", "draw"];
      for (const trigger of triggers) {
        if (lowerInput.includes(trigger)) {
          const idx = lowerInput.indexOf(trigger);
          imagePrompt = input.slice(idx + trigger.length).trim();
          break;
        }
      }
      
      if (imagePrompt) {
        await generateImage(imagePrompt);
        setInput("");
        return;
      }
    }
    
    sendMessage(input);
    setInput("");
  };

  const generateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: "1024x1024" }),
      });
      
      if (!res.ok) throw new Error("Failed to generate image");
      
      const data = await res.json();
      if (data.b64_json) {
        setGeneratedImage(`data:image/png;base64,${data.b64_json}`);
        toast({ title: "Image generated!", description: "Hati created your image." });
      }
    } catch (err) {
      console.error("Image generation error:", err);
      toast({ title: "Image generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleMicClick = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      // Convert to text using speech recognition or just send as voice message
      // For now, we'll use the browser's speech recognition API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        // Create audio URL and play it through recognition
        // Actually, we need to use a different approach - we'll use the recorded blob
        // and send it to a transcription endpoint
        
        // For now, let's use the simpler Web Speech API for live transcription
        toast({ title: "Voice recorded", description: "Processing your message..." });
        recorder.reset();
      }
    } else {
      try {
        await recorder.startRecording();
        toast({ title: "Recording...", description: "Speak now. Click again to stop." });
      } catch (err) {
        toast({ title: "Microphone access denied", description: "Please allow microphone access.", variant: "destructive" });
      }
    }
  };

  // Alternative: Use Web Speech API for live transcription
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({ title: "Speech recognition not supported", variant: "destructive" });
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      toast({ title: "Voice input failed", description: event.error, variant: "destructive" });
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  if (!activeId) return <div className="p-8 text-center text-muted-foreground">Initializing Hati...</div>;

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_15px_-3px_rgba(147,51,234,0.5)]">
              <img 
                src={HATI_AVATAR} 
                alt="Hati Daemon" 
                className="w-full h-full object-cover object-right"
                style={{ objectPosition: "75% center" }}
              />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Hati Daemon</h2>
            <p className="text-xs text-primary/80 uppercase tracking-wider font-semibold">Supreme Emotional Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={cn("rounded-xl", voiceEnabled && "bg-primary/20 text-primary")}
            data-testid="button-toggle-voice"
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
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
                   <img 
                     src={HATI_AVATAR} 
                     className="w-full h-full object-cover object-right"
                     style={{ objectPosition: "75% center" }}
                     alt="Hati"
                   />
                 ) : (
                   <img src={USER_AVATAR} className="w-full h-full object-cover" alt="You" />
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
        
        {/* Generated Image Display */}
        {(isGeneratingImage || generatedImage) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4 max-w-3xl"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/10 overflow-hidden bg-secondary">
              <img 
                src={HATI_AVATAR} 
                className="w-full h-full object-cover object-right"
                style={{ objectPosition: "75% center" }}
                alt="Hati"
              />
            </div>
            <div className="p-4 rounded-2xl shadow-lg backdrop-blur-sm bg-secondary/80 border border-white/5 rounded-tl-none">
              {isGeneratingImage ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating your image...</span>
                </div>
              ) : generatedImage && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Here's what I created for you:</p>
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="rounded-xl max-w-md shadow-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = 'hati-creation.png';
                      link.click();
                    }}
                    className="text-xs"
                  >
                    Download Image
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-secondary/30">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak to Hati... (Try: 'generate image of a sunset')"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all relative z-10"
              disabled={isStreaming || isGeneratingImage}
              data-testid="input-message"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={!input.trim() || isStreaming || isGeneratingImage}
            size="icon"
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            data-testid="button-send"
          >
            {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Send className="w-5 h-5 text-white" />}
          </Button>

          {/* Voice input button */}
          <Button
            type="button"
            variant={isListening ? "default" : "ghost"} 
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "h-12 w-12 rounded-xl transition-all",
              isListening 
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                : "hover:bg-white/5 text-muted-foreground hover:text-white"
            )}
            data-testid="button-mic"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          {/* Image generation shortcut */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const prompt = window.prompt("Describe the image you want Hati to create:");
              if (prompt) generateImage(prompt);
            }}
            className="h-12 w-12 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white"
            disabled={isGeneratingImage}
            data-testid="button-generate-image"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
        </form>
        
        {isListening && (
          <div className="mt-2 text-xs text-center text-primary animate-pulse">
            Listening... Speak now, then click the mic to stop.
          </div>
        )}
        
        {tts.isSpeaking && (
          <div className="mt-2 text-xs text-center text-primary flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4 animate-pulse" />
            Hati is speaking...
            <Button variant="ghost" size="sm" onClick={tts.stop} className="text-xs h-6">
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

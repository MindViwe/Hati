import { useEffect, useRef, useState } from "react";
import { useChatStream, useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-chat";
import { useVoiceRecorder, useTextToSpeech } from "@/hooks/use-voice";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, Loader2, Plus, Trash2, MessageSquare, Paperclip, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const HATI_AVATAR = "/hati-avatar.png"; 
const USER_AVATAR = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop";

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string;
}

export default function Chat() {
  const { data: conversations, refetch: refetchConversations } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const { mutate: deleteConversation } = useDeleteConversation();
  const { toast } = useToast();
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!isStreaming && voiceEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.content && lastMsg.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = lastMsg.content;
        const textToSpeak = lastMsg.content.slice(0, 500);
        tts.speak(textToSpeak);
      }
    }
  }, [isStreaming, messages, voiceEnabled, tts]);

  const handleNewChat = () => {
    const title = `Chat ${(conversations?.length || 0) + 1}`;
    createConversation(title, {
      onSuccess: (data) => {
        setActiveId(data.id);
        setShowChatList(false);
        toast({ title: "New chat created" });
      }
    });
  };

  const handleDeleteChat = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id, {
      onSuccess: () => {
        if (activeId === id) {
          const remaining = conversations?.filter(c => c.id !== id);
          if (remaining && remaining.length > 0) {
            setActiveId(remaining[0].id);
          } else {
            handleNewChat();
          }
        }
        refetchConversations();
        toast({ title: "Chat deleted" });
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const uploaded: UploadedFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64
        };
        setUploadedFiles(prev => [...prev, uploaded]);
        toast({ title: `File "${file.name}" attached` });
      };
      reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || isStreaming) return;
    
    let messageContent = input;
    
    if (uploadedFiles.length > 0) {
      const fileDescriptions = uploadedFiles.map(f => 
        `[Attached file: ${f.name} (${f.type}, ${(f.size / 1024).toFixed(1)}KB)]`
      ).join("\n");
      messageContent = `${fileDescriptions}\n\n${input}`;
      setUploadedFiles([]);
    }
    
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("generate image") || lowerInput.includes("create image") || lowerInput.includes("make image") || lowerInput.includes("draw")) {
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
    
    sendMessage(messageContent);
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
    
    recognition.onend = () => setIsListening(false);
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
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_15px_-3px_rgba(147,51,234,0.5)]">
              <img 
                src={HATI_AVATAR} 
                alt="Hati Daemon" 
                className="w-[200%] h-full object-cover"
                style={{ objectPosition: "85% center", transform: "translateX(-25%)" }}
              />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-white">Hati Daemon</h2>
            <p className="text-xs text-primary/80 uppercase tracking-wider">Supreme EQ</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChatList(!showChatList)}
              className="rounded-lg flex items-center gap-2"
              data-testid="button-chat-list"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Chats</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform", showChatList && "rotate-180")} />
            </Button>
            
            {showChatList && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-secondary border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-white/10">
                  <Button
                    onClick={handleNewChat}
                    className="w-full justify-start gap-2"
                    variant="ghost"
                    size="sm"
                    data-testid="button-new-chat"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {conversations?.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => { setActiveId(conv.id); setShowChatList(false); }}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors",
                        activeId === conv.id && "bg-primary/20"
                      )}
                    >
                      <span className="text-sm truncate flex-1">{conv.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-50 hover:opacity-100 hover:text-red-400"
                        onClick={(e) => handleDeleteChat(conv.id, e)}
                        data-testid={`button-delete-chat-${conv.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={cn("rounded-lg", voiceEnabled && "bg-primary/20 text-primary")}
            data-testid="button-toggle-voice"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-3xl",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 overflow-hidden",
                msg.role === "assistant" ? "bg-secondary" : "bg-primary/20"
              )}>
                 {msg.role === "assistant" ? (
                   <img 
                     src={HATI_AVATAR} 
                     className="w-[200%] h-full object-cover"
                     style={{ objectPosition: "85% center", transform: "translateX(-25%)" }}
                     alt="Hati"
                   />
                 ) : (
                   <img src={USER_AVATAR} className="w-full h-full object-cover" alt="You" />
                 )}
              </div>
              
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm max-w-[85%]",
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
        
        {(isGeneratingImage || generatedImage) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3 max-w-3xl"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 overflow-hidden bg-secondary">
              <img 
                src={HATI_AVATAR} 
                className="w-[200%] h-full object-cover"
                style={{ objectPosition: "85% center", transform: "translateX(-25%)" }}
                alt="Hati"
              />
            </div>
            <div className="p-3 rounded-2xl shadow-lg backdrop-blur-sm bg-secondary/80 border border-white/5 rounded-tl-none">
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
                    className="rounded-xl max-w-sm shadow-lg"
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

      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 bg-secondary/20 flex flex-wrap gap-2">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-1.5 text-xs">
              <Paperclip className="w-3 h-3 text-primary" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-white/5 bg-secondary/30">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept="*/*"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-white shrink-0"
            data-testid="button-attach-file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Talk to Hati..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              disabled={isStreaming || isGeneratingImage}
              data-testid="input-message"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={(!input.trim() && uploadedFiles.length === 0) || isStreaming || isGeneratingImage}
            size="icon"
            className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
            data-testid="button-send"
          >
            {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </Button>

          <Button
            type="button"
            variant={isListening ? "default" : "ghost"} 
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "h-10 w-10 rounded-xl shrink-0",
              isListening 
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                : "text-muted-foreground hover:text-white"
            )}
            data-testid="button-mic"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const prompt = window.prompt("Describe the image you want Hati to create:");
              if (prompt) generateImage(prompt);
            }}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-white shrink-0"
            disabled={isGeneratingImage}
            data-testid="button-generate-image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </form>
        
        {isListening && (
          <div className="mt-2 text-xs text-center text-primary animate-pulse">
            Listening... Speak now.
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

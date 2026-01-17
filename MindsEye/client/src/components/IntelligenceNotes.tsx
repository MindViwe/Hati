import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  ListTodo, 
  Rocket, 
  Search, 
  StickyNote,
  AlertCircle,
  Bell,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Note {
  id: string;
  type: "research" | "plan" | "todo" | "project";
  content: string;
  timestamp: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
}

const STORAGE_KEY = "azura_intelligence_notes";

export function IntelligenceNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<Note["type"]>("research");

  // Load notes on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
  }, []);

  // Save notes on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!inputValue.trim()) return;
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTab,
      content: inputValue,
      timestamp: new Date().toLocaleString(),
      completed: false,
      priority: "medium",
    };
    setNotes([newNote, ...notes]);
    setInputValue("");
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const toggleComplete = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
  };

  const filteredNotes = notes.filter(n => n.type === activeTab);

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary gap-2"
        data-testid="button-open-notes"
      >
        <StickyNote className="w-4 h-4" />
        <span className="hidden sm:inline">Intelligence Notes</span>
        {notes.length > 0 && (
          <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
            {notes.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="w-full max-w-2xl bg-black/90 border border-primary/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm tracking-widest uppercase">Intelligence Repository</h2>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Storage & Research Sync Active</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/10">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col">
            <div className="px-4 pt-4">
              <TabsList className="grid grid-cols-4 w-full bg-white/5 border border-white/10 p-1 rounded-xl">
                <TabsTrigger value="research" className="text-[10px] md:text-xs gap-2 data-[state=active]:bg-primary/20">
                  <Search className="w-3 h-3" /> <span className="hidden md:inline">Research</span>
                </TabsTrigger>
                <TabsTrigger value="plan" className="text-[10px] md:text-xs gap-2 data-[state=active]:bg-primary/20">
                  <Calendar className="w-3 h-3" /> <span className="hidden md:inline">Plans</span>
                </TabsTrigger>
                <TabsTrigger value="todo" className="text-[10px] md:text-xs gap-2 data-[state=active]:bg-primary/20">
                  <ListTodo className="w-3 h-3" /> <span className="hidden md:inline">To-Do</span>
                </TabsTrigger>
                <TabsTrigger value="project" className="text-[10px] md:text-xs gap-2 data-[state=active]:bg-primary/20">
                  <Rocket className="w-3 h-3" /> <span className="hidden md:inline">Future</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 flex gap-2">
              <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Add to ${activeTab}...`}
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addNote()}
              />
              <Button onClick={addNote} size="icon" className="bg-primary text-primary-foreground rounded-lg">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4 pb-4">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.length === 0 ? (
                    <motion.div 
                      className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                    >
                      <StickyNote className="w-12 h-12 mb-2" />
                      <p className="font-mono text-xs uppercase tracking-widest">Repository Empty</p>
                    </motion.div>
                  ) : (
                    filteredNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative p-4 rounded-xl border transition-all ${
                          note.completed 
                            ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                            : 'bg-white/5 border-white/10 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button 
                            onClick={() => toggleComplete(note.id)}
                            className={`mt-0.5 shrink-0 transition-colors ${note.completed ? 'text-emerald-500' : 'text-primary/40 group-hover:text-primary'}`}
                          >
                            {note.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-relaxed ${note.completed ? 'line-through' : ''}`}>
                              {note.content}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">{note.timestamp}</span>
                              {activeTab === 'todo' && !note.completed && (
                                <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 flex gap-1 h-4">
                                  <Bell className="w-2 h-2" /> PERSISTENT
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="p-4 border-t border-white/10 bg-primary/5 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-primary animate-pulse" />
            <p className="text-[10px] font-mono text-primary/80 uppercase tracking-widest">
              Neural Storage: Diverting to Clouded Apps. Device crush protection: MAX.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-4/5 animate-pulse" />
            </div>
            <span className="text-[8px] font-mono text-primary/40">CLOUD SYNC: 98%</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

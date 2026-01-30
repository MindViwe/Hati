import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal as TerminalIcon, Play, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
  timestamp: Date;
}

export default function Terminal() {
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: "output", content: "Hati Terminal v1.0 - Real Shell Access", timestamp: new Date() },
    { type: "output", content: "Type 'help' for available commands.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add to command history
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);
    
    setHistory(prev => [...prev, { type: "input", content: `$ ${trimmedCmd}`, timestamp: new Date() }]);
    setIsRunning(true);

    try {
      const res = await fetch("/api/terminal/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmedCmd }),
      });

      const data = await res.json();

      if (data.output) {
        const lines = data.output.split("\n").filter((l: string) => l.trim());
        lines.forEach((line: string) => {
          setHistory(prev => [...prev, { 
            type: data.error ? "error" : "output", 
            content: line, 
            timestamp: new Date() 
          }]);
        });
      }

      if (data.error && !data.output) {
        setHistory(prev => [...prev, { type: "error", content: data.error, timestamp: new Date() }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { 
        type: "error", 
        content: "Failed to execute command. Check connection.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsRunning(false);
      setInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isRunning) {
      executeCommand(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "c" && e.ctrlKey) {
      if (isRunning) {
        setHistory(prev => [...prev, { type: "error", content: "^C", timestamp: new Date() }]);
        setIsRunning(false);
      }
    }
  };

  const clearTerminal = () => {
    setHistory([
      { type: "output", content: "Terminal cleared.", timestamp: new Date() },
    ]);
  };

  const copyOutput = () => {
    const output = history.map(h => h.content).join("\n");
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TerminalIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Terminal</h2>
            <p className="text-xs text-muted-foreground">Execute commands in Hati's environment</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyOutput}
            className="rounded-lg"
            data-testid="button-copy-terminal"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearTerminal}
            className="rounded-lg"
            data-testid="button-clear-terminal"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black/80 scroll-smooth"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`py-0.5 ${
              line.type === "input" 
                ? "text-cyan-400" 
                : line.type === "error" 
                  ? "text-red-400" 
                  : "text-gray-300"
            }`}
          >
            {line.content}
          </motion.div>
        ))}
        
        {isRunning && (
          <div className="flex items-center gap-2 text-yellow-400 py-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Running...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-black/60">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-muted-foreground"
            disabled={isRunning}
            autoFocus
            data-testid="input-terminal-command"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isRunning}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-run-command"
          >
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

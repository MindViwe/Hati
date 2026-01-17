import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X, Minimize2, Maximize2, Play, Cpu, Activity, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  id: number;
  type: "info" | "success" | "warning" | "error" | "command" | "system";
  text: string;
  timestamp: string;
}

export function CommandTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [command, setCommand] = useState("");
  const COMMAND_STORAGE_KEY = "azura_command_logs";
  
  const getStoredLogs = (): LogEntry[] => {
    try {
      const stored = localStorage.getItem(COMMAND_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [
        { id: 1, type: "system", text: "Initializing Local Ubuntu Environment (v22.04 LTS)...", timestamp: "10:42:01" },
        { id: 2, type: "system", text: "Mounting local filesystem storage...", timestamp: "10:42:01" },
        { id: 3, type: "success", text: "Environment Ready. User: azura_local", timestamp: "10:42:02" },
      ];
    } catch {
      return [
        { id: 1, type: "system", text: "Initializing Local Ubuntu Environment (v22.04 LTS)...", timestamp: "10:42:01" },
        { id: 2, type: "system", text: "Mounting local filesystem storage...", timestamp: "10:42:01" },
        { id: 3, type: "success", text: "Environment Ready. User: azura_local", timestamp: "10:42:02" },
      ];
    }
  };

  const saveLogsLocally = (newLogs: LogEntry[]) => {
    try {
      localStorage.setItem(COMMAND_STORAGE_KEY, JSON.stringify(newLogs.slice(-200)));
    } catch {
      console.error("Failed to save command logs locally");
    }
  };

  const [logs, setLogs] = useState<LogEntry[]>(getStoredLogs());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const toggleConnection = () => {
    if (isConnected) {
      setLogs(prev => [...prev, {
        id: Date.now(),
        type: "warning",
        text: "Ubuntu Local Session terminated.",
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsConnected(false);
    } else {
      setLogs(prev => [...prev, {
        id: Date.now(),
        type: "info",
        text: "Spawning local shell process...",
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setTimeout(() => {
         setIsConnected(true);
         setLogs(prev => [...prev, {
          id: Date.now(),
          type: "success",
          text: "Local connection established. Root access granted.",
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 1000);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const newLog: LogEntry = {
      id: Date.now(),
      type: "command",
      text: `azura@ubuntu:~$ ${command}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setLogs(prev => [...prev, newLog]);
    
    // Simulate response based on command
    setTimeout(async () => {
      let responseText = "Command executed successfully.";
      let type: LogEntry["type"] = "success";

      if (command === "ls") {
        responseText = "drwxr-xr-x  2 azura azura 4096 Jan 17 12:00 research\n-rw-r--r--  1 azura azura  248 Jan 17 12:05 notes.txt\ndrwxr-xr-x  5 azura azura 4096 Jan 17 11:30 project_archives";
      } else if (command.includes("apt") || command.includes("pkg")) {
        responseText = "Accumulating package data... Growth factor: 1.2x. Permanent changes committed to local storage.";
      } else if (command === "uname -a") {
        responseText = "Linux ubuntu-local 5.15.0-52-generic #58-Ubuntu SMP Thu Oct 13 13:00:49 UTC 2022 x86_64 x86_64 x86_64 GNU/Linux";
      } else if (command.includes("summarize")) {
        responseText = "Quantizing local knowledge graph... Summary generated. Redundancy reduced by 40%.";
        type = "info";
      } else {
        responseText = `Executed: ${command}. Changes saved to local environment.`;
      }

      const newLog = {
        id: Date.now() + 1,
        type,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setLogs(prev => {
        const updated = [...prev, newLog];
        saveLogsLocally(updated);
        return updated;
      });

      // Try to sync with server (optional - gracefully fails offline)
      try {
        await fetch("/api/commands/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: command,
            output: responseText,
            status: type,
          }),
        });
      } catch {
        // Offline mode - already saved locally
      }
    }, 600);

    setCommand("");
  };

  if (!isOpen) {
    return (
      <motion.div 
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-black/80 border border-primary/50 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:bg-black hover:scale-110 transition-all"
        >
          <Terminal className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`fixed z-50 bg-black/90 backdrop-blur-xl border border-primary/30 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${isMaximized ? "inset-4 rounded-lg" : "bottom-6 right-6 w-[90vw] max-w-[500px] h-[400px] rounded-xl"}
      `}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-primary/5 cursor-move">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="font-mono text-xs font-bold text-primary tracking-widest">TERMUX BRIDGE</span>
          <Badge 
            variant="outline" 
            className={`h-5 text-[10px] font-mono border-0 ${isConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'}`}
          >
            {isConnected ? 'CONNECTED' : 'SIMULATED'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleConnection} 
            className={`p-1 rounded hover:bg-white/10 transition-colors ${isConnected ? 'text-emerald-500' : 'text-muted-foreground'}`}
            title={isConnected ? "Disconnect Bridge" : "Connect to Localhost"}
          >
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={() => setIsMaximized(!isMaximized)} className="text-primary/60 hover:text-primary transition-colors">
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-primary/60 hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        className="flex-1 p-4 overflow-y-auto font-mono text-xs md:text-sm space-y-1 custom-scrollbar bg-black/50"
        ref={scrollRef}
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-muted-foreground opacity-50 shrink-0">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'command' ? 'text-white font-bold' : ''}
              ${log.type === 'info' ? 'text-blue-400' : ''}
              ${log.type === 'success' ? 'text-emerald-400' : ''}
              ${log.type === 'warning' ? 'text-yellow-400' : ''}
              ${log.type === 'error' ? 'text-red-500' : ''}
            `}>
              {log.text}
            </span>
          </div>
        ))}
        <div className="h-4" /> {/* Spacer */}
      </div>

      {/* Input Area */}
      <form onSubmit={handleCommand} className="p-2 bg-black/60 border-t border-primary/20 flex items-center gap-2">
        <span className="text-primary font-mono font-bold pl-2">{'>'}</span>
        <Input 
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="border-none bg-transparent focus-visible:ring-0 text-primary font-mono h-8 px-0 placeholder:text-primary/30"
          placeholder={isConnected ? "Execute on Termux..." : "Simulated command..."}
          autoFocus
        />
        <Button type="submit" size="sm" variant="ghost" className="text-primary hover:bg-primary/20">
          <Play className="h-3 w-3" />
        </Button>
      </form>
    </motion.div>
  );
}


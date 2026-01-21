import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, X, ChevronRight, Hash, Database, Globe, Cpu, Download, Wifi, WifiOff, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LogEntry {
  type: 'cmd' | 'out' | 'err' | 'sys' | 'pkg';
  text: string;
}

const TERMINAL_STORAGE_KEY = "mindseye_terminal_state";

function ZapIcon({className}: {className?: string}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.71 11 20V12h3l-7-5.29V12H7z"/><path d="M14.71 4 7.71 9.29V4h-3l7 5.29V4h3z"/></svg>
  );
}

export function CommandTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [history, setHistory] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(TERMINAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [
        { type: 'sys', text: 'MIND\'S EYE CORE BOOT SEQUENCE...' },
        { type: 'sys', text: 'LOCAL SHELL ENVIRONMENT v1.0.0-embedded' },
        { type: 'out', text: 'Welcome to Mind\'sEye Embedded Terminal.' },
        { type: 'out', text: 'Native execution engine: ACTIVE' },
      ];
    } catch {
      return [
        { type: 'sys', text: 'MIND\'S EYE CORE BOOT SEQUENCE...' },
        { type: 'sys', text: 'LOCAL SHELL ENVIRONMENT v1.0.0-embedded' },
        { type: 'out', text: 'Welcome to Mind\'sEye Embedded Terminal.' },
        { type: 'out', text: 'Native execution engine: ACTIVE' },
      ];
    }
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(TERMINAL_STORAGE_KEY, JSON.stringify(history));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'cmd', text: cmd }]);
    setInput("");

    // Simulate direct embedded terminal responses
    setTimeout(() => {
      if (cmd.startsWith('pkg install')) {
        const pkg = cmd.split(' ')[2] || 'core-utils';
        if (!isOnline) {
          setHistory(prev => [...prev, { type: 'err', text: `Fatal: Could not resolve host. Check network connection for package download.` }]);
          return;
        }
        
        setHistory(prev => [...prev, 
          { type: 'out', text: `Connecting to mindseye-repo.sh...` },
          { type: 'pkg', text: `Download: ${pkg} [5.2MB] [##########] 100%` },
          { type: 'out', text: `Unpacking ${pkg}...` },
          { type: 'sys', text: `NATIVE INSTALL COMPLETE: ${pkg}` }
        ]);
        toast.success(`Package ${pkg} installed successfully`);
      } else if (cmd === 'ls') {
        setHistory(prev => [...prev, { type: 'out', text: 'apps  cache  dev  home  models  proc  sys  usr' }]);
      } else if (cmd.startsWith('git clone')) {
        if (!isOnline) {
          setHistory(prev => [...prev, { type: 'err', text: `Fatal: Authentication failed. Network access required for git clone.` }]);
          return;
        }
        setHistory(prev => [...prev, 
          { type: 'out', text: `Directly embedding repository: ${cmd.split('/').pop()}` },
          { type: 'sys', text: 'RESOLVING NEURAL BRIDGE...' },
          { type: 'out', text: 'Object recovery: 100% (Native extraction)' }
        ]);
      } else if (cmd === 'clear') {
        setHistory([]);
      } else if (cmd === 'status') {
        setHistory(prev => [...prev, 
          { type: 'out', text: `Network: ${isOnline ? 'Online' : 'Offline'}` },
          { type: 'out', text: `Engine: Native/Embedded` },
          { type: 'out', text: `Disk: 2.4GB Available` }
        ]);
      } else if (cmd === 'help') {
        setHistory(prev => [...prev, { type: 'out', text: 'Available: pkg, git, ls, clear, status, help' }]);
      } else {
        setHistory(prev => [...prev, { type: 'err', text: `Mind'sEye Shell: command not found: ${cmd}` }]);
      }
    }, 400);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 bg-black/80 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:bg-primary/20 z-50"
        onClick={() => setIsOpen(true)}
      >
        <TerminalIcon className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end p-4 md:p-8 pointer-events-none"
          >
            <div className="w-full max-w-4xl mx-auto h-[70vh] bg-black/95 backdrop-blur-3xl border border-primary/30 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col pointer-events-auto overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer" onClick={() => setIsOpen(false)} />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold uppercase tracking-[0.2em]">
                    <Cpu className="w-4 h-4" />
                    Mind'sEye Embedded Shell
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                   <button 
                    onClick={() => setIsOnline(!isOnline)} 
                    className={`flex items-center gap-2 px-2 py-1 rounded border transition-all ${isOnline ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}
                   >
                     {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                     <span className="text-[10px] font-mono">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                   </button>
                   <div className="flex items-center gap-4 text-[10px] font-mono text-primary/40">
                      <span className="flex items-center gap-1"><ZapIcon className="w-3 h-3"/> LOCAL</span>
                      <span className="flex items-center gap-1 text-emerald-400/60"><ActivityIcon className="w-3 h-3"/> SYNCED</span>
                   </div>
                </div>
              </div>

              {/* Console Output */}
              <div 
                ref={scrollRef}
                className="flex-1 p-6 font-mono text-xs md:text-sm overflow-y-auto custom-scrollbar bg-black/40"
              >
                {history.map((entry, i) => (
                  <div key={i} className={`mb-2 leading-relaxed ${
                    entry.type === 'err' ? 'text-red-400' : 
                    entry.type === 'cmd' ? 'text-white font-bold' : 
                    entry.type === 'sys' ? 'text-emerald-500 opacity-60' :
                    entry.type === 'pkg' ? 'text-yellow-400' :
                    'text-primary/90'
                  }`}>
                    {entry.type === 'cmd' && <span className="text-primary mr-2">root@mindseye:~#</span>}
                    {entry.type === 'sys' && <span className="mr-2">»</span>}
                    {entry.type === 'pkg' && <Download className="inline w-3 h-3 mr-2 align-middle" />}
                    {entry.text}
                  </div>
                ))}
                <form onSubmit={handleCommand} className="flex items-center mt-2 group">
                  <span className="text-primary mr-2 group-focus-within:animate-pulse">root@mindseye:~#</span>
                  <input
                    autoFocus
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono"
                    spellCheck={false}
                  />
                </form>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-2 bg-primary/5 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[10px] font-mono text-primary/30 uppercase tracking-widest italic">Persistence: Local Device Storage Enabled</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-primary/50">MEM: 142MB</span>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

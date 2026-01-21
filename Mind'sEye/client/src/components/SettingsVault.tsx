import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Key, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff, 
  Check,
  Server,
  Brain,
  FolderOpen,
  Plus,
  Trash2,
  Cpu,
  Database,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_KEYS_STORAGE = "azura_api_keys";
const ABILITIES_STORAGE = "azura_abilities";
const STORAGE_PERMISSION_KEY = "azura_storage_permission";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
}

interface Ability {
  name: string;
  source: string;
  timestamp: string;
}

function getStoredApiKeys(): ApiKey[] {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveApiKeysLocally(keys: ApiKey[]) {
  localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys));
}

function getStoredAbilities(): Ability[] {
  try {
    const stored = localStorage.getItem(ABILITIES_STORAGE);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAbilitiesLocally(abilities: Ability[]) {
  localStorage.setItem(ABILITIES_STORAGE, JSON.stringify(abilities));
}

function ApiSection() {
  const [keys, setKeys] = useState<ApiKey[]>(getStoredApiKeys());
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const addKey = () => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: "",
      key: "",
      enabled: true
    };
    const updated = [...keys, newKey];
    setKeys(updated);
    saveApiKeysLocally(updated);
    toast.success("New API slot created");
  };

  const updateKey = (id: string, updates: Partial<ApiKey>) => {
    const newKeys = keys.map(k => k.id === id ? { ...k, ...updates } : k);
    setKeys(newKeys);
    saveApiKeysLocally(newKeys);
  };

  const removeKey = (id: string) => {
    const newKeys = keys.filter(k => k.id !== id);
    setKeys(newKeys);
    saveApiKeysLocally(newKeys);
    toast.info("API key removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <h4 className="font-display font-bold text-sm tracking-wide">API VAULT</h4>
        </div>
        <Button onClick={addKey} size="sm" variant="outline" className="h-7 px-2 border-primary/20 hover:bg-primary/10">
          <Plus className="w-3 h-3 mr-1" /> ADD KEY
        </Button>
      </div>
      
      <div className="space-y-3">
        {keys.map((k) => (
          <div key={k.id} className="p-4 rounded-lg border border-white/5 bg-black/20 space-y-3">
            <div className="flex items-center justify-between">
              <Input 
                value={k.name}
                onChange={e => updateKey(k.id, { name: e.target.value })}
                placeholder="Service Name (e.g. OpenAI)"
                className="h-7 bg-transparent border-none p-0 font-display font-bold text-sm focus-visible:ring-0 w-1/2"
              />
              <div className="flex items-center gap-2">
                <Switch 
                  checked={k.enabled}
                  onCheckedChange={enabled => updateKey(k.id, { enabled })}
                />
                <Button 
                  onClick={() => removeKey(k.id)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="relative flex items-center gap-2">
              <Input
                type={visibleKeys[k.id] ? "text" : "password"}
                value={k.key}
                onChange={e => updateKey(k.id, { key: e.target.value })}
                placeholder="Enter API Key / Token"
                className="bg-black/40 border-white/10 font-mono text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setVisibleKeys(prev => ({ ...prev, [k.id]: !prev[k.id] }))}
                className="absolute right-3 text-muted-foreground hover:text-white"
              >
                {visibleKeys[k.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneralAIConfig() {
  const [abilities, setAbilities] = useState<Ability[]>(getStoredAbilities());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newAbility = { name: file.name, source: "Local Model", timestamp: new Date().toISOString() };
      const updated = [...abilities, newAbility];
      setAbilities(updated);
      saveAbilitiesLocally(updated);
      toast.success(`Ability "${file.name}" imported and saved`);
    }
  };

  const removeAbility = (index: number) => {
    const updated = abilities.filter((_, i) => i !== index);
    setAbilities(updated);
    saveAbilitiesLocally(updated);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/20 text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm tracking-wide">MIND'S EYE ENGINE</h4>
              <p className="text-xs text-muted-foreground font-sans">Import models and cognitive abilities.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {abilities.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary uppercase tracking-tighter">{a.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">{a.source}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_hsl(var(--emerald-500))]" />
                <Button onClick={() => removeAbility(i)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-white/5">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileImport}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline" 
              className="w-full border-white/10 text-[10px] h-9 gap-2 uppercase tracking-widest font-bold hover:bg-primary/10 hover:border-primary/30"
            >
              <FolderOpen className="w-3 h-3" /> IMPORT MODEL FROM FILES
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsVault() {
  const [hasStoragePermission, setHasStoragePermission] = useState(() => {
    return localStorage.getItem(STORAGE_PERMISSION_KEY) === "granted";
  });
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const requestStoragePermission = () => {
    setShowPermissionPrompt(true);
  };

  const grantPermission = () => {
    localStorage.setItem(STORAGE_PERMISSION_KEY, "granted");
    setHasStoragePermission(true);
    setShowPermissionPrompt(false);
    toast.success("Full device storage access granted");
  };

  const handleSync = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: "Synchronizing Neural Core...",
      success: "Core synchronized and persistent data saved",
      error: "Sync failed",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full border-white/10 bg-black/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-lg"
        >
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-3xl border-primary/20 p-0 overflow-hidden gap-0 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <DialogHeader className="p-6 pb-2 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
               <Cpu className="w-5 h-5 text-primary" />
             </div>
             <div>
               <DialogTitle className="font-display text-xl tracking-widest text-white uppercase">Mind'sEye Configuration</DialogTitle>
               <DialogDescription className="font-mono text-[10px] text-primary/60 uppercase tracking-[0.2em]">
                 Authorization Level 5 • Neural Link Active
               </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar relative">
           <AnimatePresence>
             {!hasStoragePermission && showPermissionPrompt && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="absolute inset-x-6 top-6 z-50 p-6 bg-black/90 border border-primary/40 rounded-2xl backdrop-blur-2xl shadow-2xl space-y-4"
               >
                 <div className="flex items-center gap-3 text-primary">
                   <AlertTriangle className="w-6 h-6" />
                   <h3 className="font-display font-bold tracking-widest uppercase">Storage Authorization</h3>
                 </div>
                 <p className="text-xs font-sans text-muted-foreground leading-relaxed">
                   Mind'sEye requires full access to your device storage to index neural models, manage local repositories, and preserve your configuration across sessions.
                 </p>
                 <div className="flex gap-3 pt-2">
                   <Button onClick={grantPermission} className="flex-1 bg-primary text-primary-foreground font-bold text-[10px] tracking-widest uppercase">
                     Grant Access
                   </Button>
                   <Button onClick={() => setShowPermissionPrompt(false)} variant="ghost" className="flex-1 border border-white/10 font-bold text-[10px] tracking-widest uppercase">
                     Deny
                   </Button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   <p className="text-[10px] font-mono text-emerald-400/80 tracking-wider uppercase">
                     Core Integrity: Optimal. Environment Bridge: Active.
                   </p>
                 </div>
                 {!hasStoragePermission && (
                   <Button 
                     onClick={requestStoragePermission}
                     variant="outline" 
                     className="h-6 text-[8px] border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 uppercase tracking-tighter"
                   >
                     Authorize Storage
                   </Button>
                 )}
              </div>

              <div className="p-4 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-primary/60" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-white/80">Local Storage</span>
                    <span className="text-[8px] font-mono text-muted-foreground">Persist settings & models</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-primary">{hasStoragePermission ? "ENABLED" : "RESTRICTED"}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasStoragePermission ? "bg-primary" : "bg-muted"}`} />
                </div>
              </div>

              <GeneralAIConfig />
              
              <div className="border-t border-white/5 pt-4">
                <ApiSection />
              </div>

              <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Network Status</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-white/60">UPLINK LATENCY</span>
                  <span className="text-emerald-400">12ms</span>
                </div>
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/60 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              Mind'sEye Protocol • Ver 2.0.4
            </span>
          </div>
          <Button onClick={handleSync} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-[0_0_20px_hsl(var(--primary)/0.4)] h-8 text-xs font-bold uppercase tracking-widest">
            <Check className="w-4 h-4" />
            Synchronize
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

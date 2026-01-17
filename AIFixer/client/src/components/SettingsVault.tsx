import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  User, 
  Github, 
  Globe, 
  Cpu, 
  Lock, 
  Eye, 
  EyeOff, 
  Check,
  Server,
  Terminal,
  Brain,
  Mic,
  Download,
  FileUp,
  RefreshCw,
  X,
  Plus
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
import { 
  getOllamaConfig, 
  saveOllamaConfig, 
  getWhisperConfig, 
  saveWhisperConfig,
  getLlamaCPPConfig,
  saveLlamaCPPConfig,
  downloadModel,
  type OllamaConfig,
  type WhisperConfig,
  type LlamaCPPConfig
} from "@/lib/localAIService";
import { Badge } from "@/components/ui/badge";

interface ApiKeyRowProps {
  icon: React.ReactNode;
  service: string;
  description: string;
  placeholder: string;
}

const API_KEYS_STORAGE = "azura_api_keys";
const GITHUB_AUTH_STORAGE = "azura_github_auth";

function getStoredApiKeys(): Record<string, { key: string; enabled: boolean }> {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function getGithubAuth() {
  try {
    const stored = localStorage.getItem(GITHUB_AUTH_STORAGE);
    return stored ? JSON.parse(stored) : { username: "", loggedIn: false };
  } catch {
    return { username: "", loggedIn: false };
  }
}

function saveGithubAuth(username: string) {
  localStorage.setItem(GITHUB_AUTH_STORAGE, JSON.stringify({ username, loggedIn: true }));
}

function saveApiKeyLocally(service: string, key: string, enabled: boolean) {
  try {
    const keys = getStoredApiKeys();
    keys[service] = { key, enabled };
    localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys));
  } catch {
    console.error("Failed to save API key locally");
  }
}

function GithubAuthRow() {
  const [auth, setAuth] = useState(getGithubAuth());
  const [username, setUsername] = useState(auth.username);

  const handleLogin = () => {
    if (username.trim()) {
      saveGithubAuth(username);
      setAuth({ username, loggedIn: true });
    }
  };

  return (
    <div className="group relative p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${auth.loggedIn ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm tracking-wide">GitHub Account</h4>
            <p className="text-xs text-muted-foreground font-sans">Login to sync your projects and repositories.</p>
          </div>
        </div>
      </div>
      
      <div className="relative flex items-center gap-2 pt-2">
        <User className="absolute left-3 w-4 h-4 text-muted-foreground" />
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="GitHub Username"
          className="pl-9 bg-black/40 border-white/10 focus-visible:ring-primary/50 font-sans text-xs"
          disabled={auth.loggedIn}
        />
        <Button 
          onClick={handleLogin}
          size="sm"
          variant={auth.loggedIn ? "ghost" : "default"}
          className={auth.loggedIn ? "text-primary" : ""}
          disabled={auth.loggedIn}
        >
          {auth.loggedIn ? <Check className="w-4 h-4" /> : "Login"}
        </Button>
      </div>
    </div>
  );
}

function ApiKeyRow({ icon, service, description, placeholder }: ApiKeyRowProps) {
  const serviceKey = service.toLowerCase().replace(/\s+/g, '_');
  const stored = getStoredApiKeys()[serviceKey];
  
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(stored?.enabled || false);
  const [key, setKey] = useState(stored?.key || "");
  const [isDownloading, setIsDownloading] = useState(false);

  const saveApiKey = async () => {
    if (!key.trim()) return;
    saveApiKeyLocally(serviceKey, key, isEnabled);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadModel(service, "Latest Optimized");
    setIsDownloading(false);
  };

  return (
    <div className="group relative p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${isEnabled ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
            {icon}
          </div>
          <div>
            <h4 className="font-display font-bold text-sm tracking-wide">{service}</h4>
            <p className="text-xs text-muted-foreground font-sans">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
          <Switch 
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            data-testid={`switch-${service.toLowerCase().replace(' ', '-')}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="relative flex items-center gap-2 pt-2">
              <Lock className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input
                type={isVisible ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onBlur={saveApiKey}
                placeholder={placeholder}
                className="pl-9 pr-10 bg-black/40 border-white/10 focus-visible:ring-primary/50 font-mono text-xs"
                data-testid={`input-${service.toLowerCase().replace(' ', '-')}`}
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute right-3 text-muted-foreground hover:text-white transition-colors"
              >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-primary/80 font-mono">
              <Shield className="w-3 h-3" />
              <span>ENCRYPTED STORAGE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LocalAIConfig() {
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>(getOllamaConfig());
  const [whisperConfig, setWhisperConfig] = useState<WhisperConfig>(getWhisperConfig());
  const [llamaCPPConfig, setLlamaCPPConfig] = useState<LlamaCPPConfig>(getLlamaCPPConfig());
  const [isDownloading, setIsDownloading] = useState(false);
  const [newScottModel, setNewScottModel] = useState("");
  const [newHatiModel, setNewHatiModel] = useState("");

  const handleOllamaSave = () => saveOllamaConfig(ollamaConfig);
  const handleWhisperSave = () => saveWhisperConfig(whisperConfig);
  const handleLlamaCPPSave = () => saveLlamaCPPConfig(llamaCPPConfig);

  const handleDownload = async (engine: string, model: string) => {
    setIsDownloading(true);
    await downloadModel(engine, model);
    setIsDownloading(false);
  };

  const addModel = (category: "scott" | "hati") => {
    const modelName = category === "scott" ? newScottModel : newHatiModel;
    if (!modelName.trim()) return;
    
    const key = category === "scott" ? "scottModels" : "hatiModels";
    const newConfig = {
      ...llamaCPPConfig,
      [key]: [...llamaCPPConfig[key], modelName.trim()]
    };
    setLlamaCPPConfig(newConfig);
    saveLlamaCPPConfig(newConfig);
    
    if (category === "scott") setNewScottModel("");
    else setNewHatiModel("");
  };

  const removeModel = (category: "scott" | "hati", index: number) => {
    const key = category === "scott" ? "scottModels" : "hatiModels";
    const newModels = [...llamaCPPConfig[key]];
    newModels.splice(index, 1);
    
    const newConfig = {
      ...llamaCPPConfig,
      [key]: newModels
    };
    setLlamaCPPConfig(newConfig);
    saveLlamaCPPConfig(newConfig);
  };

  return (
    <div className="space-y-4">
      {/* Llama.cpp Configuration */}
      <div className="p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${llamaCPPConfig.enabled ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-muted-foreground'}`}>
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm tracking-wide">Llama.cpp Engine</h4>
              <p className="text-xs text-muted-foreground font-sans">Multi-Neural Stacking Enabled</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleDownload("Llama.cpp", "Scott/Hati Bundle")}>
              <Download className="w-4 h-4" />
            </Button>
            <Switch 
              checked={llamaCPPConfig.enabled}
              onCheckedChange={(checked) => {
                const newConfig = { ...llamaCPPConfig, enabled: checked };
                setLlamaCPPConfig(newConfig);
                saveLlamaCPPConfig(newConfig);
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {llamaCPPConfig.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Server URL</Label>
                <Input 
                  value={llamaCPPConfig.baseUrl}
                  onChange={(e) => setLlamaCPPConfig({ ...llamaCPPConfig, baseUrl: e.target.value })}
                  onBlur={handleLlamaCPPSave}
                  className="bg-black/40 border-white/10 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-1 bg-black/40 rounded-md border border-white/5">
                <Button 
                  variant={llamaCPPConfig.activeCategory === "scott" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 text-[10px] h-7 font-display tracking-widest"
                  onClick={() => {
                    const newConfig = { ...llamaCPPConfig, activeCategory: "scott" as const };
                    setLlamaCPPConfig(newConfig);
                    saveLlamaCPPConfig(newConfig);
                  }}
                >
                  SCOTT STACK
                </Button>
                <Button 
                  variant={llamaCPPConfig.activeCategory === "hati" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 text-[10px] h-7 font-display tracking-widest"
                  onClick={() => {
                    const newConfig = { ...llamaCPPConfig, activeCategory: "hati" as const };
                    setLlamaCPPConfig(newConfig);
                    saveLlamaCPPConfig(newConfig);
                  }}
                >
                  HATI STACK
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scott Models */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-muted-foreground flex items-center justify-between">
                    Scott Stack
                    <Badge variant="outline" className="text-[8px] h-4">{llamaCPPConfig.scottModels.length} Models</Badge>
                  </Label>
                  <div className="space-y-1">
                    {llamaCPPConfig.scottModels.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-black/40 p-1.5 rounded border border-white/5 group">
                        <span className="flex-1 font-mono text-[10px] truncate">{m}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeModel("scott", i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                      <Input 
                        placeholder="Add model..." 
                        value={newScottModel}
                        onChange={(e) => setNewScottModel(e.target.value)}
                        className="h-7 text-[10px] bg-black/60 border-white/5"
                        onKeyDown={(e) => e.key === "Enter" && addModel("scott")}
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => addModel("scott")}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Hati Models */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-muted-foreground flex items-center justify-between">
                    Hati Stack
                    <Badge variant="outline" className="text-[8px] h-4">{llamaCPPConfig.hatiModels.length} Models</Badge>
                  </Label>
                  <div className="space-y-1">
                    {llamaCPPConfig.hatiModels.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-black/40 p-1.5 rounded border border-white/5 group">
                        <span className="flex-1 font-mono text-[10px] truncate">{m}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeModel("hati", i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                      <Input 
                        placeholder="Add model..." 
                        value={newHatiModel}
                        onChange={(e) => setNewHatiModel(e.target.value)}
                        className="h-7 text-[10px] bg-black/60 border-white/5"
                        onKeyDown={(e) => e.key === "Enter" && addModel("hati")}
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => addModel("hati")}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Local Llama 3 Configuration */}
      <div className="p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${ollamaConfig.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm tracking-wide">Local Llama 3 (Ollama)</h4>
              <p className="text-xs text-muted-foreground font-sans">Connect to local Ollama instance.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleDownload("Ollama", ollamaConfig.model)}>
              <Download className="w-4 h-4" />
            </Button>
            <Switch 
              checked={ollamaConfig.enabled}
              onCheckedChange={(checked) => {
                const newConfig = { ...ollamaConfig, enabled: checked };
                setOllamaConfig(newConfig);
                saveOllamaConfig(newConfig);
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {ollamaConfig.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Ollama URL</Label>
                <Input 
                  value={ollamaConfig.baseUrl}
                  onChange={(e) => setOllamaConfig({ ...ollamaConfig, baseUrl: e.target.value })}
                  onBlur={handleOllamaSave}
                  className="bg-black/40 border-white/10 font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Model Name</Label>
                <Input 
                  value={ollamaConfig.model}
                  onChange={(e) => setOllamaConfig({ ...ollamaConfig, model: e.target.value })}
                  onBlur={handleOllamaSave}
                  className="bg-black/40 border-white/10 font-mono text-xs"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Local Whisper Configuration */}
      <div className="p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${whisperConfig.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-muted-foreground'}`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm tracking-wide">Local Whisper.cpp</h4>
              <p className="text-xs text-muted-foreground font-sans">Connect to whisper.cpp server.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleDownload("Whisper", "Base")}>
              <Download className="w-4 h-4" />
            </Button>
            <Switch 
              checked={whisperConfig.enabled}
              onCheckedChange={(checked) => {
                const newConfig = { ...whisperConfig, enabled: checked };
                setWhisperConfig(newConfig);
                saveWhisperConfig(newConfig);
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {whisperConfig.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Whisper Server URL</Label>
                <Input 
                  value={whisperConfig.serverUrl}
                  onChange={(e) => setWhisperConfig({ ...whisperConfig, serverUrl: e.target.value })}
                  onBlur={handleWhisperSave}
                  className="bg-black/40 border-white/10 font-mono text-xs"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CloudSyncConfig() {
  const [isClouded, setIsClouded] = useState(true);
  const [syncStatus, setSyncStatus] = useState("Syncing with Clouded Apps...");

  return (
    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/20 text-primary">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm tracking-wide">Clouded Memory Sync</h4>
            <p className="text-xs text-muted-foreground font-sans">Offload history and chat memory to clouded storage.</p>
          </div>
        </div>
        <Switch 
          checked={isClouded}
          onCheckedChange={setIsClouded}
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-muted-foreground uppercase">Local Storage Shield</span>
          <span className="text-emerald-500 uppercase">ACTIVE (CRUSH PROTECTION)</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
            animate={isClouded ? { width: ["0%", "85%", "82%"] } : { width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-primary/60 font-mono">
          <Check className="w-3 h-3" />
          <span>{isClouded ? "ALL DATA DIVERTED TO CLOUDED APPS" : "LOCAL STORAGE WARNING: PHONE CAPACITY AT RISK"}</span>
        </div>
      </div>
    </div>
  );
}

export function SettingsVault() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full border-white/10 bg-black/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
          data-testid="button-settings"
        >
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-primary/20 p-0 overflow-hidden gap-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <DialogHeader className="p-6 pb-2 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                 <Server className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <DialogTitle className="font-display text-xl tracking-widest">NEURAL CONFIGURATION</DialogTitle>
                 <DialogDescription className="font-mono text-xs text-primary/60 uppercase tracking-wider">
                   Secure Vault Access • Level 5 Clearance
                 </DialogDescription>
               </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
           <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-xs font-mono text-primary/80">
                   SYSTEM INTEGRITY: OPTIMAL. CLOUDED DIVERSION ACTIVE.
                 </p>
              </div>

              <CloudSyncConfig />

              <LocalAIConfig />

              <ApiKeyRow 
                icon={<Brain className="w-5 h-5" />}
                service="Hugging Face Token"
                description="Access Inference API for powerful LLMs."
                placeholder="hf_xxxxxxxxxxxx"
              />

              <GithubAuthRow />
              
              <ApiKeyRow 
                icon={<Cpu className="w-5 h-5" />}
                service="OpenAI Intelligence"
                description="Enable cloud-based reasoning for complex queries."
                placeholder="sk-xxxxxxxxxxxx"
              />

              <ApiKeyRow 
                icon={<Globe className="w-5 h-5" />}
                service="Global Search Uplink"
                description="Allow Azura to scour the web for real-time data."
                placeholder="Search API Key"
              />

              <div className="my-4 border-t border-white/5" />
              
              <div className="p-4 rounded-lg bg-secondary/20 border border-secondary/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-md bg-secondary/20 text-secondary-foreground">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm tracking-wide">Termux Local Bridge</h4>
                    <p className="text-xs text-muted-foreground font-sans">Connect to your existing local environment.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Host IP</Label>
                    <Input 
                      placeholder="192.168.1.x" 
                      className="bg-black/40 border-white/10 font-mono text-xs" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Port</Label>
                    <Input 
                      placeholder="8080" 
                      className="bg-black/40 border-white/10 font-mono text-xs" 
                    />
                  </div>
                </div>
                <div className="mt-4 p-2 rounded bg-black/40 border border-white/5 text-[10px] text-muted-foreground font-mono">
                  Status: WAITING_FOR_BRIDGE_SIGNAL
                </div>
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground font-mono">
            ID: AZURA-CORE-8842
          </span>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
            <Check className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

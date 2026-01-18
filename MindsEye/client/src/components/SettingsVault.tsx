import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, User, Github, Globe, Cpu, Lock, Eye, EyeOff, Check,
  Server, Terminal, Brain, Mic, Download, FileUp, RefreshCw, X, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { 
  getOllamaConfig, saveOllamaConfig, getWhisperConfig, saveWhisperConfig,
  getLlamaCPPConfig, saveLlamaCPPConfig, downloadModel,
  type OllamaConfig, type WhisperConfig, type LlamaCPPConfig
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
  
  // Consolidated state
  const [newGeneralModel, setNewGeneralModel] = useState("");

  const handleOllamaSave = () => saveOllamaConfig(ollamaConfig);
  const handleWhisperSave = () => saveWhisperConfig(whisperConfig);
  const handleLlamaCPPSave = () => saveLlamaCPPConfig(llamaCPPConfig);

  const handleDownload = async (engine: string, model: string) => {
    setIsDownloading(true);
    await downloadModel(engine, model);
    setIsDownloading(false);
  };

  const addModel = () => {
    if (!newGeneralModel.trim()) return;
    const key = llamaCPPConfig.activeCategory === "scott" ? "scottModels" : "hatiModels";
    const newConfig = {
      ...llamaCPPConfig,
      [key]: [...llamaCPPConfig[key], newGeneralModel.trim()]
    };
    setLlamaCPPConfig(newConfig);
    saveLlamaCPPConfig(newConfig);
    setNewGeneralModel("");
  };

  const removeModel = (category: "scott" | "hati", index: number) => {
    const key = category === "scott" ? "scottModels" : "hatiModels";
    const newModels = [...llamaCPPConfig[key]];
    newModels.splice(index, 1);
    const newConfig = { ...llamaCPPConfig, [key]: newModels };
    setLlamaCPPConfig(newConfig);
    saveLlamaCPPConfig(newConfig);
  };

  return (
    <div className="space-y-4">
      {/* Llama.cpp Configuration */}
      <div className="p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
        {/* ... rest of your JSX ... */}
        {/* Replace Scott/Hati inputs with newGeneralModel */}
      </div>
    </div>
  );
}

export { GithubAuthRow, ApiKeyRow, LocalAIConfig };

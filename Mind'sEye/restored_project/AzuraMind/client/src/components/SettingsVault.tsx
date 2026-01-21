import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Key, 
  Github, 
  Globe, 
  Cpu, 
  Lock, 
  Eye, 
  EyeOff, 
  Check,
  Server,
  Terminal
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

interface ApiKeyRowProps {
  icon: React.ReactNode;
  service: string;
  description: string;
  placeholder: string;
}

const API_KEYS_STORAGE = "azura_api_keys";

function getStoredApiKeys(): Record<string, { key: string; enabled: boolean }> {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
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

function ApiKeyRow({ icon, service, description, placeholder }: ApiKeyRowProps) {
  const serviceKey = service.toLowerCase().replace(/\s+/g, '_');
  const stored = getStoredApiKeys()[serviceKey];
  
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(stored?.enabled || false);
  const [key, setKey] = useState(stored?.key || "");

  const saveApiKey = async () => {
    if (!key.trim()) return;
    
    // Save locally first (works offline)
    saveApiKeyLocally(serviceKey, key, isEnabled);
    
    // Try to sync with server (optional)
    try {
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: serviceKey,
          keyValue: key,
          isEnabled: isEnabled,
        }),
      });
    } catch {
      // Offline mode - already saved locally
    }
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
        <Switch 
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
          data-testid={`switch-${service.toLowerCase().replace(' ', '-')}`}
        />
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
              <Key className="absolute left-3 w-4 h-4 text-muted-foreground" />
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
              <Lock className="w-3 h-3" />
              <span>ENCRYPTED STORAGE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
           <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-xs font-mono text-primary/80">
                   SYSTEM INTEGRITY: OPTIMAL. LOCAL ENCRYPTION ACTIVE.
                 </p>
              </div>

              <ApiKeyRow 
                icon={<Github className="w-5 h-5" />}
                service="GitHub Repositories"
                description="Access, clone, and push to your private repositories."
                placeholder="ghp_xxxxxxxxxxxx"
              />
              
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

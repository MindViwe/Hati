import { motion } from "framer-motion";
import { Check, X, RefreshCw, Eye, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreationPreviewProps {
  type: "code" | "design" | "image";
  title: string;
  content?: React.ReactNode;
}

export function CreationPreview({ type, title, content }: CreationPreviewProps) {
  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto mt-8 relative group"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Holographic Projector Base Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
      
      <div className="relative glass-panel rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary animate-pulse" />
            <span className="font-display text-sm tracking-wider text-primary/80 uppercase">
              Simulated Preview
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="font-sans text-sm text-muted-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-500 uppercase tracking-widest">
              Draft Mode
            </div>
          </div>
        </div>

        {/* Preview Content Area */}
        <div className="p-6 min-h-[300px] bg-black/20 relative overflow-hidden">
          {/* Grid Overlay for "Draft" feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          {/* Content Container */}
          <div className="relative z-10">
             {content || (
               <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-4">
                 <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center animate-spin-slow">
                    <RefreshCw className="h-6 w-6 opacity-50" />
                 </div>
                 <p className="font-mono text-xs tracking-widest">RENDERING PROJECTION...</p>
               </div>
             )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center gap-4">
           <Button variant="ghost" className="text-muted-foreground hover:text-white gap-2" size="sm">
             <RefreshCw className="h-4 w-4" />
             Regenerate
           </Button>
           
           <div className="flex items-center gap-2">
             <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 text-destructive hover:text-destructive gap-2" size="sm">
               <X className="h-4 w-4" />
               Discard
             </Button>
             <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-[0_0_15px_hsl(var(--primary)/0.3)]" size="sm">
               <Check className="h-4 w-4" />
               Approve & Finalize
             </Button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

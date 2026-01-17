import { AzuraAvatar } from "@/components/AzuraAvatar";
import { ChatInterface } from "@/components/ChatInterface";
import { DashboardGrid } from "@/components/DashboardGrid";
import { SettingsVault } from "@/components/SettingsVault";
import { CommandTerminal } from "@/components/CommandTerminal";
import { CreationPreview } from "@/components/CreationPreview";
import { IntelligenceNotes } from "@/components/IntelligenceNotes";
import bgTexture from "@assets/generated_images/dark_cybernetic_background_texture.png";

export default function Home() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      {/* Background Texture */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{ 
          backgroundImage: `url(${bgTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Ambient Mesh Gradient */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center min-h-screen py-12 px-4">
        {/* Header / Branding */}
        <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 bg-primary/80 rounded-full" />
            <h1 className="font-display text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              MIND'S EYE
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
             <IntelligenceNotes />
             <div className="w-px h-4 bg-white/10 mx-2" />
             <span>SYS.VER.2.0.4</span>
             <span className="hidden md:inline-block px-2 py-1 border border-white/10 rounded bg-white/5">SECURE CONNECTION</span>
             <SettingsVault />
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto gap-8 mt-16 md:mt-0 mb-12">
          <AzuraAvatar />
          
          <div className="text-center space-y-2 max-w-md mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold neon-text">
              AZURA ONLINE
            </h2>
            <p className="text-muted-foreground font-sans text-lg">
              Your personal intelligence is active. <br/>
              Ready to design, analyze, and create.
            </p>
          </div>

          <ChatInterface />
          
          <CreationPreview 
            type="design" 
            title="App Prototype Preview" 
            content={
              <div className="bg-slate-900 rounded-lg p-4 border border-white/5 shadow-2xl">
                <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-secondary/20 rounded mb-4 flex items-center justify-center border border-white/5">
                  <span className="text-primary font-display tracking-widest text-xs">VISUAL ENGINE ACTIVE</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-white/5 rounded" />
                  <div className="h-4 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            }
          />
        </div>

        {/* Integrations Grid */}
        <DashboardGrid />
        
        {/* Footer Status */}
        <footer className="w-full mt-12 py-4 border-t border-white/5 bg-black/20 backdrop-blur-sm text-center">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Neural Link Established • Privacy Mode: Active • Local Processing Only
          </p>
        </footer>

        {/* Global Components */}
        <CommandTerminal />
      </main>
    </div>
  );
}

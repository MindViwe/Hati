import { motion } from "framer-motion";
import aiAvatar from "@assets/generated_images/glowing_digital_ai_eye_avatar.png";

export function AzuraAvatar() {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 md:w-96 md:h-96">
      {/* Outer rotating rings */}
      <motion.div
        className="absolute inset-0 border-2 border-primary/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-4 border border-secondary/40 rounded-full border-dashed"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Core Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* The Eye */}
      <motion.div
        className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_50px_rgba(0,255,255,0.3)] bg-black"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <img 
          src={aiAvatar} 
          alt="Azura's Eye" 
          className="w-full h-full object-cover opacity-90 mix-blend-screen"
        />
        
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent w-full h-full animate-scan" />
      </motion.div>

      {/* Status Indicators */}
      <motion.div 
        className="absolute -bottom-12 flex gap-2 text-xs font-display tracking-widest text-primary/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span>ONLINE</span>
        <span className="animate-pulse">●</span>
        <span>LISTENING</span>
      </motion.div>
    </div>
  );
}

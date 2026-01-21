import { motion } from "framer-motion";
import { FolderOpen, Smartphone, BookOpen, Cpu, HardDrive, Cloud } from "lucide-react";

interface GridItemProps {
  icon: React.ReactNode;
  label: string;
  status: string;
  delay: number;
}

function GridItem({ icon, label, status, delay }: GridItemProps) {
  return (
    <motion.div
      className="group relative glass-panel rounded-xl p-4 md:p-6 hover:bg-white/5 transition-colors cursor-pointer overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-shadow">
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{status}</span>
        </div>
      </div>

      <h3 className="text-lg font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{label}</h3>
      <p className="text-sm text-muted-foreground font-sans line-clamp-2">Access granted. Synchronizing data stream...</p>
    </motion.div>
  );
}

export function DashboardGrid() {
  const items = [
    { icon: <Smartphone className="h-6 w-6" />, label: "Phone Access", status: "Linked", delay: 0.6 },
    { icon: <FolderOpen className="h-6 w-6" />, label: "My Files", status: "Indexed", delay: 0.7 },
    { icon: <BookOpen className="h-6 w-6" />, label: "Stories", status: "Reading", delay: 0.8 },
    { icon: <Cpu className="h-6 w-6" />, label: "Projects", status: "Active", delay: 0.9 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mx-auto mt-12 px-4">
      {items.map((item, index) => (
        <GridItem key={index} {...item} />
      ))}
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { MessageSquare, LogOut, Terminal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/chat", icon: MessageSquare, label: "Hati" },
    { href: "/terminal", icon: Terminal, label: "Terminal" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("hati_auth");
    window.location.reload();
  };

  return (
    <nav className="w-20 lg:w-64 h-screen bg-secondary/50 border-r border-white/5 flex flex-col glass-panel fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-display font-bold text-white hidden lg:block tracking-widest neon-glow">
          HATI
        </span>
      </div>

      <div className="flex-1 px-4 py-8 space-y-4">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-3px_rgba(147,51,234,0.3)]"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                )}
                <item.icon
                  className={cn(
                    "w-6 h-6 shrink-0 transition-transform duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )}
                />
                <span className="font-medium hidden lg:block">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors rounded-xl hover:bg-destructive/10"
        >
          <LogOut className="w-6 h-6 shrink-0" />
          <span className="font-medium hidden lg:block">Disconnect</span>
        </button>
      </div>
    </nav>
  );
}

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/Login";
import Chat from "@/pages/Chat";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

function PrivateRoute({ component: Component, ...rest }: any) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem("hati_auth");
    if (!auth) {
      setLocation("/");
    } else {
      setIsAuthenticated(true);
    }
  }, [setLocation]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <main className="flex-1 p-4 lg:p-6 h-full overflow-hidden relative">
        <Component {...rest} />
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Private Routes */}
      <Route path="/chat">
        <PrivateRoute component={Chat} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

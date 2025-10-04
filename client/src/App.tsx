import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import Assets from "@/pages/assets";
import Employees from "@/pages/employees";
import Assignments from "@/pages/assignments";
import Locations from "@/pages/locations";
import Maintenance from "@/pages/maintenance";
import Warranty from "@/pages/warranty";
import Compliance from "@/pages/compliance";
import CCTV from "@/pages/cctv";
import Biometric from "@/pages/biometric";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          setLocation('/login');
        }
      } catch (error) {
        setLocation('/login');
      }
    };

    checkAuth();
  }, [setLocation]);

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {(params) => <ProtectedRoute component={Dashboard} {...params} />}
      </Route>
      <Route path="/assets">
        {(params) => <ProtectedRoute component={Assets} {...params} />}
      </Route>
      <Route path="/employees">
        {(params) => <ProtectedRoute component={Employees} {...params} />}
      </Route>
      <Route path="/assignments">
        {(params) => <ProtectedRoute component={Assignments} {...params} />}
      </Route>
      <Route path="/locations">
        {(params) => <ProtectedRoute component={Locations} {...params} />}
      </Route>
      <Route path="/maintenance">
        {(params) => <ProtectedRoute component={Maintenance} {...params} />}
      </Route>
      <Route path="/warranty">
        {(params) => <ProtectedRoute component={Warranty} {...params} />}
      </Route>
      <Route path="/compliance">
        {(params) => <ProtectedRoute component={Compliance} {...params} />}
      </Route>
      <Route path="/cctv">
        {(params) => <ProtectedRoute component={CCTV} {...params} />}
      </Route>
      <Route path="/biometric">
        {(params) => <ProtectedRoute component={Biometric} {...params} />}
      </Route>
      <Route path="/reports">
        {(params) => <ProtectedRoute component={Reports} {...params} />}
      </Route>
      <Route path="/settings">
        {(params) => <ProtectedRoute component={Settings} {...params} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isLoginPage = location === '/login';

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoginPage) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="fixed inset-0 glass-bg -z-10"></div>
        
        {/* Animated Background Shapes */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float-slower"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <Router />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bodycraft-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

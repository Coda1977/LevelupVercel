import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import CategoryPage from "./pages/category";

const Landing = lazy(() => import("@/pages/landing"));
const Learn = lazy(() => import("@/pages/learn"));
const Chat = lazy(() => import("@/pages/chat"));
const Chapter = lazy(() => import("@/pages/chapter"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Team = lazy(() => import("@/pages/team"));
const Admin = lazy(() => import("@/pages/admin-simple"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col md:px-0 px-1 md:py-0 py-1">
      <Navigation />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[var(--accent-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div></div>}>
        <Switch>
          <Route path="/" component={!isAuthenticated ? Landing : Learn} />
          <Route path="/dashboard" component={isAuthenticated ? Learn : Landing} />
          <Route path="/learn" component={isAuthenticated ? Learn : Landing} />
          <Route path="/chat" component={isAuthenticated ? Chat : Landing} />
          <Route path="/analytics" component={isAuthenticated ? Analytics : Landing} />
          <Route path="/team" component={isAuthenticated ? Team : Landing} />
          <Route path="/admin" component={isAuthenticated ? Admin : Landing} />
          <Route path="/chapter/:slug" component={isAuthenticated ? Chapter : Landing} />
          <Route path="/category/:slug" component={CategoryPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-[var(--text-secondary)] mb-4">
            The application encountered an unexpected error. Please refresh the page or contact support if the problem persists.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[var(--accent-blue)] text-white px-6 py-2 rounded-lg hover:bg-[var(--accent-yellow)] hover:text-[var(--text-primary)] transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

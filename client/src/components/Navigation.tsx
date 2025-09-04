import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthModal } from "@/components/AuthModal";

export function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isActive = (path: string) => {
    if (path === '/learn' && (location === '/' || location === '/dashboard' || location === '/learn')) return true;
    if (path !== '/learn' && location.startsWith(path)) return true;
    return false;
  };

  const baseNavLinks = [
    { path: '/learn', label: 'Learn' },
    { path: '/chat', label: 'AI Coach', className: 'ai-coach' },
    { path: '/analytics', label: 'Analytics' }
  ];

  const adminNavLinks = [
    { path: '/team', label: 'Team' },
    { path: '/admin', label: 'Admin' }
  ];

  const navLinks = isAdmin ? [...baseNavLinks, ...adminNavLinks] : baseNavLinks;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="text-3xl font-black tracking-tight text-[var(--text-primary)] hover:opacity-80 transition-opacity">
            Level<span className="relative -top-1.5 ml-1">Up</span>
          </Link>
          
          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`nav-link px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive(link.path) ? 'active' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  } ${link.className || ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--accent-yellow)] rounded-full flex items-center justify-center font-bold text-base">
                  {user.user_metadata?.first_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="hidden md:block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-6 py-3 rounded-full font-semibold text-base hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Sign In
              </Button>
            )}
            
            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-4 mt-8">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        href={link.path}
                        className={`nav-link px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                          isActive(link.path) ? 'active' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        } ${link.className || ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] justify-start px-5"
                    >
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
    
    <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)} 
      mode="signin"
    />
  </>
  );
}

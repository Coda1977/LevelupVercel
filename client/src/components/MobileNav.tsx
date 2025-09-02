import { Link, useLocation } from "wouter";
import { Home, BookOpen, MessageSquare } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { path: '/learn', label: 'Home', icon: Home },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  const isActive = (path: string) => {
    if (path === '/learn' && (location === '/' || location === '/dashboard' || location === '/learn')) return true;
    if (path !== '/learn' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center p-3 text-xs transition-colors ${
                isActive(item.path) 
                  ? 'text-[var(--text-primary)] font-semibold' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { Outlet, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Player } from './Player';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export function Layout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useThemeStore((s) => s.theme);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--bg-primary)]" style={{ minHeight: '-webkit-fill-available' }}>
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--bg-primary)] border-b border-[var(--border)] flex-shrink-0">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Resonant</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-[var(--text-primary)]"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Sidebar - hidden on mobile, visible on lg+ */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:relative
          inset-y-0 left-0
          z-40 lg:z-0
          w-64
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-primary)]">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Player bar - ensure it stays visible above mobile browser chrome */}
      <div className="flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Player />
      </div>
    </div>
  );
}

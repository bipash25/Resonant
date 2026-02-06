import { Outlet, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Player } from './Player';
import { useAuthStore } from '../store/authStore';

export function Layout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-black" style={{ minHeight: '-webkit-fill-available' }}>
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-black border-b border-[#282828] flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Resonant</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white"
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
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
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

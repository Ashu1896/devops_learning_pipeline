import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, Camera, History, User, LogOut, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { user, signOut } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('nutrivision_theme');
    return (saved as 'light' | 'dark') || 'dark'; // Default to dark for premium aesthetics
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nutrivision_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'capture', label: 'Scan Food', icon: Camera },
    { id: 'history', label: 'Diary', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-zinc-100 transition-colors duration-300">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
            N
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
              NutriVision <span className="text-emerald-500 font-extrabold">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 -mt-1 font-medium tracking-wide">PWA PRODUCTION GRADE</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
            ) : (
              <Sun className="w-5 h-5 text-slate-600 dark:text-zinc-400 animate-pulse-subtle" />
            )}
          </button>

          {/* User Profile / Quick Stats */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-zinc-800">
              <div className="text-right">
                <p className="text-xs font-semibold">{user.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-500 font-bold uppercase shadow-inner">
                {user.name ? user.name[0] : 'U'}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto pb-20 md:pb-0 md:px-4">
        {/* Desktop Sidebar Navigation (breakpoints: md+) */}
        <aside className="hidden md:flex flex-col w-64 py-8 px-4 gap-6 border-r border-slate-200/50 dark:border-zinc-800/40">
          <div className="flex flex-col gap-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900/50 hover:translate-x-1'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 px-4 py-6 md:py-8 overflow-y-auto no-scrollbar md:px-6">
          <div className="w-full h-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Tab Bar Navigation (breakpoints: 320px-767px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-slate-200/60 dark:border-zinc-900 shadow-xl flex justify-around py-3 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1.5 px-3 py-1"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 scale-110'
                    : 'text-slate-500 dark:text-zinc-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-bold tracking-tight transition-colors duration-200 ${
                  isActive ? 'text-emerald-500' : 'text-slate-500 dark:text-zinc-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

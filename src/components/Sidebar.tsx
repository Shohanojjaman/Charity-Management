import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  Target as TargetIcon, 
  PlusCircle, 
  HelpCircle,
  Users,
  Heart,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { User } from 'firebase/auth';

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, theme, toggleTheme, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'targets', label: 'Targets', icon: TargetIcon },
    { id: 'entry', label: 'Entry', icon: PlusCircle },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-surface-container-low dark:bg-surface-container-lowest flex flex-col py-8 px-4 z-50 border-r border-surface-container-high dark:border-surface-container-low transition-colors duration-300">
      <div className="mb-12 px-4">
        <div className="flex items-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary fill-primary/10" />
            <h1 className="text-2xl font-black text-on-surface headline-font tracking-tighter">Altruist.</h1>
        </div>
        <p className="text-[10px] font-sans text-on-surface-variant/40 dark:text-on-surface-variant/60 uppercase tracking-[0.3em] font-black">Stewardship Ledger</p>
      </div>

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 headline-font font-black tracking-tight active:scale-[0.97] text-sm",
              activeTab === item.id 
                ? "text-primary bg-surface-container-high dark:bg-surface-container-low shadow-ambient" 
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 dark:hover:bg-surface-container-low/30"
            )}
          >
            <item.icon className={cn("w-5 h-5 transition-transform duration-300", activeTab === item.id ? "text-primary scale-110" : "text-on-surface-variant")} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-2 pt-6 border-t border-surface-container-high dark:border-surface-container-low">
        <div className="flex items-center justify-between gap-2">
          {/* Username (Bottom Left) */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary/10 shrink-0">
              <img 
                src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                referrerPolicy="no-referrer"
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-on-surface truncate headline-font leading-tight">{user?.displayName?.split(' ')[0] || 'Steward'}</p>
              <p className="text-[8px] font-bold text-on-surface-variant truncate opacity-60">Authorized</p>
            </div>
          </div>

          {/* Controls (Bottom Right) */}
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Night Mode' : 'Light Mode'}
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high dark:hover:bg-surface-container-low rounded-lg transition-all active:scale-95"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            
            <button 
              onClick={onLogout}
              title="Terminate Session"
              className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

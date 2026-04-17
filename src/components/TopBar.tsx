import React from 'react';
import { Search, Bell, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  user: User | null;
  onLogout: () => void;
  activeTab: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function TopBar({ user, onLogout, activeTab, theme, toggleTheme }: TopBarProps) {
  const getTabTitle = (tab: string) => {
    switch(tab) {
      case 'dashboard': return 'Dashboard';
      case 'history': return 'History';
      case 'targets': return 'Targets';
      case 'entry': return 'New Entry';
      default: return 'Altruist';
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-20 lg:h-16 z-40 bg-surface-container-lowest/80 dark:bg-surface-container-lowest/90 backdrop-blur-xl shadow-ambient flex items-center justify-between px-6 lg:px-8 border-b border-surface-container-high/30 dark:border-surface-container-low transition-colors duration-300">
      {/* Mobile Header: Avatar + Title + (Theme & Logout) */}
      <div className="flex lg:hidden items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 bg-primary-container shadow-sm">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
              referrerPolicy="no-referrer"
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="headline-font text-lg font-black text-primary tracking-tight">
            {getTabTitle(activeTab)}
          </span>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={toggleTheme}
            className="text-primary hover:bg-primary-container/20 p-2.5 rounded-full transition-all"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={onLogout}
            className="text-error hover:bg-error-container/10 p-2.5 rounded-full transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header: Brand/Search + Notifications + User */}
      <div className="hidden lg:flex items-center justify-between w-full">
        <div className="flex items-center gap-8">
          <span className="headline-font text-xl font-extrabold text-primary tracking-tight">The Sanctuary</span>
          
          <div className="relative group focus-within:ring-2 focus-within:ring-primary/10 rounded-2xl transition-all">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
              className="bg-surface-container-low dark:bg-surface-container-low/50 border-none rounded-2xl py-2 pl-10 pr-4 text-sm w-48 xl:w-64 focus:ring-0 focus:bg-surface-bright dark:focus:bg-surface-bright/20 transition-all font-medium text-on-surface-variant dark:text-on-surface-variant/80" 
              placeholder="Search entries..." 
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-all p-2.5 hover:bg-surface-container-high/50 dark:hover:bg-surface-container-low/30 rounded-xl relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-secondary rounded-full border-2 border-white dark:border-surface-container-lowest"></span>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-surface-container-high/50 dark:hover:bg-surface-container-low/30 transition-all border border-transparent hover:border-surface-container-high dark:hover:border-surface-container-low outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/10">
                <img src={user?.photoURL || ''} alt="" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface dark:text-on-surface/90 line-clamp-1">{user?.displayName?.split(' ')[0]}</span>
                <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Steward</span>
              </div>
              <ChevronDown className="w-3 h-3 text-on-surface-variant" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-surface-container-lowest dark:bg-surface-container-low border-surface-container-high dark:border-surface-container-high/20 shadow-ambient">
              <DropdownMenuLabel className="font-black headline-font uppercase tracking-tight text-xs text-primary px-3 py-2">Account Management</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-surface-container-low dark:bg-surface-container-high/40" />
              <DropdownMenuItem onClick={onLogout} className="rounded-xl text-error focus:text-on-error focus:bg-error/80 dark:focus:bg-error p-3 flex items-center gap-3 cursor-pointer">
                <LogOut className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest">Terminate Session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

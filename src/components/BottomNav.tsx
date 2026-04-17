import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  Target as TargetIcon, 
  PlusCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'targets', label: 'Targets', icon: TargetIcon },
    { id: 'entry', label: 'Entry', icon: PlusCircle },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-surface-container-high/50 px-6 flex items-center justify-between z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all duration-300 relative py-2 px-4 rounded-2xl",
            activeTab === item.id 
              ? "text-primary bg-primary-container/20" 
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-primary" : "text-on-surface-variant")} />
          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          {activeTab === item.id && (
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </nav>
  );
}

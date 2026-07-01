'use client';

import { type ViewType } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import {
  LayoutDashboard, Crosshair, Timer, CalendarDays, CheckSquare,
  BookOpen, StickyNote, Target, BarChart3, Repeat, GraduationCap,
  Sparkles, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
  { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={20} /> },
  { id: 'planner', label: 'Planner', icon: <CalendarDays size={20} /> },
  { id: 'checklist', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { id: 'analytics', label: 'Stats', icon: <BarChart3 size={20} /> },
  { id: 'settings', label: 'More', icon: <Settings size={20} /> },
];

export function MobileNav() {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all',
                isActive ? 'text-purple-400' : 'text-white/40'
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
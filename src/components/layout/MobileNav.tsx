'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  LayoutDashboard, Crosshair, Timer, CalendarDays, CheckSquare,
  BookOpen, StickyNote, Target, BarChart3, Repeat, GraduationCap,
  Sparkles, Settings, Grid2x2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Primary items pinned to the bottom bar.
const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} strokeWidth={1.8} /> },
  { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={20} strokeWidth={1.8} /> },
  { id: 'planner', label: 'Planner', icon: <CalendarDays size={20} strokeWidth={1.8} /> },
  { id: 'checklist', label: 'Tasks', icon: <CheckSquare size={20} strokeWidth={1.8} /> },
];

// Everything else lives behind "More" so no option is ever unreachable on mobile.
const moreItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'focus', label: 'Focus Mode', icon: <Crosshair size={18} strokeWidth={1.8} /> },
  { id: 'subjects', label: 'Subjects', icon: <BookOpen size={18} strokeWidth={1.8} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={18} strokeWidth={1.8} /> },
  { id: 'goals', label: 'Goals', icon: <Target size={18} strokeWidth={1.8} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} strokeWidth={1.8} /> },
  { id: 'habits', label: 'Habits', icon: <Repeat size={18} strokeWidth={1.8} /> },
  { id: 'exams', label: 'Exams', icon: <GraduationCap size={18} strokeWidth={1.8} /> },
  { id: 'motivation', label: 'Motivation', icon: <Sparkles size={18} strokeWidth={1.8} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} strokeWidth={1.8} /> },
];

export function MobileNav() {
  const { currentView, setCurrentView } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some((item) => item.id === currentView);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0c0c0f]/90 backdrop-blur-2xl md:hidden">
        <div className="flex items-center justify-around px-1 py-1.5 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-all duration-200',
                  isActive ? 'text-purple-400' : 'text-white/30 active:text-white/50'
                )}
              >
                {isActive && (
                  <div className="absolute -top-1.5 h-1 w-6 rounded-full bg-purple-500" />
                )}
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-all duration-200',
              isMoreActive ? 'text-purple-400' : 'text-white/30 active:text-white/50'
            )}
          >
            {isMoreActive && (
              <div className="absolute -top-1.5 h-1 w-6 rounded-full bg-purple-500" />
            )}
            <Grid2x2 size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#0c0c0f] border-white/[0.06] rounded-t-3xl pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <SheetHeader>
            <SheetTitle className="text-white">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pb-6 pt-2">
            {moreItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all duration-200',
                    isActive
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                      : 'border-white/[0.06] bg-white/[0.03] text-white/60 active:bg-white/[0.06]'
                  )}
                >
                  {item.icon}
                  <span className="text-[11px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

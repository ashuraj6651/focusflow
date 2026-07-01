'use client';

import { useAuth } from "@/contexts/AuthContext";
import { cn } from '@/lib/utils';
import { type ViewType } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Crosshair,
  Timer,
  CalendarDays,
  CheckSquare,
  BookOpen,
  StickyNote,
  Target,
  BarChart3,
  Repeat,
  GraduationCap,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const navItems: { id: ViewType; label: string; icon: React.ReactNode; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'focus', label: 'Focus Mode', icon: <Crosshair size={20} /> },
  { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={20} /> },
  { id: 'planner', label: 'Planner', icon: <CalendarDays size={20} />, section: 'Organize' },
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={20} /> },
  { id: 'subjects', label: 'Subjects', icon: <BookOpen size={20} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={20} /> },
  { id: 'goals', label: 'Goals', icon: <Target size={20} />, section: 'Track' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { id: 'habits', label: 'Habits', icon: <Repeat size={20} /> },
  { id: 'exams', label: 'Exams', icon: <GraduationCap size={20} />, section: 'More' },
  { id: 'motivation', label: 'Motivation', icon: <Sparkles size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, settings } = useAppStore();

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 68 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-black/40 backdrop-blur-2xl"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-400">
                  <GraduationCap size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">FocusFlow</h1>
                  <p className="text-[10px] text-white/40">Study Smart. Stay Focused.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarOpen && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 mx-auto">
              <GraduationCap size={18} className="text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>

        <Separator className="bg-white/5" />

        <nav className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <div key={item.id}>
                {item.section && sidebarOpen && (
                  <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                    {item.section}
                  </p>
                )}
                {item.section && !sidebarOpen && <div className="my-2 mx-3 border-t border-white/5" />}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCurrentView(item.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                        !sidebarOpen && 'justify-center px-0'
                      )}
                    >
                      <span className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all',
                        isActive && 'bg-purple-500/30'
                      )}>
                        {item.icon}
                      </span>
                      <AnimatePresence mode="wait">
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right" className="bg-gray-900 text-white border-white/10">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            );
          })}
        </nav>

        <Separator className="bg-white/5" />

        <div className="p-3">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20 p-3"
              >
                <div className="flex items-center gap-3">
  <img
    src={user?.photoURL || "/avatar.png"}
    alt="Profile"
    className="h-10 w-10 rounded-full border border-white/20"
  />

  <div className="min-w-0">
    <p className="truncate text-sm font-semibold text-white">
      {user?.displayName || "Guest"}
    </p>

    <p className="truncate text-xs text-white/50">
      {user?.email || "Not signed in"}
    </p>
  </div>
</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
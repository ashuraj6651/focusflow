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
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems: { id: ViewType; label: string; icon: React.ReactNode; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
  { id: 'focus', label: 'Focus Mode', icon: <Crosshair size={18} strokeWidth={1.8} /> },
  { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={18} strokeWidth={1.8} /> },
  { id: 'planner', label: 'Planner', icon: <CalendarDays size={18} strokeWidth={1.8} />, section: 'Organize' },
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={18} strokeWidth={1.8} /> },
  { id: 'subjects', label: 'Subjects', icon: <BookOpen size={18} strokeWidth={1.8} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={18} strokeWidth={1.8} /> },
  { id: 'goals', label: 'Goals', icon: <Target size={18} strokeWidth={1.8} />, section: 'Track' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} strokeWidth={1.8} /> },
  { id: 'habits', label: 'Habits', icon: <Repeat size={18} strokeWidth={1.8} /> },
  { id: 'exams', label: 'Exams', icon: <GraduationCap size={18} strokeWidth={1.8} />, section: 'More' },
  { id: 'motivation', label: 'Motivation', icon: <Sparkles size={18} strokeWidth={1.8} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} strokeWidth={1.8} /> },
];

export function AppSidebar() {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, settings } = useAppStore();
  const { user } = useAuth();
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 72 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.05] bg-[#0c0c0f]/80 backdrop-blur-2xl"
      >
        {/* Logo */}
        <div className="flex h-[72px] items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 shadow-lg shadow-purple-600/25">
                  <GraduationCap size={18} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight">FocusFlow</h1>
                  <p className="text-[10px] text-white/30 font-medium">Study Smart. Stay Focused.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarOpen && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 shadow-lg shadow-purple-600/25 mx-auto">
              <GraduationCap size={18} className="text-white" strokeWidth={2} />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-white/30 hover:text-white/60 hover:bg-white/[0.06] rounded-lg"
          >
            {sidebarOpen ? <PanelLeftClose size={16} strokeWidth={1.8} /> : <PanelLeftOpen size={16} strokeWidth={1.8} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <div key={item.id}>
                  {item.section && sidebarOpen && (
                    <p className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
                      {item.section}
                    </p>
                  )}
                  {item.section && !sidebarOpen && <div className="my-3 mx-4 border-t border-white/[0.04]" />}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setCurrentView(item.id)}
                        className={cn(
                          'relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                          isActive
                            ? 'text-white bg-white/[0.08]'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]',
                          !sidebarOpen && 'justify-center px-0'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/15 to-violet-600/5 border border-purple-500/20"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                        <span className={cn(
                          'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                          isActive && 'text-purple-400',
                        )}>
                          {item.icon}
                        </span>
                        <AnimatePresence mode="wait">
                          {sidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -8 }}
                              transition={{ duration: 0.2 }}
                              className="relative z-10 truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </TooltipTrigger>
                    {!sidebarOpen && (
                      <TooltipContent side="right" className="bg-[#1a1a1f] text-white border-white/[0.08] rounded-xl px-3 py-2 text-xs shadow-xl">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Profile Card / Footer */}
        <div className="p-3">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 rounded-xl">
                      <AvatarImage
                        src={user?.photoURL ?? ""}
                        src={user?.photoURL ?? ""}
                        alt={user?.displayName ?? "User"}
                        />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-violet-500 text-white text-xs font-bold rounded-xl">
  {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0c0c0f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
  {user?.displayName ?? "Guest"}
</p>
<p className="text-[11px] text-white/30 truncate">
  {user?.email}
</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.12] px-3 py-2">
                  <Cloud size={12} className="text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-emerald-400">FocusFlow</p>
                    <p className="text-[9px] text-emerald-400/50">Cloud Sync Enabled</p>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </motion.div>
            )}
            {!sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt="Ashu" />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-violet-500 text-white text-[10px] font-bold rounded-lg">
                      AR
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-[#0c0c0f]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { type ViewType } from '@/lib/types';
import {
  LayoutDashboard, Crosshair, Timer, CalendarDays, CheckSquare,
  BookOpen, StickyNote, Target, BarChart3, Repeat, GraduationCap,
  Sparkles, Settings,
} from 'lucide-react';

const commands: { id: ViewType; label: string; icon: React.ReactNode; keywords: string[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, keywords: ['home', 'main'] },
  { id: 'focus', label: 'Focus Mode', icon: <Crosshair size={16} />, keywords: ['distraction', 'fullscreen'] },
  { id: 'pomodoro', label: 'Pomodoro Timer', icon: <Timer size={16} />, keywords: ['timer', 'countdown', 'study timer'] },
  { id: 'planner', label: 'Study Planner', icon: <CalendarDays size={16} />, keywords: ['plan', 'schedule', 'tasks'] },
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={16} />, keywords: ['todo', 'check', 'list'] },
  { id: 'subjects', label: 'Subject Manager', icon: <BookOpen size={16} />, keywords: ['course', 'class'] },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={16} />, keywords: ['write', 'markdown'] },
  { id: 'goals', label: 'Goals', icon: <Target size={16} />, keywords: ['target', 'objective'] },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} />, keywords: ['stats', 'charts', 'statistics'] },
  { id: 'habits', label: 'Habit Tracker', icon: <Repeat size={16} />, keywords: ['routine', 'daily'] },
  { id: 'exams', label: 'Exam Countdown', icon: <GraduationCap size={16} />, keywords: ['test', 'exam', 'countdown'] },
  { id: 'motivation', label: 'Motivation', icon: <Sparkles size={16} />, keywords: ['quotes', 'inspire'] },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} />, keywords: ['preferences', 'config'] },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setCurrentView } = useAppStore();

  const runCommand = useCallback((command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search everything..." className="text-white" />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              value={cmd.label + ' ' + cmd.keywords.join(' ')}
              onSelect={() => runCommand(() => setCurrentView(cmd.id))}
              className="flex items-center gap-3 text-white/70 hover:text-white"
            >
              {cmd.icon}
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useTheme } from 'next-themes';

export function useKeyboardShortcuts() {
  const { currentView, setCurrentView, setCommandPaletteOpen, commandPaletteOpen } = useAppStore();
  const { isRunning, isPaused, startTimer, pauseTimer, resumeTimer, resetTimer } = usePomodoroStore();
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        if (currentView === 'focus') {
          setCurrentView('dashboard');
          return;
        }
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
      }

      if (isInput) return;

      if (e.key === ' ' && (currentView === 'pomodoro' || currentView === 'focus')) {
        e.preventDefault();
        if (isRunning) {
          if (isPaused) resumeTimer();
          else pauseTimer();
        } else {
          startTimer();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isRunning, isPaused, startTimer, pauseTimer, resumeTimer, setCurrentView, setCommandPaletteOpen, commandPaletteOpen]);
}
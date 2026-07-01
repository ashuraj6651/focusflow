'use client';

import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useAppStore } from '@/stores/appStore';
import { formatTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X } from 'lucide-react';

export function FloatingTimer() {
  const { isRunning, isPaused, timeRemaining, currentSessionType } = usePomodoroStore();
  const { currentView, setCurrentView } = useAppStore();

  if (!isRunning && !isPaused) return null;
  if (currentView === 'focus' || currentView === 'pomodoro') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.8 }}
        className="fixed bottom-20 right-6 z-50"
      >
        <button
          onClick={() => setCurrentView('pomodoro')}
          className="flex items-center gap-2 rounded-2xl bg-purple-600/90 px-4 py-2.5 text-white shadow-[0_2px_20px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all hover:bg-purple-500 hover:shadow-purple-500/50"
        >
          <Timer size={14} className={isPaused ? 'text-yellow-300' : 'animate-pulse'} />
          <span className="text-sm font-mono font-semibold">{formatTime(timeRemaining)}</span>
          <span className="text-[10px] text-white/40 uppercase">
            {currentSessionType}
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
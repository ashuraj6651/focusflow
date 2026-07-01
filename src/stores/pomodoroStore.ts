import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type PomodoroSession, type SessionType, type AppSettings, DEFAULT_SETTINGS } from '@/lib/types';
import { generateId, getToday, playAlarmSound, sendNotification } from '@/lib/utils';

interface PomodoroState {
  sessions: PomodoroSession[];
  todaySessionCount: number;
  isRunning: boolean;
  isPaused: boolean;
  currentSessionType: SessionType;
  timeRemaining: number;
  completedSessionsInCycle: number;
  settings: {
    focusDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLong: number;
    autoStart: boolean;
    autoBreak: boolean;
  };

  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipBreak: () => void;
  nextSession: () => void;
  tick: () => void;
  completeSession: () => void;
  updateTimerSettings: (settings: Partial<PomodoroState['settings']>) => void;
  getTodayFocusMinutes: () => number;
  getWeeklyStats: () => { date: string; minutes: number; sessions: number }[];
}

const loadSettings = (): PomodoroState['settings'] => {
  if (typeof window === 'undefined') {
    return {
      focusDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLong: 4,
      autoStart: false,
      autoBreak: false,
    };
  }
  try {
    const stored = localStorage.getItem('focusflow-app');
    if (stored) {
      const parsed = JSON.parse(stored);
      const s = parsed?.state?.settings as AppSettings | undefined;
      return {
        focusDuration: s?.pomodoroFocus ?? 25,
        breakDuration: s?.pomodoroBreak ?? 5,
        longBreakDuration: s?.pomodoroLongBreak ?? 15,
        sessionsBeforeLong: s?.pomodoroSessionsBeforeLong ?? 4,
        autoStart: s?.autoStartPomodoro ?? false,
        autoBreak: s?.autoStartBreak ?? false,
      };
    }
  } catch { /* ignore */ }
  return {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLong: 4,
    autoStart: false,
    autoBreak: false,
  };
};

let intervalRef: ReturnType<typeof setInterval> | null = null;

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      sessions: [],
      todaySessionCount: 0,
      isRunning: false,
      isPaused: false,
      currentSessionType: 'focus',
      timeRemaining: loadSettings().focusDuration * 60,
      completedSessionsInCycle: 0,
      settings: loadSettings(),

      startTimer: () => {
        if (intervalRef) clearInterval(intervalRef);
        set({ isRunning: true, isPaused: false });
        intervalRef = setInterval(() => {
          const state = get();
          if (state.isRunning && !state.isPaused) {
            state.tick();
          }
        }, 1000);
      },

      pauseTimer: () => set({ isPaused: true }),
      resumeTimer: () => {
        set({ isPaused: false });
      },

      resetTimer: () => {
        if (intervalRef) {
          clearInterval(intervalRef);
          intervalRef = null;
        }
        const { settings, currentSessionType } = get();
        let duration = settings.focusDuration * 60;
        if (currentSessionType === 'break') duration = settings.breakDuration * 60;
        if (currentSessionType === 'long-break') duration = settings.longBreakDuration * 60;
        set({ isRunning: false, isPaused: false, timeRemaining: duration });
      },

      skipBreak: () => {
        const { settings, completedSessionsInCycle } = get();
        const nextType: SessionType =
          completedSessionsInCycle >= settings.sessionsBeforeLong
            ? 'long-break'
            : 'focus';
        const duration =
          nextType === 'long-break'
            ? settings.longBreakDuration * 60
            : settings.focusDuration * 60;
        set({
          currentSessionType: nextType,
          timeRemaining: duration,
          isRunning: false,
          isPaused: false,
        });
        if (intervalRef) {
          clearInterval(intervalRef);
          intervalRef = null;
        }
      },

      nextSession: () => {
        const { settings } = get();
        set({
          currentSessionType: 'focus',
          timeRemaining: settings.focusDuration * 60,
          isRunning: false,
          isPaused: false,
        });
        if (intervalRef) {
          clearInterval(intervalRef);
          intervalRef = null;
        }
      },

      tick: () => {
        const { timeRemaining, currentSessionType, settings, completedSessionsInCycle, sessions } = get();
        if (timeRemaining <= 0) {
          get().completeSession();
          return;
        }
        set({ timeRemaining: timeRemaining - 1 });
      },

      completeSession: () => {
        const {
          currentSessionType,
          settings,
          completedSessionsInCycle,
          sessions,
          isRunning,
        } = get();

        const now = new Date().toISOString();
        const duration =
          currentSessionType === 'focus'
            ? settings.focusDuration
            : currentSessionType === 'break'
            ? settings.breakDuration
            : settings.longBreakDuration;

        const session: PomodoroSession = {
          id: generateId(),
          startTime: now,
          endTime: now,
          duration,
          type: currentSessionType,
          completed: true,
        };

        const isLongBreakCycle = completedSessionsInCycle >= settings.sessionsBeforeLong - 1 && currentSessionType === 'focus';
        const newCompletedInCycle = currentSessionType === 'focus'
          ? (isLongBreakCycle ? 0 : completedSessionsInCycle + 1)
          : completedSessionsInCycle;

        let nextType: SessionType;
        if (currentSessionType === 'focus') {
          nextType = isLongBreakCycle ? 'long-break' : 'break';
        } else {
          nextType = 'focus';
        }

        const nextDuration =
          nextType === 'focus'
            ? settings.focusDuration * 60
            : nextType === 'break'
            ? settings.breakDuration * 60
            : settings.longBreakDuration * 60;

        const todayStr = getToday();
        const todaySessions = [...sessions, session].filter(
          (s) => s.startTime.startsWith(todayStr) && s.type === 'focus'
        );

        if (currentSessionType === 'focus') {
          playAlarmSound();
          sendNotification(
            'Focus Session Complete!',
            `Great work! Time for a ${nextType === 'long-break' ? 'long' : ''} break.`
          );
        } else {
          playAlarmSound();
          sendNotification('Break Over!', 'Time to get back to focusing.');
        }

        const shouldAutoStart =
          currentSessionType === 'focus' ? settings.autoBreak : settings.autoStart;

        set({
          sessions: [...sessions, session],
          todaySessionCount: todaySessions.length,
          completedSessionsInCycle: newCompletedInCycle,
          currentSessionType: nextType,
          timeRemaining: nextDuration,
          isRunning: shouldAutoStart && isRunning,
          isPaused: false,
        });

        if (!shouldAutoStart && intervalRef) {
          clearInterval(intervalRef);
          intervalRef = null;
        }
      },

      updateTimerSettings: (partial) =>
        set((s) => ({
          settings: { ...s.settings, ...partial },
          timeRemaining: s.currentSessionType === 'focus'
            ? (partial.focusDuration ?? s.settings.focusDuration) * 60
            : s.currentSessionType === 'break'
            ? (partial.breakDuration ?? s.settings.breakDuration) * 60
            : (partial.longBreakDuration ?? s.settings.longBreakDuration) * 60,
        })),

      getTodayFocusMinutes: () => {
        const { sessions } = get();
        const todayStr = getToday();
        return sessions
          .filter((s) => s.startTime.startsWith(todayStr) && s.type === 'focus' && s.completed)
          .reduce((acc, s) => acc + s.duration, 0);
      },

      getWeeklyStats: () => {
        const { sessions } = get();
        const stats: { date: string; minutes: number; sessions: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const daySessions = sessions.filter(
            (s) => s.startTime.startsWith(dateStr) && s.type === 'focus' && s.completed
          );
          stats.push({
            date: dateStr,
            minutes: daySessions.reduce((acc, s) => acc + s.duration, 0),
            sessions: daySessions.length,
          });
        }
        return stats;
      },
    }),
    {
      name: 'focusflow-pomodoro',
      partialize: (state) => ({
        sessions: state.sessions,
      }),
    }
  )
);
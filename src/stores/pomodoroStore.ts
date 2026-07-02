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
  endAt: number | null;
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
  getTodaySessionCount: () => number;
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
let visibilityListenerAttached = false;

// When the tab/app goes to the background, browsers throttle or fully
// suspend setInterval/setTimeout callbacks to save battery/CPU. That's what
// causes the countdown to "fall behind" real time. This listener forces an
// immediate resync (based on the real clock via endAt) the moment the page
// becomes visible again, instead of waiting for the next throttled interval
// tick to fire.
function registerVisibilitySync(
  get: () => PomodoroState,
  set: (partial: Partial<PomodoroState>) => void
) {
  if (visibilityListenerAttached || typeof document === 'undefined') return;
  visibilityListenerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const state = get();
      if (state.isRunning && !state.isPaused) {
        state.tick();
      }
    }
  });
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      sessions: [],
      todaySessionCount: 0,
      isRunning: false,
      isPaused: false,
      currentSessionType: 'focus',
      timeRemaining: loadSettings().focusDuration * 60,
      endAt: null,
      completedSessionsInCycle: 0,
      settings: loadSettings(),

      startTimer: () => {
        if (intervalRef) clearInterval(intervalRef);
        const { timeRemaining } = get();
        set({ isRunning: true, isPaused: false, endAt: Date.now() + timeRemaining * 1000 });
        intervalRef = setInterval(() => {
          const state = get();
          if (state.isRunning && !state.isPaused) {
            state.tick();
          }
        }, 1000);
        registerVisibilitySync(get, set);
      },

      pauseTimer: () => {
        const { endAt } = get();
        // Freeze the remaining time based on the real elapsed wall-clock time,
        // not the tick count, so background throttling can't skew it.
        const remaining = endAt != null ? Math.max(0, Math.round((endAt - Date.now()) / 1000)) : get().timeRemaining;
        set({ isPaused: true, timeRemaining: remaining, endAt: null });
      },
      resumeTimer: () => {
        const { timeRemaining } = get();
        set({ isPaused: false, endAt: Date.now() + timeRemaining * 1000 });
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
        set({ isRunning: false, isPaused: false, timeRemaining: duration, endAt: null });
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
          endAt: null,
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
          endAt: null,
        });
        if (intervalRef) {
          clearInterval(intervalRef);
          intervalRef = null;
        }
      },

      tick: () => {
        const { endAt, isRunning, isPaused } = get();
        if (!isRunning || isPaused) return;
        // Derive remaining time from the real clock instead of decrementing
        // by 1 each callback — setInterval gets throttled/paused by the
        // browser while the tab/app is backgrounded, so a naive -1 per tick
        // falls behind real elapsed time. Recomputing from endAt catches up
        // instantly as soon as the interval (or a visibility change) fires.
        if (endAt == null) return;
        const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        if (remaining <= 0) {
          get().completeSession();
          return;
        }
        set({ timeRemaining: remaining });
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
          endAt: shouldAutoStart ? Date.now() + nextDuration * 1000 : null,
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

      getTodaySessionCount: () => {
        const { sessions } = get();
        const todayStr = getToday();
        return sessions.filter(
          (s) => s.startTime.startsWith(todayStr) && s.type === 'focus' && s.completed
        ).length;
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
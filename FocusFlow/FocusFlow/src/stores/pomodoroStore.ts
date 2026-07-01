import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type PomodoroSession, type SessionType, type AppSettings, DEFAULT_SETTINGS } from '@/lib/types';
import { generateId, getToday, playAlarmSound, sendNotification } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Settings loader – reads from the app-store localStorage key
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Duration helpers
// ---------------------------------------------------------------------------
function getDurationMs(type: SessionType, settings: PomodoroState['settings']): number {
  if (type === 'break') return settings.breakDuration * 60 * 1000;
  if (type === 'long-break') return settings.longBreakDuration * 60 * 1000;
  return settings.focusDuration * 60 * 1000;
}

function getDurationSeconds(type: SessionType, settings: PomodoroState['settings']): number {
  if (type === 'break') return settings.breakDuration * 60;
  if (type === 'long-break') return settings.longBreakDuration * 60;
  return settings.focusDuration * 60;
}

// ---------------------------------------------------------------------------
// Module-level interval reference – only one interval ever active
// ---------------------------------------------------------------------------
let intervalRef: ReturnType<typeof setInterval> | null = null;

function stopInterval() {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------
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

  // Date.now()-based timer fields (persisted)
  endTime: number | null;
  sessionDuration: number;
  pausedDuration: number;
  pauseStartTime: number | null;

  // Methods
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipBreak: () => void;
  skipFocus: () => void;
  nextSession: () => void;
  tick: () => void;
  completeSession: () => void;
  updateTimerSettings: (settings: Partial<PomodoroState['settings']>) => void;
  getTodayFocusMinutes: () => number;
  getWeeklyStats: () => { date: string; minutes: number; sessions: number }[];
  getTimeRemaining: () => number;
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------
const initialSettings = loadSettings();

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      sessions: [],
      todaySessionCount: 0,
      isRunning: false,
      isPaused: false,
      currentSessionType: 'focus' as SessionType,
      timeRemaining: initialSettings.focusDuration * 60,
      completedSessionsInCycle: 0,
      settings: initialSettings,

      // Date.now()-based timer fields
      endTime: null,
      sessionDuration: initialSettings.focusDuration * 60 * 1000,
      pausedDuration: 0,
      pauseStartTime: null,

      // -----------------------------------------------------------------
      // Compute time remaining from wall-clock
      // -----------------------------------------------------------------
      getTimeRemaining: () => {
        const { endTime, isPaused, pauseStartTime, isRunning, currentSessionType, settings } = get();

        if (!isRunning && !isPaused) {
          return getDurationSeconds(currentSessionType, settings);
        }

        if (isPaused && endTime !== null && pauseStartTime !== null) {
          return Math.max(0, Math.ceil((endTime - pauseStartTime) / 1000));
        }

        if (endTime !== null) {
          return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        }

        return getDurationSeconds(currentSessionType, settings);
      },

      // -----------------------------------------------------------------
      // startTimer
      // -----------------------------------------------------------------
      startTimer: () => {
        const { settings, currentSessionType, pausedDuration, endTime, isPaused, pauseStartTime } = get();
        stopInterval();

        if (isPaused && endTime !== null && pauseStartTime !== null) {
          // Resuming — adjust endTime by pause duration
          const pauseElapsed = Date.now() - pauseStartTime;
          const newEndTime = endTime + pauseElapsed;
          set({
            isRunning: true,
            isPaused: false,
            endTime: newEndTime,
            pausedDuration: pausedDuration + pauseElapsed,
            pauseStartTime: null,
          });
        } else {
          // Fresh start
          const duration = getDurationMs(currentSessionType, settings);
          const newEndTime = Date.now() + duration;
          set({
            isRunning: true,
            isPaused: false,
            endTime: newEndTime,
            sessionDuration: duration,
            pausedDuration: 0,
            pauseStartTime: null,
          });
        }

        intervalRef = setInterval(() => {
          get().tick();
        }, 200);
      },

      // -----------------------------------------------------------------
      // pauseTimer
      // -----------------------------------------------------------------
      pauseTimer: () => {
        stopInterval();
        set({ isPaused: true, pauseStartTime: Date.now() });
      },

      // -----------------------------------------------------------------
      // resumeTimer (alias – calls startTimer which handles pause resume)
      // -----------------------------------------------------------------
      resumeTimer: () => {
        get().startTimer();
      },

      // -----------------------------------------------------------------
      // resetTimer
      // -----------------------------------------------------------------
      resetTimer: () => {
        stopInterval();
        const { settings, currentSessionType } = get();
        const duration = getDurationSeconds(currentSessionType, settings);
        set({
          isRunning: false,
          isPaused: false,
          endTime: null,
          sessionDuration: getDurationMs(currentSessionType, settings),
          pausedDuration: 0,
          pauseStartTime: null,
          timeRemaining: duration,
        });
      },

      // -----------------------------------------------------------------
      // skipBreak – jump to next focus (or long-break if due)
      // -----------------------------------------------------------------
      skipBreak: () => {
        stopInterval();
        const { settings, completedSessionsInCycle } = get();
        const nextType: SessionType =
          completedSessionsInCycle >= settings.sessionsBeforeLong
            ? 'long-break'
            : 'focus';
        set({
          currentSessionType: nextType,
          timeRemaining: getDurationSeconds(nextType, settings),
          isRunning: false,
          isPaused: false,
          endTime: null,
          sessionDuration: getDurationMs(nextType, settings),
          pausedDuration: 0,
          pauseStartTime: null,
        });
      },

      // -----------------------------------------------------------------
      // skipFocus – skip current focus, go to break
      // -----------------------------------------------------------------
      skipFocus: () => {
        stopInterval();
        const { settings, completedSessionsInCycle } = get();
        const nextType: SessionType =
          completedSessionsInCycle + 1 >= settings.sessionsBeforeLong
            ? 'long-break'
            : 'break';
        set({
          currentSessionType: nextType,
          timeRemaining: getDurationSeconds(nextType, settings),
          isRunning: false,
          isPaused: false,
          endTime: null,
          sessionDuration: getDurationMs(nextType, settings),
          pausedDuration: 0,
          pauseStartTime: null,
        });
      },

      // -----------------------------------------------------------------
      // nextSession – reset to a fresh focus session
      // -----------------------------------------------------------------
      nextSession: () => {
        stopInterval();
        const { settings } = get();
        set({
          currentSessionType: 'focus',
          timeRemaining: settings.focusDuration * 60,
          isRunning: false,
          isPaused: false,
          endTime: null,
          sessionDuration: settings.focusDuration * 60 * 1000,
          pausedDuration: 0,
          pauseStartTime: null,
        });
      },

      // -----------------------------------------------------------------
      // tick – called every 200ms by interval
      // -----------------------------------------------------------------
      tick: () => {
        const { endTime, isPaused, isRunning } = get();
        if (!isRunning || isPaused || endTime === null) {
          set({ timeRemaining: get().getTimeRemaining() });
          return;
        }

        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

        if (now >= endTime) {
          set({ timeRemaining: 0 });
          get().completeSession();
        } else {
          set({ timeRemaining: remaining });
        }
      },

      // -----------------------------------------------------------------
      // completeSession
      // -----------------------------------------------------------------
      completeSession: () => {
        const {
          currentSessionType,
          settings,
          completedSessionsInCycle,
          sessions,
          isRunning,
        } = get();

        stopInterval();

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

        const nextDurationMs = getDurationMs(nextType, settings);
        const nextDurationSec = Math.round(nextDurationMs / 1000);
        const shouldAutoStart =
          currentSessionType === 'focus' ? settings.autoBreak : settings.autoStart;

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

        const willAutoStart = shouldAutoStart && isRunning;

        if (willAutoStart) {
          const nextEndTime = Date.now() + nextDurationMs;
          set({
            sessions: [...sessions, session],
            todaySessionCount: todaySessions.length,
            completedSessionsInCycle: newCompletedInCycle,
            currentSessionType: nextType,
            timeRemaining: nextDurationSec,
            isRunning: true,
            isPaused: false,
            endTime: nextEndTime,
            sessionDuration: nextDurationMs,
            pausedDuration: 0,
            pauseStartTime: null,
          });

          intervalRef = setInterval(() => {
            get().tick();
          }, 200);
        } else {
          set({
            sessions: [...sessions, session],
            todaySessionCount: todaySessions.length,
            completedSessionsInCycle: newCompletedInCycle,
            currentSessionType: nextType,
            timeRemaining: nextDurationSec,
            isRunning: false,
            isPaused: false,
            endTime: null,
            sessionDuration: nextDurationMs,
            pausedDuration: 0,
            pauseStartTime: null,
          });
        }
      },

      // -----------------------------------------------------------------
      // updateTimerSettings
      // -----------------------------------------------------------------
      updateTimerSettings: (partial) =>
        set((s) => {
          const newSettings = { ...s.settings, ...partial };
          const newDurationSec = getDurationSeconds(s.currentSessionType, newSettings);
          return {
            settings: newSettings,
            timeRemaining: s.isRunning ? s.timeRemaining : newDurationSec,
            sessionDuration: getDurationMs(s.currentSessionType, newSettings),
          };
        }),

      // -----------------------------------------------------------------
      // getTodayFocusMinutes
      // -----------------------------------------------------------------
      getTodayFocusMinutes: () => {
        const { sessions } = get();
        const todayStr = getToday();
        return sessions
          .filter((s) => s.startTime.startsWith(todayStr) && s.type === 'focus' && s.completed)
          .reduce((acc, s) => acc + s.duration, 0);
      },

      // -----------------------------------------------------------------
      // getWeeklyStats
      // -----------------------------------------------------------------
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
        todaySessionCount: state.todaySessionCount,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        currentSessionType: state.currentSessionType,
        completedSessionsInCycle: state.completedSessionsInCycle,
        endTime: state.endTime,
        sessionDuration: state.sessionDuration,
        pausedDuration: state.pausedDuration,
        pauseStartTime: state.pauseStartTime,
      }),
      onRehydrateStorage: () => {
  return (_state, error) => {
    if (error) return;

    setTimeout(() => {
      const s = usePomodoroStore.getState();

      if (s.isRunning && !s.isPaused && s.endTime !== null) {
        if (Date.now() >= s.endTime) {
          s.completeSession();
        } else {
          stopInterval();

          intervalRef = setInterval(() => {
            usePomodoroStore.getState().tick();
          }, 200);
        }
      } else {
        usePomodoroStore.setState({
          timeRemaining: s.getTimeRemaining(),
        });
      }
    }, 0);
  };
},
    }
  )
);
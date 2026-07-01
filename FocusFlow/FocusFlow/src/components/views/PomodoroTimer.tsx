'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ArrowRight,
  Settings2,
  ChevronUp,
  ChevronDown,
  Clock,
  Flame,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useAppStore } from '@/stores/appStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { formatTime, formatMinutes } from '@/lib/utils';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getSessionLabel(type: string) {
  switch (type) {
    case 'focus': return 'Focus Time';
    case 'break': return 'Short Break';
    case 'long-break': return 'Long Break';
    default: return 'Focus Time';
  }
}

function getSessionColor(type: string) {
  switch (type) {
    case 'focus': return '#7C3AED';
    case 'break': return '#10B981';
    case 'long-break': return '#3B82F6';
    default: return '#7C3AED';
  }
}

export default function PomodoroTimer() {
  const {
    isRunning,
    isPaused,
    currentSessionType,
    timeRemaining,
    completedSessionsInCycle,
    settings,
    todaySessionCount,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipBreak,
    nextSession,
    updateTimerSettings,
    getTodayFocusMinutes,
    getWeeklyStats,
  } = usePomodoroStore();

  const { settings: appSettings } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });

  // Calculate timer progress
  const totalTime = useMemo(() => {
    switch (currentSessionType) {
      case 'focus': return settings.focusDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'long-break': return settings.longBreakDuration * 60;
      default: return settings.focusDuration * 60;
    }
  }, [currentSessionType, settings]);

  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  // SVG circle calculations
  const size = 300;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dashOffset = circumference - (progress / 100) * circumference;

  // Gradient color interpolation (purple #7C3AED -> pink #EC4899)
  const strokeColor = progress < 50
    ? `rgb(${Math.round(124 + (236 - 124) * (progress / 50))}, ${Math.round(58 + (72 - 58) * (progress / 50))}, ${Math.round(237 + (153 - 237) * (progress / 50))})`
    : `rgb(${Math.round(236 + (236 - 236) * ((progress - 50) / 50))}, ${Math.round(72 + (72 - 72) * ((progress - 50) / 50))}, ${Math.round(153 + (153 - 153) * ((progress - 50) / 50))})`;

  // Stats
  const todayFocusMinutes = getTodayFocusMinutes();
  const weeklyStats = getWeeklyStats();
  const chartData = weeklyStats.map((stat) => {
    const dayIndex = new Date(stat.date + 'T00:00:00').getDay();
    return {
      name: DAY_LABELS[dayIndex],
      minutes: stat.minutes,
      sessions: stat.sessions,
    };
  });

  const handleApplySettings = () => {
    updateTimerSettings(localSettings);
    setSettingsOpen(false);
  };

  const handleResetLocal = () => {
    setLocalSettings({ ...settings });
  };

  const sessionTypeColor = getSessionColor(currentSessionType);

  return (
    <div className="space-y-6 pb-8">
      {/* Timer Section */}
      <div className="flex flex-col items-center">
        <motion.div
          className="relative"
          animate={isRunning && !isPaused ? {
            boxShadow: [
              `0 0 20px ${sessionTypeColor}40`,
              `0 0 60px ${sessionTypeColor}60`,
              `0 0 20px ${sessionTypeColor}40`,
            ],
          } : {}}
          transition={isRunning && !isPaused ? {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        >
          <svg width={size} height={size} className="-rotate-90">
            <defs>
              <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#timer-gradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              filter="url(#glow)"
              initial={false}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={timeRemaining}
              initial={{ scale: 1.05, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="text-6xl sm:text-7xl font-bold text-white tracking-tight tabular-nums"
            >
              {formatTime(timeRemaining)}
            </motion.span>
            <span
              className="mt-2 text-sm font-medium uppercase tracking-widest"
              style={{ color: sessionTypeColor }}
            >
              {getSessionLabel(currentSessionType)}
            </span>
            <span className="mt-1 text-xs text-white/40">
              Session {completedSessionsInCycle + 1} of {settings.sessionsBeforeLong}
            </span>
          </div>
        </motion.div>

        {/* Control Buttons */}
        <div className="mt-8 flex items-center gap-3">
          {!isRunning && !isPaused && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={startTimer}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/30 transition-colors hover:bg-purple-500"
              aria-label="Start timer"
            >
              <Play className="h-6 w-6" fill="white" />
            </motion.button>
          )}

          {isRunning && !isPaused && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={pauseTimer}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 transition-colors hover:bg-white/20"
              aria-label="Pause timer"
            >
              <Pause className="h-6 w-6" fill="white" />
            </motion.button>
          )}

          {isRunning && isPaused && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={resumeTimer}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/30 transition-colors hover:bg-purple-500"
              aria-label="Resume timer"
            >
              <Play className="h-6 w-6" fill="white" />
            </motion.button>
          )}

          {(isRunning || isPaused) && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetTimer}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/70 border border-white/10 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
            </motion.button>
          )}

          {(currentSessionType === 'break' || currentSessionType === 'long-break') && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipBreak}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/70 border border-white/10 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Skip break"
            >
              <SkipForward className="h-5 w-5" />
            </motion.button>
          )}

          {currentSessionType === 'focus' && !isRunning && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextSession}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/70 border border-white/10 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Next session"
            >
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <GlassCard className="overflow-hidden !p-0">
        <button
          onClick={() => {
            if (settingsOpen) {
              handleResetLocal();
            } else {
              setLocalSettings({ ...settings });
            }
            setSettingsOpen(!settingsOpen);
          }}
          className="flex w-full items-center justify-between px-6 py-4 text-white/80 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-purple-400" />
            <span className="font-medium">Timer Settings</span>
          </div>
          <motion.div
            animate={{ rotate: settingsOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </button>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 border-t border-white/10 px-6 py-5">
                {/* Focus Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="text-white/70">Focus Duration</label>
                    <span className="text-white font-medium tabular-nums">{localSettings.focusDuration} min</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={120}
                    value={localSettings.focusDuration}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, focusDuration: Number(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-purple-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/40"
                  />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>1 min</span>
                    <span>120 min</span>
                  </div>
                </div>

                {/* Break Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="text-white/70">Break Duration</label>
                    <span className="text-white font-medium tabular-nums">{localSettings.breakDuration} min</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={localSettings.breakDuration}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, breakDuration: Number(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/40"
                  />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>1 min</span>
                    <span>30 min</span>
                  </div>
                </div>

                {/* Long Break Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="text-white/70">Long Break Duration</label>
                    <span className="text-white font-medium tabular-nums">{localSettings.longBreakDuration} min</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={localSettings.longBreakDuration}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, longBreakDuration: Number(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/40"
                  />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>5 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                {/* Sessions before Long Break */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="text-white/70">Sessions before Long Break</label>
                    <span className="text-white font-medium tabular-nums">{localSettings.sessionsBeforeLong}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={1}
                    value={localSettings.sessionsBeforeLong}
                    onChange={(e) => setLocalSettings((s) => ({ ...s, sessionsBeforeLong: Number(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/40"
                  />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>2</span>
                    <span>8</span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Auto-start next session</span>
                    <button
                      onClick={() => setLocalSettings((s) => ({ ...s, autoStart: !s.autoStart }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        localSettings.autoStart ? 'bg-purple-600' : 'bg-white/10'
                      }`}
                      role="switch"
                      aria-checked={localSettings.autoStart}
                    >
                      <motion.div
                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                        animate={{ left: localSettings.autoStart ? 22 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Auto-start breaks</span>
                    <button
                      onClick={() => setLocalSettings((s) => ({ ...s, autoBreak: !s.autoBreak }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        localSettings.autoBreak ? 'bg-purple-600' : 'bg-white/10'
                      }`}
                      role="switch"
                      aria-checked={localSettings.autoBreak}
                    >
                      <motion.div
                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                        animate={{ left: localSettings.autoBreak ? 22 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>

                {/* Apply / Cancel */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleApplySettings}
                    className="flex-1 rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={() => {
                      handleResetLocal();
                      setSettingsOpen(false);
                    }}
                    className="flex-1 rounded-lg bg-white/5 border border-white/10 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Session Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Focus Sessions */}
        <GlassCard hover>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15">
              <Flame className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Today&apos;s Sessions</p>
              <p className="text-2xl font-bold text-white">{todaySessionCount}</p>
            </div>
          </div>
        </GlassCard>

        {/* Today's Focus Time */}
        <GlassCard hover>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/15">
              <Clock className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Focus Time</p>
              <p className="text-2xl font-bold text-white">{formatMinutes(todayFocusMinutes)}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Weekly Stats Chart */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15">
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-white/80">Weekly Statistics</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,15,30,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  fontSize: '13px',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                formatter={(value: number, name: string) => {
                  if (name === 'minutes') return [`${value} min`, 'Focus Time'];
                  return [value, name];
                }}
              />
              <Bar
                dataKey="minutes"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
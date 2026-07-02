'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Timer,
  CheckCircle2,
  Flame,
  Target,
  Focus,
  CalendarClock,
  ListChecks,
  BarChart3,
  StickyNote,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useTaskStore } from '@/stores/taskStore';
import { useChecklistStore } from '@/stores/checklistStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { getGreetingTime, formatMinutes, getStreak, getToday } from '@/lib/utils';
import { GREETING_MESSAGES } from '@/lib/constants';
import type { ViewType } from '@/lib/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

const quickActions: { icon: React.ReactNode; label: string; description: string; view: ViewType; gradient: string }[] = [
  { icon: <Focus className="h-5 w-5" />, label: 'Start Focus', description: 'Begin a study session', view: 'focus', gradient: 'from-purple-600/20 to-violet-600/5' },
  { icon: <CalendarClock className="h-5 w-5" />, label: 'Planner', description: 'Plan your schedule', view: 'planner', gradient: 'from-blue-600/20 to-cyan-600/5' },
  { icon: <ListChecks className="h-5 w-5" />, label: 'Checklist', description: 'Track daily tasks', view: 'checklist', gradient: 'from-emerald-600/20 to-green-600/5' },
  { icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', description: 'View study insights', view: 'analytics', gradient: 'from-amber-600/20 to-orange-600/5' },
  { icon: <StickyNote className="h-5 w-5" />, label: 'Notes', description: 'Quick study notes', view: 'notes', gradient: 'from-pink-600/20 to-rose-600/5' },
];

export function Dashboard() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const getTodayFocusMinutes = usePomodoroStore((s) => s.getTodayFocusMinutes);
  const todaySessionCount = usePomodoroStore((s) => s.todaySessionCount);
  const sessions = usePomodoroStore((s) => s.sessions);
  const getTodayCompletedCount = useTaskStore((s) => s.getTodayCompletedCount);
  const getCompletionPercentage = useChecklistStore((s) => s.getCompletionPercentage);
  const { user } = useAuth();

  const [greeting, setGreeting] = useState('Welcome Back');

  useEffect(() => {
    const base = GREETING_MESSAGES[getGreetingTime()] ?? 'Welcome Back';
    const firstName =
      user?.displayName?.trim().split(' ')[0] ||
      user?.email?.split('@')[0] ||
      '';
    setGreeting(firstName ? `${base}, ${firstName}` : base);
  }, [user?.displayName, user?.email]);

  const focusMinutes = getTodayFocusMinutes();
  const tasksCompleted = getTodayCompletedCount();
  const checklistCompletion = getCompletionPercentage();

  const sessionDates = useMemo(() => {
    const todayStr = getToday();
    return sessions
      .filter((s) => s.type === 'focus' && s.completed && s.startTime.startsWith(todayStr))
      .map((s) => s.startTime.split('T')[0]);
  }, [sessions]);

  const streak = useMemo(() => {
    const todayStr = getToday();
    const allFocusDates = sessions
      .filter((s) => s.type === 'focus' && s.completed)
      .map((s) => s.startTime.split('T')[0]);
    const uniqueDates = [...new Set(allFocusDates)];
    return getStreak(uniqueDates);
  }, [sessions]);

  const overallProgress = useMemo(() => {
    const focusScore = Math.min(focusMinutes / 120, 1) * 25;
    const taskScore = Math.min(tasksCompleted / 5, 1) * 25;
    const pomodoroScore = Math.min(todaySessionCount / 4, 1) * 25;
    const checklistScore = (checklistCompletion / 100) * 25;
    return Math.round(focusScore + taskScore + pomodoroScore + checklistScore);
  }, [focusMinutes, tasksCompleted, todaySessionCount, checklistCompletion]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 md:p-8 lg:p-10">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {greeting} <span className="inline-block">👋</span>
        </h1>
        <p className="text-base text-white/40">
          Ready for another productive study session?
        </p>
      </motion.div>

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl p-6 md:p-8 md:flex-row md:items-center md:gap-10"
      >
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-10">
          <ProgressRing progress={overallProgress} size={180} strokeWidth={12}>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold tabular-nums text-white">{overallProgress}%</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/35">Overall</span>
            </div>
          </ProgressRing>
          <div className="mt-5 text-center md:mt-0 md:text-left md:flex-1">
            <h2 className="text-lg font-semibold text-white">Today&apos;s Progress</h2>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/35">
              Keep pushing! Your daily goal is 2 hours of focused study, 5 tasks, 4 pomodoro sessions, and a complete checklist.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <div className="flex items-center gap-2 rounded-full bg-purple-500/[0.08] border border-purple-500/[0.12] px-3.5 py-2 text-xs font-medium text-purple-400">
                <Timer className="h-3.5 w-3.5" />
                <span>{formatMinutes(focusMinutes)} / 2h</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/[0.08] border border-emerald-500/[0.12] px-3.5 py-2 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{tasksCompleted} / 5 tasks</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-amber-500/[0.08] border border-amber-500/[0.12] px-3.5 py-2 text-xs font-medium text-amber-400">
                <Target className="h-3.5 w-3.5" />
                <span>{todaySessionCount} / 4 sessions</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <GlassCard className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/35 uppercase tracking-wider">Focus Time</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-white">{formatMinutes(focusMinutes)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/20 to-violet-600/10">
                <Timer className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/35 uppercase tracking-wider">Tasks Done</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-white">{tasksCompleted}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/20 to-green-600/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 to-amber-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/35 uppercase tracking-wider">Streak</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-white">{streak}<span className="text-base font-medium text-white/30 ml-1">{streak !== 1 ? 'days' : 'day'}</span></p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600/20 to-amber-600/10">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-rose-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/35 uppercase tracking-wider">Sessions</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-white">{todaySessionCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-600/20 to-rose-600/10">
                <Target className="h-5 w-5 text-pink-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <Sparkles size={14} className="text-white/25" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-white/25">
            Quick Actions
          </h3>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {quickActions.map((action) => (
            <motion.div key={action.view} variants={itemVariants}>
              <GlassCard
                hover
                onClick={() => setCurrentView(action.view)}
                className="group relative overflow-hidden border-white/[0.06]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 flex flex-col items-center gap-3.5 text-center py-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-white/50 group-hover:bg-white/[0.1] group-hover:text-white transition-all duration-300">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">{action.label}</p>
                    <p className="mt-0.5 text-[11px] text-white/30">{action.description}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
'use client';
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useTaskStore } from '@/stores/taskStore';
import { useChecklistStore } from '@/stores/checklistStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { getGreetingTime, formatMinutes, getStreak, getToday } from '@/lib/utils';
import { GREETINGS } from '@/lib/constants';
import type { ViewType } from '@/lib/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const quickActions: { icon: React.ReactNode; label: string; description: string; view: ViewType }[] = [
  { icon: <Focus className="h-6 w-6" />, label: 'Start Focus', description: 'Begin a study session', view: 'focus' },
  { icon: <CalendarClock className="h-6 w-6" />, label: 'Planner', description: 'Plan your study schedule', view: 'planner' },
  { icon: <ListChecks className="h-6 w-6" />, label: 'Checklist', description: 'Track daily tasks', view: 'checklist' },
  { icon: <BarChart3 className="h-6 w-6" />, label: 'Analytics', description: 'View study insights', view: 'analytics' },
  { icon: <StickyNote className="h-6 w-6" />, label: 'Notes', description: 'Quick study notes', view: 'notes' },
];

export function Dashboard() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const getTodayFocusMinutes = usePomodoroStore((s) => s.getTodayFocusMinutes);
  const todaySessionCount = usePomodoroStore((s) => s.todaySessionCount);
  const sessions = usePomodoroStore((s) => s.sessions);
  const getTodayCompletedCount = useTaskStore((s) => s.getTodayCompletedCount);
  const getCompletionPercentage = useChecklistStore((s) => s.getCompletionPercentage);
  
  const { user } = useAuth();
  const greeting = GREETINGS[getGreetingTime()] ?? "Welcome Back";
  const firstName =
  user?.displayName?.split(" ")[0] ?? "Student";
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
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      
        <p className="mt-2 text-white/50">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </motion.div>
      <h1 className="text-3xl font-bold text-white md:text-4xl">
  {greeting} {firstName} <span className="inline-block">👋</span>
</h1>
      
      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:flex-row md:items-center md:gap-10"
      >
        <ProgressRing progress={overallProgress} size={180} strokeWidth={14}>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-white">{overallProgress}%</span>
            <span className="mt-1 text-xs text-white/50">Overall</span>
          </div>
        </ProgressRing>
        <div className="mt-4 text-center md:mt-0 md:text-left">
          <h2 className="text-xl font-semibold text-white">Today&apos;s Progress</h2>
          <p className="mt-1 max-w-sm text-sm text-white/50">
            Keep pushing! Your daily goal is 2 hours of focused study, 5 tasks, 4 pomodoro sessions, and a complete checklist.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1.5 text-xs text-purple-400">
              <Timer className="h-3 w-3" />
              <span>{formatMinutes(focusMinutes)} / 2h</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-pink-500/10 px-3 py-1.5 text-xs text-pink-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>{tasksCompleted} / 5 tasks</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              <Target className="h-3 w-3" />
              <span>{todaySessionCount} / 4 sessions</span>
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
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Today&apos;s Focus</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatMinutes(focusMinutes)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                <Timer className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Tasks Done</p>
                <p className="mt-1 text-2xl font-bold text-white">{tasksCompleted}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Current Streak</p>
                <p className="mt-1 text-2xl font-bold text-white">{streak} day{streak !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Pomodoro Sessions</p>
                <p className="mt-1 text-2xl font-bold text-white">{todaySessionCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20">
                <Target className="h-5 w-5 text-pink-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
          Quick Actions
        </h3>
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
                className="group relative overflow-hidden transition-colors duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 transition-all duration-300 group-hover:from-purple-600/20 group-hover:to-purple-500/10" />
                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 transition-colors duration-300 group-hover:bg-purple-500/30">
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="mt-0.5 text-xs text-white/50">{action.description}</p>
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
'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Clock, Target, Flame, TrendingUp, BarChart3, PieChartIcon, CalendarDays } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { getToday, getDaysAgo, getStreak, formatMinutes, getCompletionRate } from '@/lib/utils';

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = 'rgba(124, 58, 237, 0.3)';
const GREEN = '#10B981';
const YELLOW = '#F59E0B';
const RED = '#EF4444';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/80 px-3 py-2 text-sm backdrop-blur-xl">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || PURPLE }} className="font-medium">
          {p.name}: {p.name === 'Minutes' ? formatMinutes(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { sessions, getWeeklyStats } = usePomodoroStore();
  const { tasks } = useTaskStore();
  const { habits } = useHabitStore();

  const weeklyStats = getWeeklyStats();

  // Stats calculations
  const totalFocusMinutes = useMemo(
    () => sessions.filter((s) => s.type === 'focus' && s.completed).reduce((a, s) => a + s.duration, 0),
    [sessions]
  );
  const totalSessions = useMemo(
    () => sessions.filter((s) => s.type === 'focus' && s.completed).length,
    [sessions]
  );

  // Focus Score: avg daily focus minutes over last 7 days / 120 * 100, capped at 100
  const focusScore = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => getDaysAgo(6 - i));
    let totalDaysWithData = 0;
    let totalMinutes = 0;
    last7Days.forEach((day) => {
      const daySessions = sessions.filter(
        (s) => s.startTime.startsWith(day) && s.type === 'focus' && s.completed
      );
      const mins = daySessions.reduce((a, s) => a + s.duration, 0);
      if (mins > 0) {
        totalMinutes += mins;
        totalDaysWithData++;
      }
    });
    if (totalDaysWithData === 0) return 0;
    const avgMinutes = totalMinutes / 7;
    return Math.min(Math.round((avgMinutes / 120) * 100), 100);
  }, [sessions]);

  // Productivity Score: completion rate of tasks + sessions / target (4 per day for 7 days = 28)
  const productivityScore = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalTasks = tasks.length;
    const taskRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const weekTarget = 28;
    const sessionRate = Math.min(totalSessions / weekTarget, 1);
    return Math.round((taskRate * 0.5 + sessionRate * 0.5) * 100);
  }, [tasks, totalSessions]);

  // Streaks
  const focusDates = useMemo(
    () => [
      ...new Set(
        sessions
          .filter((s) => s.type === 'focus' && s.completed)
          .map((s) => s.startTime.split('T')[0])
      ),
    ].sort(),
    [sessions]
  );

  const currentStreak = getStreak(focusDates);

  const longestStreak = useMemo(() => {
    if (focusDates.length === 0) return 0;
    let max = 1;
    let curr = 1;
    for (let i = 1; i < focusDates.length; i++) {
      const diff =
        (new Date(focusDates[i]).getTime() - new Date(focusDates[i - 1]).getTime()) /
        (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        curr++;
        max = Math.max(max, curr);
      } else {
        curr = 1;
      }
    }
    return max;
  }, [focusDates]);

  // Completion rate
  const completionRate = getCompletionRate(
    tasks.filter((t) => t.completed).length,
    tasks.length
  );

  // Weekly hours for BarChart
  const weeklyHoursData = weeklyStats.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    hours: Math.round((d.minutes / 60) * 10) / 10,
  }));

  // Monthly data (aggregate by week)
  const monthlyData = useMemo(() => {
    const weeks: { label: string; minutes: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      let weekMinutes = 0;
      for (let d = 6; d >= 0; d--) {
        const day = getDaysAgo(w * 7 + d);
        const daySessions = sessions.filter(
          (s) => s.startTime.startsWith(day) && s.type === 'focus' && s.completed
        );
        weekMinutes += daySessions.reduce((a, s) => a + s.duration, 0);
      }
      weeks.push({
        label: `Week ${4 - w}`,
        minutes: weekMinutes,
      });
    }
    return weeks;
  }, [sessions]);

  // Pomodoro analytics (focus vs break vs long-break)
  const sessionTypeData = useMemo(() => {
    const focusCount = sessions.filter((s) => s.type === 'focus' && s.completed).length;
    const breakCount = sessions.filter((s) => s.type === 'break' && s.completed).length;
    const longBreakCount = sessions.filter((s) => s.type === 'long-break' && s.completed).length;
    const total = focusCount + breakCount + longBreakCount;
    if (total === 0) return [];
    return [
      { name: 'Focus', value: focusCount, color: PURPLE },
      { name: 'Break', value: breakCount, color: GREEN },
      { name: 'Long Break', value: longBreakCount, color: YELLOW },
    ].filter((d) => d.value > 0);
  }, [sessions]);

  // Heatmap: last 90 days
  const heatmapData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const day = getDaysAgo(i);
      const count = sessions.filter(
        (s) => s.startTime.startsWith(day) && s.type === 'focus' && s.completed
      ).length;
      data.push({ date: day, count });
    }
    return data;
  }, [sessions]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count <= 2) return 'bg-green-900';
    if (count <= 4) return 'bg-green-700';
    return 'bg-green-500';
  };

  const statCards = [
    {
      label: 'Total Focus Hours',
      value: formatMinutes(totalFocusMinutes),
      icon: Clock,
      color: PURPLE,
    },
    {
      label: 'Total Sessions',
      value: totalSessions.toString(),
      icon: Target,
      color: GREEN,
    },
    {
      label: 'Focus Score',
      value: `${focusScore}%`,
      icon: TrendingUp,
      color: YELLOW,
    },
    {
      label: 'Productivity Score',
      value: `${productivityScore}%`,
      icon: BarChart3,
      color: RED,
    },
  ];

  // Progress ring for completion rate
  const progressRingRadius = 40;
  const progressRingCircumference = 2 * Math.PI * progressRingRadius;
  const progressRingOffset = progressRingCircumference - (completionRate / 100) * progressRingCircumference;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <GlassCard key={i}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div
                className="rounded-xl p-2"
                style={{ backgroundColor: stat.color + '20' }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Daily Study Time - AreaChart */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Daily Study Time</h3>
          <span className="text-white/40 text-sm ml-auto">Last 7 days</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyStats.map((d) => ({
              ...d,
              label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
            }))}>
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="minutes"
                name="Minutes"
                stroke={PURPLE}
                strokeWidth={2}
                fill="url(#purpleGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Weekly Hours - BarChart */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Weekly Hours</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyHoursData}>
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" name="Hours" fill={PURPLE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Monthly Progress</h3>
            <span className="text-white/40 text-sm ml-auto">Last 4 weeks</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}m`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="minutes" name="Minutes" fill={PURPLE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Pomodoro Analytics PieChart */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Session Types</h3>
          </div>
          {sessionTypeData.length > 0 ? (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      backdropFilter: 'blur(12px)',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute space-y-2">
                {sessionTypeData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-white/70">{d.name}</span>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/40">
              No session data yet
            </div>
          )}
        </GlassCard>
      </div>

      {/* Streaks & Completion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="text-center">
            <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Current Streak</p>
            <p className="text-3xl font-bold text-white mt-1">{currentStreak} <span className="text-base text-white/60">days</span></p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Longest Streak</p>
            <p className="text-3xl font-bold text-white mt-1">{longestStreak} <span className="text-base text-white/60">days</span></p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center flex flex-col items-center">
            <div className="relative w-24 h-24 mb-2">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r={progressRingRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50" cy="50" r={progressRingRadius}
                  fill="none"
                  stroke={PURPLE}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={progressRingCircumference}
                  initial={{ strokeDashoffset: progressRingCircumference }}
                  animate={{ strokeDashoffset: progressRingOffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                {completionRate}%
              </span>
            </div>
            <p className="text-white/60 text-sm">Completion Rate</p>
          </div>
        </GlassCard>
      </div>

      {/* Heatmap */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Activity Heatmap</h3>
          <span className="text-white/40 text-sm ml-auto">Last 90 days</span>
        </div>
        <div className="flex flex-wrap gap-1" style={{ maxWidth: '100%' }}>
          {heatmapData.map((d, i) => (
            <div
              key={i}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${getHeatmapColor(d.count)} relative group cursor-default`}
              title={`${new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${d.count} sessions`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black/90 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/10">
                {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <br />
                {d.count} session{d.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-white/40">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-white/5" />
          <div className="w-3 h-3 rounded-sm bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>More</span>
        </div>
      </GlassCard>
    </div>
  );
}
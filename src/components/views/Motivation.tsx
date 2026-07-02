'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Lightbulb,
  Trophy,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { MOTIVATIONAL_QUOTES, STUDY_TIPS, BADGE_TYPES } from '@/lib/constants';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { useGoalStore } from '@/stores/goalsStore';
import { getToday } from '@/lib/utils';

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const SUCCESS_MESSAGES = [
  "You're doing amazing! Keep pushing forward! 💪",
  "Every study session brings you closer to your goals! 🎯",
  "Small steps every day lead to big results! 🌟",
  "Your dedication is your superpower! ⚡",
  "Believe in yourself — you've got this! 🚀",
  "Progress, not perfection. You're on the right track! 📈",
  "The best time to study is now! 🔥",
  "Consistency beats intensity. Keep showing up! 💎",
];

export default function Motivation() {
  const { sessions } = usePomodoroStore();
  const { tasks } = useTaskStore();
  const { habits } = useHabitStore();
  const { goals } = useGoalStore();

  const dayOfYear = getDayOfYear();
  // Start with deterministic defaults (index 0) so server-rendered HTML and
  // the client's first render match exactly. Random/date-based values are
  // only applied after mount, avoiding a hydration mismatch that can break
  // Framer Motion's AnimatePresence content (missing/incomplete elements).
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tipScrollRef, setTipScrollRef] = useState<HTMLDivElement | null>(null);
  const [successMsg, setSuccessMsg] = useState(SUCCESS_MESSAGES[0]);

  useEffect(() => {
    setQuoteIndex(dayOfYear % MOTIVATIONAL_QUOTES.length);
    setSuccessMsg(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];

  const handleNewQuote = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      } while (newIndex === quoteIndex && MOTIVATIONAL_QUOTES.length > 1);
      setQuoteIndex(newIndex);
      setIsRefreshing(false);
    }, 400);
  };

  // Badge checking
  const badges = useMemo(() => {
    const focusSessions = sessions.filter((s) => s.type === 'focus' && s.completed).length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const focusDates = [
      ...new Set(
        sessions
          .filter((s) => s.type === 'focus' && s.completed)
          .map((s) => s.startTime.split('T')[0])
      ),
    ].sort();

    // Calculate streak
    let currentStreak = 0;
    if (focusDates.length > 0) {
      const today = getToday();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (focusDates[focusDates.length - 1] === today || focusDates[focusDates.length - 1] === yesterdayStr) {
        currentStreak = 1;
        for (let i = focusDates.length - 1; i > 0; i--) {
          const diff =
            (new Date(focusDates[i]).getTime() - new Date(focusDates[i - 1]).getTime()) /
            (1000 * 60 * 60 * 24);
          if (Math.round(diff) === 1) {
            currentStreak++;
          } else break;
        }
      }
    }

    // Max focus minutes in a day
    const dayMinutes = new Map<string, number>();
    sessions
      .filter((s) => s.type === 'focus' && s.completed)
      .forEach((s) => {
        const day = s.startTime.split('T')[0];
        dayMinutes.set(day, (dayMinutes.get(day) || 0) + s.duration);
      });
    const maxDayMinutes = Math.max(0, ...dayMinutes.values());

    // Today's task completion
    const today = getToday();
    const todayTasks = tasks.filter((t) => t.dueDate === today);
    const todayCompleted = todayTasks.filter((t) => t.completed).length;

    // Habit all-done days
    const habitDays = new Map<string, number>();
    habits.forEach((h) => {
      h.completedDates.forEach((d) => {
        habitDays.set(d, (habitDays.get(d) || 0) + 1);
      });
    });
    let perfectHabitDays = 0;
    habitDays.forEach((count) => {
      if (habits.length > 0 && count === habits.length) perfectHabitDays++;
    });

    // Early bird / night owl checks
    let earlyBird = false;
    let nightOwl = false;
    sessions
      .filter((s) => s.type === 'focus' && s.completed)
      .forEach((s) => {
        const hour = new Date(s.startTime).getHours();
        if (hour < 8) earlyBird = true;
        if (hour >= 0 && hour < 5) nightOwl = true;
      });

    // Completed goals
    const completedGoals = goals.filter((g) => g.completed).length;

    return BADGE_TYPES.map((badge) => {
      let earned = false;
      switch (badge.name) {
        case 'First Step':
          earned = completedTasks >= 1;
          break;
        case 'Streak Starter':
          earned = currentStreak >= 3;
          break;
        case 'Focus Master':
          earned = focusSessions >= 10;
          break;
        case 'Marathon Studier':
          earned = maxDayMinutes >= 480; // 8 hours
          break;
        case 'Goal Crusher':
          earned = completedGoals >= 5;
          break;
        case 'Habit Hero':
          earned = perfectHabitDays >= 7;
          break;
        case 'Early Bird':
          earned = earlyBird;
          break;
        case 'Night Owl':
          earned = nightOwl;
          break;
        case 'Perfect Day':
          earned = todayTasks.length > 0 && todayCompleted === todayTasks.length;
          break;
        case 'Week Warrior':
          earned = currentStreak >= 7;
          break;
      }
      return { ...badge, earned };
    });
  }, [sessions, tasks, habits, goals]);

  const earnedCount = badges.filter((b) => b.earned).length;

  const scrollTips = (direction: 'left' | 'right') => {
    if (!tipScrollRef) return;
    const scrollAmount = 320;
    tipScrollRef.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 space-y-6 sm:space-y-8">
      {/* Daily Quote */}
      <GlassCard className="relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-orange-500/20" />
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400/40" />
        </div>
        <div className="relative z-10 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-8 sm:pr-0">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400 shrink-0" />
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Daily Quote</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewQuote}
              className="text-white/60 hover:text-white hover:bg-white/10 gap-2 px-3 min-h-[40px]"
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
              <span className="hidden sm:inline">
  New Quote
</span>
            </Button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-w-0"
            >
              <blockquote
                className="text-base xs:text-lg sm:text-2xl lg:text-3xl font-light italic text-white leading-relaxed break-words w-full"
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
              >
                &ldquo;{currentQuote.text}&rdquo;
              </blockquote>
              <p className="mt-4 text-sm sm:text-base text-purple-300 font-medium">
                — {currentQuote.author}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Success Message */}
      <GlassCard className="w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="flex-1 min-w-0 break-words text-white/80 text-sm sm:text-base lg:text-lg">{successMsg}</p>
        </div>
      </GlassCard>

      {/* Study Tips Carousel */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Study Tips</h3>
          </div>
          <div className="hidden sm:flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => scrollTips('left')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => scrollTips('right')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div
          ref={setTipScrollRef}
className="
flex
gap-4
overflow-x-auto
scroll-smooth
snap-x
snap-mandatory
touch-pan-x
pb-2
px-1
-mx-1
"          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {STUDY_TIPS.map((tip, i) => (
            <GlassCard
              key={i}
              className="w-[85vw] xs:w-[calc(100vw-64px)] sm:w-auto sm:min-w-[280px] sm:max-w-[300px] md:min-w-[320px] snap-start shrink-0 hover:bg-white/10"
              hover
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{tip}</p>
              </div>
            </GlassCard>
          ))}
        </div>
        {/* Mobile scroll hint dots */}
        <div className="flex sm:hidden justify-center gap-1.5 mt-3">
          {STUDY_TIPS.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <GlassCard className="w-full pb-28 sm:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
          </div>
          <span className="text-sm text-white/40">
            {earnedCount}/{badges.length} earned
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-h-[500px] sm:overflow-y-auto sm:pr-1">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                badge.earned
                  ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/[0.12]'
                  : 'bg-white/[0.03] border-white/[0.06] opacity-50'
              }`}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  badge.earned ? '' : 'grayscale'
                }`}
                style={{
                  backgroundColor: badge.earned ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.05)',
                }}
              >
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium text-sm ${badge.earned ? 'text-white' : 'text-white/40'}`}>
                    {badge.name}
                  </p>
                  {badge.earned ? (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5 break-words">{badge.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

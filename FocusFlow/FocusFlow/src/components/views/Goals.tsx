'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  Trophy,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GlassCard } from '@/components/shared/GlassCard';
import { useGoalStore } from '@/stores/goalsStore';
import { type Goal, type GoalType } from '@/lib/types';
import { cn } from '@/lib/utils';

const GOAL_TYPE_CONFIG: Record<GoalType, { label: string; color: string; bg: string }> = {
  daily: { label: 'Daily', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  weekly: { label: 'Weekly', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  monthly: { label: 'Monthly', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  yearly: { label: 'Yearly', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, incrementProgress } = useGoalStore();

  const [activeTab, setActiveTab] = useState<GoalType>('daily');
  const [addOpen, setAddOpen] = useState(false);

  // New goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTarget, setGoalTarget] = useState(10);
  const [goalUnit, setGoalUnit] = useState('');
  const [goalBadge, setGoalBadge] = useState('');

  // Edit goal
  const [editOpen, setEditOpen] = useState(false);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTarget, setEditTarget] = useState(10);
  const [editUnit, setEditUnit] = useState('');
  const [editBadge, setEditBadge] = useState('');

  // Filtered goals
  const filteredGoals = goals.filter((g) => g.type === activeTab);

  // Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed).length;
  const inProgressGoals = totalGoals - completedGoals;

  // Earned badges
  const earnedBadges = goals.filter((g) => g.completed && g.badge);

  const handleAddGoal = () => {
    if (!goalTitle.trim()) return;
    addGoal({
      title: goalTitle.trim(),
      description: goalDesc.trim(),
      type: activeTab,
      target: goalTarget || 10,
      current: 0,
      unit: goalUnit.trim() || 'items',
      badge: goalBadge.trim(),
    });
    setGoalTitle('');
    setGoalDesc('');
    setGoalTarget(10);
    setGoalUnit('');
    setGoalBadge('');
    setAddOpen(false);
  };

  const openEditDialog = (goal: Goal) => {
    setEditGoalId(goal.id);
    setEditTitle(goal.title);
    setEditDesc(goal.description);
    setEditTarget(goal.target);
    setEditUnit(goal.unit);
    setEditBadge(goal.badge);
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editGoalId || !editTitle.trim()) return;
    updateGoal(editGoalId, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      target: editTarget || 10,
      unit: editUnit.trim() || 'items',
      badge: editBadge.trim(),
    });
    setEditOpen(false);
  };

  const handleManualProgress = (goalId: string, value: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const newCurrent = value;
    const newProgress = Math.min(Math.round((newCurrent / goal.target) * 100), 100);
    updateGoal(goalId, {
      current: newCurrent,
      progress: newProgress,
      completed: newProgress >= 100,
      completedAt: newProgress >= 100 ? new Date().toISOString() : '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals</h1>
          <p className="text-sm text-white/50">Set targets, track progress, earn badges</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Plus className="size-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#1a1a2e] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                Add {GOAL_TYPE_CONFIG[activeTab].label} Goal
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Create a new {activeTab} target to work towards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Title</label>
                <Input
                  placeholder="e.g. Read 5 chapters"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Description <span className="text-white/30">(optional)</span>
                </label>
                <Textarea
                  placeholder="Additional details..."
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30 min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Target</label>
                  <Input
                    type="number"
                    min={1}
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(Number(e.target.value))}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Unit</label>
                  <Input
                    placeholder="e.g. chapters, hours"
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Badge <span className="text-white/30">(e.g. 🏆 Goal Crusher)</span>
                </label>
                <Input
                  placeholder="Emoji badge text for completing this goal"
                  value={goalBadge}
                  onChange={(e) => setGoalBadge(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setAddOpen(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddGoal}
                disabled={!goalTitle.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
              <Target className="size-4 text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{totalGoals}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Total</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="size-4 text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{completedGoals}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Completed</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-500/10">
              <TrendingUp className="size-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{inProgressGoals}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">In Progress</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Achievement Badges */}
      {earnedBadges.length > 0 && (
        <GlassCard className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-yellow-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Award className="size-5 text-yellow-400" />
            <h2 className="font-semibold text-white">Achievement Badges</h2>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ml-auto">
              {earnedBadges.length} earned
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2"
              >
                <span className="text-lg">{goal.badge.split(' ')[0] || '🏆'}</span>
                <div>
                  <p className="text-xs font-medium text-white">{goal.badge.split(' ').slice(1).join(' ') || 'Achievement'}</p>
                  <p className="text-[10px] text-white/40">{goal.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Goals Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GoalType)}>
        <TabsList className="bg-white/5 border border-white/10">
          {(['daily', 'weekly', 'monthly', 'yearly'] as GoalType[]).map((type) => {
            const config = GOAL_TYPE_CONFIG[type];
            const count = goals.filter((g) => g.type === type).length;
            return (
              <TabsTrigger
                key={type}
                value={type}
                className={cn(
                  'data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 gap-1.5',
                  `data-[state=active]:${config.color}`
                )}
              >
                {config.label}
                {count > 0 && (
                  <span className="text-[10px] opacity-60">({count})</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Daily Goals */}
        {(['daily', 'weekly', 'monthly', 'yearly'] as GoalType[]).map((type) => (
          <TabsContent key={type} value={type}>
            {filteredGoals.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-white/5 mb-4">
                  <Target className="size-8 text-white/20" />
                </div>
                <p className="text-white/40 text-lg font-medium">
                  No {type} goals yet
                </p>
                <p className="text-white/20 text-sm mt-1">
                  Create your first {type} goal to start tracking
                </p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {goals
                    .filter((g) => g.type === type)
                    .map((goal, index) => (
                      <motion.div
                        key={goal.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div
                          className={cn(
                            'rounded-2xl border p-5 space-y-4 transition-all',
                            goal.completed
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          )}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {goal.completed ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                  className="relative flex size-6 items-center justify-center shrink-0"
                                >
                                  <CheckCircle2 className="size-6 text-green-400" />
                                  <motion.div
                                    className="absolute inset-0 rounded-full bg-green-400/20"
                                    initial={{ scale: 0.8, opacity: 1 }}
                                    animate={{ scale: 1.5, opacity: 0 }}
                                    transition={{ duration: 0.6, repeat: 2 }}
                                  />
                                </motion.div>
                              ) : (
                                <Circle className="size-6 text-white/20 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <h3
                                  className={cn(
                                    'font-semibold text-sm leading-tight',
                                    goal.completed
                                      ? 'text-white/60 line-through'
                                      : 'text-white'
                                  )}
                                >
                                  {goal.title}
                                </h3>
                                {goal.description && (
                                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">
                                    {goal.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'shrink-0 text-[10px] uppercase tracking-wider',
                                GOAL_TYPE_CONFIG[goal.type].bg,
                                GOAL_TYPE_CONFIG[goal.type].color
                              )}
                            >
                              {goal.type}
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/50">
                                {goal.current} / {goal.target} {goal.unit}
                              </span>
                              <span
                                className={cn(
                                  'font-semibold',
                                  goal.progress >= 100
                                    ? 'text-green-400'
                                    : 'text-purple-400'
                                )}
                              >
                                {goal.progress}%
                              </span>
                            </div>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="relative"
                            >
                              <Progress
                                value={goal.progress}
                                className={cn(
                                  'h-2.5',
                                  goal.progress >= 100 && '[&>[data-slot=progress-indicator]]:bg-green-500'
                                )}
                              />
                            </motion.div>
                          </div>

                          {/* Progress Controls */}
                          {!goal.completed && (
                            <div className="space-y-3">
                              {/* Slider for manual progress */}
                              <div className="space-y-1">
                                <Slider
                                  value={[goal.current]}
                                  min={0}
                                  max={goal.target}
                                  step={1}
                                  onValueChange={([val]) =>
                                    handleManualProgress(goal.id, val)
                                  }
                                  className="py-1"
                                />
                              </div>

                              {/* +1 Button */}
                              <Button
                                size="sm"
                                onClick={() => incrementProgress(goal.id)}
                                className="w-full h-8 bg-purple-600/20 border border-purple-500/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 text-xs gap-1.5"
                              >
                                <Plus className="size-3" />
                                Increment +1 {goal.unit}
                              </Button>
                            </div>
                          )}

                          {/* Completed Badge */}
                          {goal.completed && goal.badge && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-3 py-2"
                            >
                              <Sparkles className="size-4 text-yellow-400" />
                              <span className="text-sm text-yellow-300 font-medium">
                                {goal.badge}
                              </span>
                            </motion.div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-white/30 hover:text-white/60 text-xs"
                              onClick={() => openEditDialog(goal)}
                            >
                              <Edit3 className="size-3" />
                              Edit
                            </Button>
                            <div className="flex-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-white/30 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteGoal(goal.id)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Goal Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-white/10 bg-[#1a1a2e] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Goal</DialogTitle>
            <DialogDescription className="text-white/50">
              Update your goal details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Description</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Target</label>
                <Input
                  type="number"
                  min={1}
                  value={editTarget}
                  onChange={(e) => setEditTarget(Number(e.target.value))}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Unit</label>
                <Input
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Badge</label>
              <Input
                value={editBadge}
                onChange={(e) => setEditBadge(e.target.value)}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              className="text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editTitle.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
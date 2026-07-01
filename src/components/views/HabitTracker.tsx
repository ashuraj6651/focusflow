'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Dumbbell,
  Brain,
  Droplets,
  Moon,
  Apple,
  Pencil,
  Music,
  Camera,
  Heart,
  Star,
  Zap,
  Plus,
  Check,
  Trash2,
  Edit3,
  Flame,
  X,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useHabitStore } from '@/stores/habitStore';
import { getToday, getStreak } from '@/lib/utils';
import { DEFAULT_HABITS } from '@/lib/constants';
import { type Habit, HABIT_ICONS, HABIT_COLORS } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Dumbbell,
  Brain,
  Droplets,
  Moon,
  Apple,
  Pencil,
  Music,
  Camera,
  Heart,
  Star,
  Zap,
};

export default function HabitTracker() {
  const {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitForDate,
    isCompletedToday,
    getStreak: getStoreStreak,
    getHeatmapData,
  } = useHabitStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('BookOpen');
  const [selectedColor, setSelectedColor] = useState('#7C3AED');

  const today = getToday();

  // Initialize default habits if empty
  useEffect(() => {
    if (habits.length === 0) {
      DEFAULT_HABITS.forEach((h) => addHabit(h.name, h.icon, h.color));
    }
  }, [habits.length, addHabit]);

  const heatmapData = getHeatmapData();

  const handleAddHabit = () => {
    if (!newName.trim()) return;
    addHabit(newName.trim(), selectedIcon, selectedColor);
    setNewName('');
    setSelectedIcon('BookOpen');
    setSelectedColor('#7C3AED');
    setDialogOpen(false);
  };

  const handleEditHabit = () => {
    if (!editingHabit || !newName.trim()) return;
    updateHabit(editingHabit.id, {
      name: newName.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
    setEditingHabit(null);
    setNewName('');
    setEditDialogOpen(false);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewName(habit.name);
    setSelectedIcon(habit.icon);
    setSelectedColor(habit.color);
    setEditDialogOpen(true);
  };

  const todayCompleted = habits.filter((h) => isCompletedToday(h.id)).length;

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Habit Tracker</h1>
          <p className="mt-1 text-sm text-white/35">
            {todayCompleted} of {habits.length} habits completed today
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.08] rounded-3xl text-white">
            <DialogHeader>
              <DialogTitle>New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Habit Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Morning Run"
                  className="bg-white/[0.03] border-white/[0.06]"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {HABIT_ICONS.map((icon) => {
                    const IconComp = ICON_MAP[icon];
                    return (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          selectedIcon === icon
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]'
                        }`}
                      >
                        {IconComp && <IconComp className="w-4 h-4 mx-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-white scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAddHabit} className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">
                Create Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Habits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {habits.map((habit) => {
            const IconComp = ICON_MAP[habit.icon] || Star;
            const completed = isCompletedToday(habit.id);
            const streak = getStoreStreak(habit.id);

            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard
                  className={`relative overflow-hidden transition-all ${completed ? 'opacity-70' : ''}`}
                  hover
                  onClick={() => toggleHabitForDate(habit.id, today)}
                >
                  {completed && (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundColor: habit.color }}
                    />
                  )}
                  <div className="flex items-center gap-4 relative z-10">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        completed
                          ? 'bg-green-500/20'
                          : ''
                      }`}
                      style={{
                        backgroundColor: completed
                          ? undefined
                          : habit.color + '20',
                      }}
                    >
                      {completed ? (
                        <Check className="w-6 h-6 text-green-400" />
                      ) : (
                        <IconComp className="w-6 h-6" style={{ color: habit.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${completed ? 'line-through text-white/50' : 'text-white'}`}>
                        {habit.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-sm text-white/40">{streak} day streak</span>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-white/20'
                      }`}
                    >
                      {completed && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Calendar Heatmap */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-white mb-4">Activity Heatmap</h3>
        <div className="flex flex-wrap gap-1">
          {heatmapData.map((d, i) => {
            const maxHabits = habits.length || 1;
            const intensity = d.count / maxHabits;
            let bgColor = 'bg-white/5';
            if (intensity > 0 && intensity <= 0.33) bgColor = 'bg-green-900';
            else if (intensity > 0.33 && intensity <= 0.66) bgColor = 'bg-green-700';
            else if (intensity > 0.66) bgColor = 'bg-green-500';

            return (
              <div
                key={i}
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${bgColor} relative group cursor-default`}
                title={`${new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${d.count} habits`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black/90 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/[0.06]">
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <br />
                  {d.count}/{maxHabits} habits
                </div>
              </div>
            );
          })}
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

      {/* All Habits List */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-white mb-4">All Habits</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {habits.map((habit) => {
            const IconComp = ICON_MAP[habit.icon] || Star;
            const streak = getStoreStreak(habit.id);
            const totalCompletions = habit.completedDates.length;

            return (
              <div
                key={habit.id}
                className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  <IconComp className="w-5 h-5" style={{ color: habit.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{habit.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      {streak} day streak
                    </span>
                    <span>{totalCompletions} total</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
                    onClick={() => openEdit(habit)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10"
                    onClick={() => deleteHabit(habit.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {habits.length === 0 && (
            <p className="text-white/40 text-center py-8">No habits yet. Add one to get started!</p>
          )}
        </div>
      </GlassCard>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingHabit(null); }}>
        <DialogContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.08] rounded-3xl text-white">
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Habit Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/[0.03] border-white/[0.06]"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {HABIT_ICONS.map((icon) => {
                  const IconComp = ICON_MAP[icon];
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        selectedIcon === icon
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]'
                      }`}
                    >
                      {IconComp && <IconComp className="w-4 h-4 mx-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-white scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleEditHabit} className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
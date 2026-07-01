import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Habit } from '@/lib/types';
import { generateId, getToday, getStreak } from '@/lib/utils';

interface HabitState {
  habits: Habit[];
  addHabit: (name: string, icon: string, color: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitForDate: (id: string, date: string) => void;
  isCompletedToday: (id: string) => boolean;
  getStreak: (id: string) => number;
  getHeatmapData: () => { date: string; count: number }[];
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (name, icon, color) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: generateId(),
              name,
              icon,
              color: color || '#7C3AED',
              completedDates: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateHabit: (id, updates) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),

      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
        })),

      toggleHabitForDate: (id, date) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const isCompleted = h.completedDates.includes(date);
            return {
              ...h,
              completedDates: isCompleted
                ? h.completedDates.filter((d) => d !== date)
                : [...h.completedDates, date],
            };
          }),
        })),

      isCompletedToday: (id) => {
        const today = getToday();
        const habit = get().habits.find((h) => h.id === id);
        return habit?.completedDates.includes(today) ?? false;
      },

      getStreak: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return 0;
        return getStreak(habit.completedDates);
      },

      getHeatmapData: () => {
        const { habits } = get();
        const dateMap = new Map<string, number>();
        for (let i = 89; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          dateMap.set(dateStr, 0);
        }
        habits.forEach((h) => {
          h.completedDates.forEach((d) => {
            if (dateMap.has(d)) {
              dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
            }
          });
        });
        return Array.from(dateMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      },
    }),
    { name: 'focusflow-habits' }
  )
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Goal, type GoalType } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface GoalState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'progress' | 'completed' | 'createdAt' | 'completedAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  incrementProgress: (id: string) => void;
  getGoalsByType: (type: GoalType) => Goal[];
  getCompletedCount: () => number;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) =>
        set((s) => ({
          goals: [
            ...s.goals,
            {
              ...goal,
              id: generateId(),
              progress: 0,
              completed: false,
              createdAt: new Date().toISOString(),
              completedAt: '',
            },
          ],
        })),

      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
        })),

      incrementProgress: (id) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== id) return g;
            const newCurrent = g.current + 1;
            const newProgress = Math.min(
              Math.round((newCurrent / g.target) * 100),
              100
            );
            return {
              ...g,
              current: newCurrent,
              progress: newProgress,
              completed: newProgress >= 100,
              completedAt:
                newProgress >= 100 ? new Date().toISOString() : g.completedAt,
            };
          }),
        })),

      getGoalsByType: (type) => get().goals.filter((g) => g.type === type),
      getCompletedCount: () => get().goals.filter((g) => g.completed).length,
    }),
    { name: 'focusflow-goals' }
  )
);
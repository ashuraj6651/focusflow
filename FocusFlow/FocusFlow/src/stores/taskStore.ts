import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Task, type Priority, type TaskCategory, TASK_COLORS } from '@/lib/types';
import { generateId, getToday } from '@/lib/utils';

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;
  getTodayTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getTasksByCategory: (category: TaskCategory) => Task[];
  getTodayCompletedCount: () => number;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              ...task,
              id: generateId(),
              completed: false,
              createdAt: new Date().toISOString(),
              completedAt: '',
              order: s.tasks.length,
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
        })),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : '',
                }
              : t
          ),
        })),

      reorderTasks: (activeId, overId) =>
        set((s) => {
          const oldIndex = s.tasks.findIndex((t) => t.id === activeId);
          const newIndex = s.tasks.findIndex((t) => t.id === overId);
          if (oldIndex === -1 || newIndex === -1) return s;
          const newTasks = [...s.tasks];
          const [moved] = newTasks.splice(oldIndex, 1);
          newTasks.splice(newIndex, 0, moved);
          return { tasks: newTasks.map((t, i) => ({ ...t, order: i })) };
        }),

      getTodayTasks: () => {
        const today = getToday();
        return get().tasks.filter((t) => t.dueDate === today);
      },

      getUpcomingTasks: () => {
        const today = getToday();
        return get().tasks
          .filter((t) => !t.completed && t.dueDate >= today)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      },

      getTasksByCategory: (category) =>
        get().tasks.filter((t) => t.category === category),

      getTodayCompletedCount: () => {
        const today = getToday();
        return get().tasks.filter(
          (t) => t.completed && t.completedAt.startsWith(today)
        ).length;
      },
    }),
    { name: 'focusflow-tasks' }
  )
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ChecklistItem } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface ChecklistState {
  items: ChecklistItem[];
  addItem: (text: string) => void;
  updateItem: (id: string, text: string) => void;
  deleteItem: (id: string) => void;
  toggleItem: (id: string) => void;
  reorderItems: (activeId: string, overId: string) => void;
  getTodayItems: () => ChecklistItem[];
  getCompletedCount: () => number;
  getPendingCount: () => number;
  getCompletionPercentage: () => number;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (text) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              id: generateId(),
              text,
              completed: false,
              createdAt: new Date().toISOString(),
              completedAt: '',
              order: s.items.length,
            },
          ],
        })),

      updateItem: (id, text) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, text } : i)),
        })),

      deleteItem: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
        })),

      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  completed: !i.completed,
                  completedAt: !i.completed ? new Date().toISOString() : '',
                }
              : i
          ),
        })),

      reorderItems: (activeId, overId) =>
        set((s) => {
          const oldIndex = s.items.findIndex((i) => i.id === activeId);
          const newIndex = s.items.findIndex((i) => i.id === overId);
          if (oldIndex === -1 || newIndex === -1) return s;
          const newItems = [...s.items];
          const [moved] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, moved);
          return { items: newItems.map((i, idx) => ({ ...i, order: idx })) };
        }),

      getTodayItems: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().items.filter((i) => i.createdAt.startsWith(today));
      },

      getCompletedCount: () => get().items.filter((i) => i.completed).length,
      getPendingCount: () => get().items.filter((i) => !i.completed).length,
      getCompletionPercentage: () => {
        const { items } = get();
        if (items.length === 0) return 0;
        return Math.round((items.filter((i) => i.completed).length / items.length) * 100);
      },
    }),
    { name: 'focusflow-checklist' }
  )
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Note } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface NotesState {
  notes: Note[];
  addNote: (title: string, content: string, color: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  searchNotes: (query: string) => Note[];
  getPinnedNotes: () => Note[];
  getFavoriteNotes: () => Note[];
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (title, content, color) =>
        set((s) => ({
          notes: [
            {
              id: generateId(),
              title: title || 'Untitled Note',
              content: content || '',
              color: color || 'default',
              pinned: false,
              favorite: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...s.notes,
          ],
        })),

      updateNote: (id, updates) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, ...updates, updatedAt: new Date().toISOString() }
              : n
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
        })),

      togglePin: (id) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, pinned: !n.pinned } : n
          ),
        })),

      toggleFavorite: (id) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, favorite: !n.favorite } : n
          ),
        })),

      searchNotes: (query) => {
        const q = query.toLowerCase();
        return get().notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        );
      },

      getPinnedNotes: () => get().notes.filter((n) => n.pinned),
      getFavoriteNotes: () => get().notes.filter((n) => n.favorite),
    }),
    { name: 'focusflow-notes' }
  )
);
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Subject, type RevisionStatus, SUBJECT_COLORS } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface SubjectState {
  subjects: Subject[];
  addSubject: (name: string, targetHours: number, color: string) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addStudyHours: (id: string, hours: number) => void;
  getSubject: (id: string) => Subject | undefined;
  getTotalStudyHours: () => number;
}

export const useSubjectStore = create<SubjectState>()(
  persist(
    (set, get) => ({
      subjects: [],

      addSubject: (name, targetHours, color) =>
        set((s) => ({
          subjects: [
            ...s.subjects,
            {
              id: generateId(),
              name,
              color: color || SUBJECT_COLORS[s.subjects.length % SUBJECT_COLORS.length],
              hoursStudied: 0,
              targetHours: targetHours || 50,
              upcomingExam: '',
              revisionStatus: 'not-started' as RevisionStatus,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateSubject: (id, updates) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === id ? { ...sub, ...updates } : sub
          ),
        })),

      deleteSubject: (id) =>
        set((s) => ({
          subjects: s.subjects.filter((sub) => sub.id !== id),
        })),

      addStudyHours: (id, hours) =>
        set((s) => ({
          subjects: s.subjects.map((sub) =>
            sub.id === id
              ? { ...sub, hoursStudied: sub.hoursStudied + hours }
              : sub
          ),
        })),

      getSubject: (id) => get().subjects.find((s) => s.id === id),

      getTotalStudyHours: () =>
        get().subjects.reduce((acc, s) => acc + s.hoursStudied, 0),
    }),
    { name: 'focusflow-subjects' }
  )
);
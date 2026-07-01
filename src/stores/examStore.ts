import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Exam, type Priority } from '@/lib/types';
import { generateId, getDaysBetween, getToday } from '@/lib/utils';

interface ExamState {
  exams: Exam[];
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  getDaysRemaining: (id: string) => number;
  getUpcomingExams: () => (Exam & { daysRemaining: number })[];
  getPastExams: () => Exam[];
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      exams: [],

      addExam: (exam) =>
        set((s) => ({
          exams: [
            ...s.exams,
            {
              ...exam,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        })),

      updateExam: (id, updates) =>
        set((s) => ({
          exams: s.exams.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteExam: (id) =>
        set((s) => ({
          exams: s.exams.filter((e) => e.id !== id),
        })),

      getDaysRemaining: (id) => {
        const exam = get().exams.find((e) => e.id === id);
        if (!exam) return 0;
        return getDaysBetween(getToday(), exam.date);
      },

      getUpcomingExams: () => {
        const today = getToday();
        return get()
          .exams.filter((e) => e.date >= today)
          .map((e) => ({
            ...e,
            daysRemaining: getDaysBetween(today, e.date),
          }));
      },

      getPastExams: () => {
        const today = getToday();
        return get().exams.filter((e) => e.date < today);
      },
    }),
    { name: 'focusflow-exams' }
  )
);
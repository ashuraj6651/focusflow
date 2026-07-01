export type ViewType =
  | 'dashboard'
  | 'focus'
  | 'pomodoro'
  | 'planner'
  | 'checklist'
  | 'subjects'
  | 'notes'
  | 'goals'
  | 'analytics'
  | 'habits'
  | 'exams'
  | 'motivation'
  | 'settings';

export type Priority = 'high' | 'medium' | 'low';

export type TaskCategory = 'study' | 'revision' | 'assignment' | 'exam' | 'project' | 'notes';

export type RevisionStatus = 'not-started' | 'in-progress' | 'completed';

export type GoalType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type SessionType = 'focus' | 'break' | 'long-break';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  subject: string;
  category: TaskCategory;
  color: string;
  completed: boolean;
  createdAt: string;
  completedAt: string;
  order: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt: string;
  order: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  hoursStudied: number;
  targetHours: number;
  upcomingExam: string;
  revisionStatus: RevisionStatus;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  progress: number;
  target: number;
  current: number;
  unit: string;
  completed: boolean;
  badge: string;
  createdAt: string;
  completedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  completedDates: string[];
  createdAt: string;
}

export interface Exam {
  id: string;
  name: string;
  subject: string;
  date: string;
  priority: Priority;
  reminder: boolean;
  notes: string;
  createdAt: string;
}

export interface PomodoroSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: SessionType;
  completed: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  notifications: boolean;
  alarmVolume: number;
  backgroundMusic: boolean;
  autoFullscreen: boolean;
  language: string;
  pomodoroFocus: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  pomodoroSessionsBeforeLong: number;
  autoStartPomodoro: boolean;
  autoStartBreak: boolean;
}

export interface DailyStats {
  date: string;
  focusMinutes: number;
  tasksCompleted: number;
  pomodoroSessions: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#7C3AED',
  notifications: true,
  alarmVolume: 70,
  backgroundMusic: false,
  autoFullscreen: false,
  language: 'en',
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroSessionsBeforeLong: 4,
  autoStartPomodoro: false,
  autoStartBreak: false,
};

export const TASK_COLORS = [
  '#7C3AED', '#EC4899', '#F59E0B', '#10B981',
  '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4',
];

export const SUBJECT_COLORS = [
  '#7C3AED', '#EC4899', '#F59E0B', '#10B981',
  '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4',
  '#F97316', '#14B8A6',
];

export const NOTE_COLORS = [
  'default', 'purple', 'pink', 'blue', 'green', 'yellow', 'orange', 'red',
];

export const HABIT_ICONS = [
  'BookOpen', 'Dumbbell', 'Brain', 'Droplets', 'Moon', 'Apple', 'Pencil',
  'Music', 'Camera', 'Heart', 'Star', 'Zap',
];

export const HABIT_COLORS = [
  '#7C3AED', '#EC4899', '#F59E0B', '#10B981',
  '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4',
];
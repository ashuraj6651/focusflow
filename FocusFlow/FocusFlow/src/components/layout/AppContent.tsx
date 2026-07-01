'use client';

import { useAppStore } from '@/stores/appStore';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { FloatingTimer } from '@/components/shared/FloatingTimer';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const DashboardView = dynamic(() => import('@/components/views/Dashboard'));
const FocusModeView = dynamic(() => import('@/components/views/FocusMode'));
const PomodoroView = dynamic(() => import('@/components/views/PomodoroTimer'));
const PlannerView = dynamic(() => import('@/components/views/StudyPlanner'));
const ChecklistView = dynamic(() => import('@/components/views/Checklist'));
const SubjectsView = dynamic(() => import('@/components/views/SubjectManager'));
const NotesView = dynamic(() => import('@/components/views/Notes'));
const GoalsView = dynamic(() => import('@/components/views/Goals'));
const AnalyticsView = dynamic(() => import('@/components/views/Analytics'));
const HabitsView = dynamic(() => import('@/components/views/HabitTracker'));
const ExamsView = dynamic(() => import('@/components/views/ExamCountdown'));
const MotivationView = dynamic(() => import('@/components/views/Motivation'));
const SettingsView = dynamic(() => import('@/components/views/Settings'));

export function AppContent() {
  const { currentView } = useAppStore();

  return (
    <main className="flex-1 overflow-hidden">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="h-full"
      >
        <ViewRouter view={currentView} />
      </motion.div>
      <CommandPalette />
      <FloatingTimer />
    </main>
  );
}

function ViewRouter({ view }: { view: string }) {
  switch (view) {
    case 'dashboard': return <DashboardView />;
    case 'focus': return <FocusModeView />;
    case 'pomodoro': return <PomodoroView />;
    case 'planner': return <PlannerView />;
    case 'checklist': return <ChecklistView />;
    case 'subjects': return <SubjectsView />;
    case 'notes': return <NotesView />;
    case 'goals': return <GoalsView />;
    case 'analytics': return <AnalyticsView />;
    case 'habits': return <HabitsView />;
    case 'exams': return <ExamsView />;
    case 'motivation': return <MotivationView />;
    case 'settings': return <SettingsView />;
    default: return <DashboardView />;
  }
}
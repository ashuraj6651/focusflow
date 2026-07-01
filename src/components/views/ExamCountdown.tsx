'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CalendarClock,
  AlertTriangle,
  Clock,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  CalendarX,
  GraduationCap,
  Bell,
  X,
  FileText,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useExamStore } from '@/stores/examStore';
import { formatDate, getDaysBetween, getToday } from '@/lib/utils';
import { type Exam, type Priority } from '@/lib/types';

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  high: { color: 'text-red-400', bg: 'bg-red-500/[0.08] border-red-500/[0.12]', label: 'High' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/[0.08] border-yellow-500/[0.12]', label: 'Medium' },
  low: { color: 'text-green-400', bg: 'bg-green-500/[0.08] border-green-500/[0.12]', label: 'Low' },
};

export default function ExamCountdown() {
  const { exams, addExam, updateExam, deleteExam, getUpcomingExams, getPastExams } =
    useExamStore();

  const upcomingExams = getUpcomingExams();
  const pastExams = getPastExams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showPast, setShowPast] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formReminder, setFormReminder] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormSubject('');
    setFormDate('');
    setFormPriority('medium');
    setFormReminder(true);
    setFormNotes('');
  };

  const handleAdd = () => {
    if (!formName.trim() || !formDate) return;
    addExam({
      name: formName.trim(),
      subject: formSubject.trim(),
      date: formDate,
      priority: formPriority,
      reminder: formReminder,
      notes: formNotes.trim(),
    });
    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editingExam || !formName.trim() || !formDate) return;
    updateExam(editingExam.id, {
      name: formName.trim(),
      subject: formSubject.trim(),
      date: formDate,
      priority: formPriority,
      reminder: formReminder,
      notes: formNotes.trim(),
    });
    setEditingExam(null);
    resetForm();
    setEditDialogOpen(false);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormName(exam.name);
    setFormSubject(exam.subject);
    setFormDate(exam.date);
    setFormPriority(exam.priority);
    setFormReminder(exam.reminder);
    setFormNotes(exam.notes);
    setEditDialogOpen(true);
  };

  const getCountdownText = (days: number) => {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Passed';
    return `${days} days remaining`;
  };

  const getTimeProgress = (createdAt: string, examDate: string) => {
    const created = new Date(createdAt).getTime();
    const exam = new Date(examDate).getTime();
    const now = Date.now();
    if (exam <= created) return 100;
    if (now >= exam) return 100;
    return Math.round(((now - created) / (exam - created)) * 100);
  };

  const ExamForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>Exam Name</Label>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g. Final Exam"
          className="bg-white/[0.03] border-white/[0.06]"
        />
      </div>
      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          value={formSubject}
          onChange={(e) => setFormSubject(e.target.value)}
          placeholder="e.g. Mathematics"
          className="bg-white/[0.03] border-white/[0.06]"
        />
      </div>
      <div className="space-y-2">
        <Label>Exam Date</Label>
        <Input
          type="date"
          value={formDate}
          onChange={(e) => setFormDate(e.target.value)}
          className="bg-white/[0.03] border-white/[0.06]"
        />
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select value={formPriority} onValueChange={(v) => setFormPriority(v as Priority)}>
          <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.06]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.06]">
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Reminder</Label>
        <Switch checked={formReminder} onCheckedChange={setFormReminder} />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Any additional notes..."
          className="bg-white/[0.03] border-white/[0.06] min-h-[80px]"
        />
      </div>
      <Button onClick={onSubmit} className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Exam Countdown</h1>
          <p className="mt-1 text-sm text-white/35">
            {upcomingExams.length} upcoming exam{upcomingExams.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.08] rounded-3xl text-white">
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
            </DialogHeader>
            <ExamForm onSubmit={handleAdd} submitLabel="Add Exam" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {upcomingExams.map((exam) => {
              const prio = PRIORITY_CONFIG[exam.priority];
              const progress = getTimeProgress(exam.createdAt, exam.date);
              const isUrgent = exam.daysRemaining <= 3 && exam.daysRemaining >= 0;

              return (
                <motion.div
                  key={exam.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard
                    className={`relative overflow-hidden ${isUrgent ? 'border-red-500/30' : ''}`}
                  >
                    {isUrgent && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">{exam.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${prio.bg} ${prio.color}`}
                          >
                            {prio.label}
                          </span>
                          {exam.reminder && (
                            <Bell className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </div>
                        {exam.subject && (
                          <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {exam.subject}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm text-white/40">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {formatDate(exam.date)}
                        </div>
                        {exam.notes && (
                          <p className="text-white/40 text-sm mt-2 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {exam.notes}
                          </p>
                        )}
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                            <span>Time elapsed</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: exam.priority === 'high' ? '#EF4444' : exam.priority === 'medium' ? '#F59E0B' : '#10B981' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              exam.daysRemaining === 0
                                ? 'text-green-400'
                                : exam.daysRemaining <= 3
                                ? 'text-red-400'
                                : 'text-white'
                            }`}
                          >
                            {getCountdownText(exam.daysRemaining)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
                            onClick={() => openEdit(exam)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => deleteExam(exam.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <CalendarX className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Exams</h3>
            <p className="text-white/35 max-w-sm">
              Add your upcoming exams to track countdowns and stay prepared. Click the &ldquo;Add Exam&rdquo; button to get started.
            </p>
          </div>
        </GlassCard>
      )}

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <GlassCard noPadding>
          <button
            onClick={() => setShowPast(!showPast)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div>
              <h3 className="text-lg font-semibold text-white">Past Exams</h3>
              <p className="text-white/40 text-sm">{pastExams.length} exam{pastExams.length !== 1 ? 's' : ''}</p>
            </div>
            {showPast ? (
              <ChevronUp className="w-5 h-5 text-white/40" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/40" />
            )}
          </button>
          <AnimatePresence>
            {showPast && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-2 max-h-96 overflow-y-auto">
                  {pastExams.map((exam) => {
                    const prio = PRIORITY_CONFIG[exam.priority];
                    return (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white/40 truncate">{exam.name}</p>
                          <p className="text-sm text-white/40">
                            {exam.subject && `${exam.subject} · `}
                            {formatDate(exam.date)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ml-2 ${prio.bg} ${prio.color}`}>
                          {prio.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10 ml-1"
                          onClick={() => deleteExam(exam.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setEditingExam(null); resetForm(); } }}>
        <DialogContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.08] rounded-3xl text-white">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
          </DialogHeader>
          <ExamForm onSubmit={handleEdit} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
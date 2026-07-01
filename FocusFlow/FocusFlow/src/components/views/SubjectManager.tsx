'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  Calendar,
  Trash2,
  GraduationCap,
  BookOpen,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassCard } from '@/components/shared/GlassCard';
import { useSubjectStore } from '@/stores/subjectStore';
import { SUBJECT_COLORS } from '@/lib/types';
import { type RevisionStatus, type Subject } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

const REVISION_OPTIONS: { value: RevisionStatus; label: string; color: string }[] = [
  { value: 'not-started', label: 'Not Started', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
];

export default function SubjectManager() {
  const { subjects, addSubject, updateSubject, deleteSubject, addStudyHours, getTotalStudyHours } =
    useSubjectStore();
  const totalHours = getTotalStudyHours();

  // Add Subject dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState(50);
  const [newColor, setNewColor] = useState(SUBJECT_COLORS[0]);

  // Add Hours dialog state
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hoursSubjectId, setHoursSubjectId] = useState('');
  const [hoursToAdd, setHoursToAdd] = useState(1);

  // Set Exam dialog state
  const [examOpen, setExamOpen] = useState(false);
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');

  const handleAddSubject = () => {
    if (!newName.trim()) return;
    addSubject(newName.trim(), newTarget, newColor);
    setNewName('');
    setNewTarget(50);
    setNewColor(SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]);
    setAddOpen(false);
  };

  const handleAddHours = () => {
    if (hoursToAdd <= 0 || hoursToAdd > 8) return;
    addStudyHours(hoursSubjectId, hoursToAdd);
    setHoursToAdd(1);
    setHoursOpen(false);
  };

  const handleSetExam = () => {
    if (!examDate) return;
    updateSubject(examSubjectId, { upcomingExam: examDate });
    setExamDate('');
    setExamOpen(false);
  };

  const handleRevisionChange = (id: string, value: string) => {
    updateSubject(id, { revisionStatus: value as RevisionStatus });
  };

  const getRevisionBadge = (status: RevisionStatus) => {
    const opt = REVISION_OPTIONS.find((o) => o.value === status);
    if (!opt) return null;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
          opt.color
        )}
      >
        {opt.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subjects</h1>
          <p className="text-sm text-white/50">Manage your study subjects and track progress</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Plus className="size-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#1a1a2e] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Subject</DialogTitle>
              <DialogDescription className="text-white/50">
                Create a new subject to track your study progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Subject Name</label>
                <Input
                  placeholder="e.g. Mathematics"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Target Hours</label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={newTarget}
                  onChange={(e) => setNewTarget(Number(e.target.value))}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Color</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        'size-8 rounded-full border-2 transition-all hover:scale-110',
                        newColor === color ? 'border-white scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setAddOpen(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSubject}
                disabled={!newName.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Add Subject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <GlassCard className="bg-gradient-to-r from-purple-600/20 to-purple-900/20 border-purple-500/20">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-purple-600/20">
            <GraduationCap className="size-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/50">Total Study Hours</p>
            <p className="text-3xl font-bold text-white">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-white/40">
            <BookOpen className="size-4" />
            <span className="text-sm">{subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}</span>
          </div>
        </div>
      </GlassCard>

      {/* Subject Grid */}
      {subjects.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/5 mb-4">
            <BookOpen className="size-8 text-white/20" />
          </div>
          <p className="text-white/40 text-lg font-medium">No subjects yet</p>
          <p className="text-white/20 text-sm mt-1">Add your first subject to start tracking progress</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {subjects.map((subject, index) => {
              const progress = subject.targetHours > 0
                ? Math.min((subject.hoursStudied / subject.targetHours) * 100, 100)
                : 0;
              const daysUntilExam = subject.upcomingExam
                ? Math.ceil((new Date(subject.upcomingExam).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <motion.div
                  key={subject.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4 hover:border-white/20 transition-colors">
                    {/* Subject Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: subject.color }}
                        />
                        <h3 className="font-semibold text-white truncate">{subject.name}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0 text-xs',
                          progress >= 100
                            ? 'border-green-500/30 text-green-400 bg-green-500/10'
                            : 'border-white/10 text-white/50 bg-white/5'
                        )}
                      >
                        {progress >= 100 ? 'Complete' : `${Math.round(progress)}%`}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {subject.hoursStudied.toFixed(1)}h
                        </span>
                        <span>of {subject.targetHours}h target</span>
                      </div>
                    </div>

                    {/* Exam Date */}
                    {subject.upcomingExam && daysUntilExam !== null && (
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                          daysUntilExam <= 7
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : daysUntilExam <= 30
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-white/5 text-white/60 border border-white/10'
                        )}
                      >
                        <Calendar className="size-3.5 shrink-0" />
                        <span>
                          {formatDate(subject.upcomingExam)}
                          {daysUntilExam > 0
                            ? ` — ${daysUntilExam} day${daysUntilExam !== 1 ? 's' : ''} left`
                            : daysUntilExam === 0
                            ? ' — Today!'
                            : ' — Passed'}
                        </span>
                      </div>
                    )}

                    {/* Revision Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40 shrink-0">Revision:</span>
                      <Select
                        value={subject.revisionStatus}
                        onValueChange={(value) => handleRevisionChange(subject.id, value)}
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-7 text-xs border-white/10 bg-white/5 text-white/70 w-auto"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1a2e]">
                          {REVISION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* Add Hours Dialog */}
                      <Dialog
                        open={hoursOpen && hoursSubjectId === subject.id}
                        onOpenChange={(open) => {
                          setHoursOpen(open);
                          if (open) setHoursSubjectId(subject.id);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 gap-1.5 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white text-xs"
                          >
                            <Plus className="size-3" />
                            Add Hours
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-white/10 bg-[#1a1a2e] sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-white">Add Study Hours</DialogTitle>
                            <DialogDescription className="text-white/50">
                              Log study hours for {subject.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/80">Hours to add</label>
                              <div className="flex gap-2">
                                {[0.5, 1, 2, 3, 5, 8].map((h) => (
                                  <button
                                    key={h}
                                    onClick={() => setHoursToAdd(h)}
                                    className={cn(
                                      'flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all',
                                      hoursToAdd === h
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                                    )}
                                  >
                                    {h}h
                                  </button>
                                ))}
                              </div>
                              <Input
                                type="number"
                                min={0.5}
                                max={8}
                                step={0.5}
                                value={hoursToAdd}
                                onChange={(e) => setHoursToAdd(Number(e.target.value))}
                                className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              onClick={() => setHoursOpen(false)}
                              className="text-white/60 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddHours}
                              disabled={hoursToAdd <= 0 || hoursToAdd > 8}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Add {hoursToAdd}h
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Set Exam Dialog */}
                      <Dialog
                        open={examOpen && examSubjectId === subject.id}
                        onOpenChange={(open) => {
                          setExamOpen(open);
                          if (open) {
                            setExamSubjectId(subject.id);
                            setExamDate(subject.upcomingExam || '');
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 gap-1.5 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white text-xs"
                          >
                            <Calendar className="size-3" />
                            {subject.upcomingExam ? 'Edit Exam' : 'Set Exam'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-white/10 bg-[#1a1a2e] sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-white">Set Exam Date</DialogTitle>
                            <DialogDescription className="text-white/50">
                              Set the upcoming exam for {subject.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/80">Exam Date</label>
                              <Input
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="border-white/10 bg-white/5 text-white [color-scheme:dark]"
                              />
                            </div>
                            {subject.upcomingExam && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  updateSubject(subject.id, { upcomingExam: '' });
                                  setExamDate('');
                                  setExamOpen(false);
                                }}
                                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                              >
                                <Trash2 className="size-3" />
                                Remove Exam Date
                              </Button>
                            )}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="ghost"
                              onClick={() => setExamOpen(false)}
                              className="text-white/60 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSetExam}
                              disabled={!examDate}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Save Date
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white/30 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        onClick={() => deleteSubject(subject.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
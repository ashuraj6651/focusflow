'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  CalendarDays,
  Filter,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';

import { cn, formatDate, getToday } from '@/lib/utils';
import { TASK_COLORS } from '@/lib/types';
import { type Task, type Priority, type TaskCategory } from '@/lib/types';
import { useTaskStore } from '@/stores/taskStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Constants ──────────────────────────────────────────────
const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'study', label: 'Study' },
  { value: 'revision', label: 'Revision' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam', label: 'Exam' },
  { value: 'project', label: 'Project' },
  { value: 'notes', label: 'Notes' },
];

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'low', label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'name', label: 'Name' },
] as const;

const priorityWeight: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// ── Helper: date ↔ string ─────────────────────────────────
function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}
function toDate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

// ── Sortable Task Card ────────────────────────────────────
function SortableTaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = PRIORITIES.find((p) => p.value === task.priority)!;
  const categoryLabel = CATEGORIES.find((c) => c.value === task.category)?.label ?? task.category;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'group relative flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-4 transition-colors',
        'hover:bg-white/[0.07] hover:border-white/[0.12]',
        isDragging && 'z-50 shadow-2xl shadow-purple-500/10 opacity-90',
        task.completed && 'opacity-60'
      )}
    >
      {/* Color indicator */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: task.color }}
      />

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab text-white/20 hover:text-white/50 transition-colors active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={cn(
              'font-medium text-sm text-white/90 truncate',
              task.completed && 'line-through text-white/40'
            )}
          >
            {task.title}
          </h3>
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityInfo.color)}>
            {priorityInfo.label}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-400 border-purple-500/20"
          >
            {categoryLabel}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-white/40 mt-1 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-white/35">
          {task.subject && (
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {task.subject}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatDate(task.dueDate)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
          <Pencil className="size-3.5 text-white/50 hover:text-purple-400" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={onDelete}>
          <Trash2 className="size-3.5 text-white/50 hover:text-red-400" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Task Dialog Form ──────────────────────────────────────
interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  subject: string;
  category: TaskCategory;
  color: string;
}

function TaskDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Task | null;
  onSave: (data: TaskFormData) => void;
}) {
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: getToday(),
    subject: '',
    category: 'study',
    color: TASK_COLORS[0],
  });

  const isEditing = !!initial;

  // Sync form when initial changes
  const handleOpen = useCallback(
    (v: boolean) => {
      if (v && initial) {
        setForm({
          title: initial.title,
          description: initial.description,
          priority: initial.priority,
          dueDate: initial.dueDate,
          subject: initial.subject,
          category: initial.category,
          color: initial.color,
        });
      } else if (v) {
        setForm({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: getToday(),
          subject: '',
          category: 'study',
          color: TASK_COLORS[0],
        });
      }
      onOpenChange(v);
    },
    [initial, onOpenChange]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    handleOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.08] rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white/90">
            {isEditing ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
          <DialogDescription className="text-white/40">
            {isEditing ? 'Update the task details below.' : 'Fill in the details for your new task.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-white/40 text-xs">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="What do you need to do?"
              className="bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-white/25"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-white/40 text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Add more details..."
              className="bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-white/25 min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/40 text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
              >
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/90 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.06]">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-white/80 focus:bg-white/10 focus:text-white">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/40 text-xs">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as TaskCategory }))}
              >
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/90 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.06]">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-white/80 focus:bg-white/10 focus:text-white">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/40 text-xs">Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="bg-white/[0.03] border-white/[0.06] text-white/90 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/40 text-xs">Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Mathematics"
                className="bg-white/[0.03] border-white/[0.06] text-white/90 placeholder:text-white/25"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-white/40 text-xs">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {TASK_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn(
                    'size-7 rounded-full transition-all',
                    form.color === color
                      ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#1a1a2e] scale-110'
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpen(false)}
              className="border-white/[0.06] text-white/40 hover:text-white/90 hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.title.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              {isEditing ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────
export default function StudyPlanner() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, reorderTasks } = useTaskStore();

  // UI state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewTab, setViewTab] = useState('daily');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Dates that have tasks
  const taskDateSet = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach((t) => s.add(t.dueDate));
    return s;
  }, [tasks]);

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // Date filter based on view
    if (selectedDate) {
      const dateStr = toDateStr(selectedDate);
      if (viewTab === 'daily') {
        list = list.filter((t) => t.dueDate === dateStr);
      } else if (viewTab === 'weekly') {
        const sel = new Date(dateStr);
        const startOfWeek = new Date(sel);
        startOfWeek.setDate(sel.getDate() - sel.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const startStr = toDateStr(startOfWeek);
        const endStr = toDateStr(endOfWeek);
        list = list.filter((t) => t.dueDate >= startStr && t.dueDate <= endStr);
      } else if (viewTab === 'monthly') {
        const sel = new Date(dateStr);
        const prefix = format(sel, 'yyyy-MM');
        list = list.filter((t) => t.dueDate.startsWith(prefix));
      }
    }

    // Category filter
    if (filterCategory !== 'all') {
      list = list.filter((t) => t.category === filterCategory);
    }
    // Priority filter
    if (filterPriority !== 'all') {
      list = list.filter((t) => t.priority === filterPriority);
    }
    // Status filter
    if (filterStatus === 'completed') {
      list = list.filter((t) => t.completed);
    } else if (filterStatus === 'pending') {
      list = list.filter((t) => !t.completed);
    }

    // Sort
    list.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      if (sortBy === 'date') return a.dueDate.localeCompare(b.dueDate);
      if (sortBy === 'priority') return priorityWeight[a.priority] - priorityWeight[b.priority];
      return a.title.localeCompare(b.title);
    });

    return list;
  }, [tasks, selectedDate, viewTab, filterCategory, filterPriority, filterStatus, sortBy]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (filterCategory !== 'all') return { All: filteredTasks };
    const map: Record<string, Task[]> = {};
    filteredTasks.forEach((t) => {
      const label = CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category;
      (map[label] ??= []).push(t);
    });
    return map;
  }, [filteredTasks, filterCategory]);

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(String(active.id), String(over.id));
    }
  };

  const handleSave = (data: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
      setEditingTask(null);
    } else {
      addTask(data);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  // Day with task modifier for calendar
  const modifiers = {
    hasTask: (date: Date) => taskDateSet.has(toDateStr(date)),
  };
  const modifiersStyles = {
    hasTask: {
      fontWeight: 'bold' as const,
      backgroundColor: 'rgba(124, 58, 237, 0.25)',
      borderRadius: '50%',
    },
  };

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="size-6 text-purple-400" />
            Study Planner
          </h1>
          <p className="mt-1 text-sm text-white/35">
            Organize your study tasks and stay on track
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            setDialogOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
        >
          <Plus className="size-4" />
          Add Task
        </Button>
      </div>

      {/* View Tabs */}
      <Tabs value={viewTab} onValueChange={setViewTab}>
        <TabsList className="bg-white/[0.03] border border-white/[0.06]">
          {['daily', 'weekly', 'monthly'].map((v) => (
            <TabsTrigger
              key={v}
              value={v}
              className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-300 text-white/35"
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Column: Calendar + Filters */}
        <div className="space-y-4">
          {/* Calendar */}
          <GlassCard noPadding className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="bg-transparent border-0 p-0 [--cell-size:2rem] text-white/70"
              classNames={{
                months: 'flex flex-col',
                month: 'space-y-2',
                nav: 'space-x-1',
                button_previous: 'text-white/50 hover:text-white/80 hover:bg-white/10',
                button_next: 'text-white/50 hover:text-white/80 hover:bg-white/10',
                month_caption: 'text-white/70',
                caption_label: 'text-white/80',
                weekdays: 'text-white/30',
                weekday: 'text-white/30 text-[0.7rem]',
                week: 'mt-1',
                day: 'text-white/60',
                today: 'bg-purple-500/20 text-purple-300 rounded-md',
                outside: 'text-white/20 opacity-50',
              }}
            />
          </GlassCard>

          {/* Filters */}
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <Filter className="size-4 text-purple-400" />
              Filters & Sort
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/80 w-full text-xs h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.06]">
                    <SelectItem value="all" className="text-white/80">All Categories</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-white/80">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs">Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/80 w-full text-xs h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.06]">
                    <SelectItem value="all" className="text-white/80">All Priorities</SelectItem>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-white/80">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/80 w-full text-xs h-8">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.06]">
                    <SelectItem value="all" className="text-white/80">All</SelectItem>
                    <SelectItem value="pending" className="text-white/80">Pending</SelectItem>
                    <SelectItem value="completed" className="text-white/80">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/80 w-full text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.06]">
                    {SORT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-white/80">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="text-center p-3">
              <div className="text-xl font-bold text-purple-400">
                {tasks.filter((t) => !t.completed).length}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">Pending</div>
            </GlassCard>
            <GlassCard className="text-center p-3">
              <div className="text-xl font-bold text-green-400">
                {tasks.filter((t) => t.completed).length}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">Completed</div>
            </GlassCard>
          </div>
        </div>

        {/* Right Column: Task List */}
        <div className="space-y-4">
          {/* Task count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </span>
            {selectedDate && (
              <span className="text-white/30 text-xs">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Task groups */}
          {Object.keys(grouped).length === 0 ? (
            <GlassCard className="text-center py-12">
              <CalendarDays className="size-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No tasks for this period</p>
              <p className="text-white/20 text-xs mt-1">Click &quot;Add Task&quot; to get started</p>
            </GlassCard>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {Object.entries(grouped).map(([category, catTasks]) => (
                <div key={category} className="mb-6 last:mb-0">
                  {filterCategory === 'all' && Object.keys(grouped).length > 1 && (
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/5" />
                      {category}
                      <span className="text-white/25 font-normal">
                        ({catTasks.length})
                      </span>
                      <div className="h-px flex-1 bg-white/5" />
                    </h3>
                  )}
                  <SortableContext
                    items={catTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {catTasks.map((task) => (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTask(task.id)}
                            onEdit={() => handleEdit(task)}
                            onDelete={() => deleteTask(task.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </div>
              ))}
            </DndContext>
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        initial={editingTask}
        onSave={handleSave}
      />
    </div>
  );
}
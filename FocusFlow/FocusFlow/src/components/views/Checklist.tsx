'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  CheckSquare,
  Search,
  ListTodo,
  Clock,
  ListChecks,
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

import { cn } from '@/lib/utils';
import { type ChecklistItem } from '@/lib/types';
import { useChecklistStore } from '@/stores/checklistStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ── Sortable Checklist Item ────────────────────────────────
function SortableChecklistItem({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onEdit: (newText: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startEditing = useCallback(() => {
    setEditText(item.text);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [item.text]);

  const handleSave = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed) {
      onEdit(trimmed);
    } else {
      setEditText(item.text);
    }
    setIsEditing(false);
  }, [editText, item.text, onEdit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(item.text);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 transition-colors',
        'hover:bg-white/[0.07] hover:border-white/15',
        isDragging && 'z-50 shadow-2xl shadow-purple-500/10 opacity-90'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-white/15 hover:text-white/40 transition-colors active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Checkbox */}
      <div className="shrink-0">
        <Checkbox
          checked={item.completed}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
        />
      </div>

      {/* Text or Edit Input */}
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8 bg-white/10 border-purple-500/30 text-white/90 text-sm"
        />
      ) : (
        <motion.span
          className={cn(
            'flex-1 text-sm transition-colors',
            item.completed ? 'line-through text-white/30' : 'text-white/80'
          )}
          layout
        >
          {item.text}
        </motion.span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={startEditing}
          >
            <Pencil className="size-3.5 text-white/50 hover:text-purple-400" />
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <Trash2 className="size-3.5 text-white/50 hover:text-red-400" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#1a1a2e]/95 backdrop-blur-xl border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white/90">Delete this item?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/40">
                This action cannot be undone. The checklist item will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

// ── Stats Card ─────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <div
        className="flex items-center justify-center size-10 rounded-xl shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="size-5" style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-bold text-white/90">{value}</div>
        <div className="text-[11px] text-white/40">{label}</div>
      </div>
    </GlassCard>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function Checklist() {
  const { items, addItem, updateItem, deleteItem, toggleItem, reorderItems, getTodayItems } =
    useChecklistStore();

  // UI state
  const [newItemText, setNewItemText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Stats
  const completedCount = useMemo(() => items.filter((i) => i.completed).length, [items]);
  const pendingCount = useMemo(() => items.filter((i) => !i.completed).length, [items]);
  const todayCount = useMemo(() => getTodayItems().length, [items, getTodayItems]);
  const percentage = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((completedCount / items.length) * 100);
  }, [items.length, completedCount]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let list = [...items];

    // Tab filter
    if (filterTab === 'pending') {
      list = list.filter((i) => !i.completed);
    } else if (filterTab === 'completed') {
      list = list.filter((i) => i.completed);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.text.toLowerCase().includes(q));
    }

    return list;
  }, [items, filterTab, searchQuery]);

  // Handlers
  const handleAddItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    addItem(text);
    setNewItemText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderItems(String(active.id), String(over.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white/90 flex items-center gap-2">
          <CheckSquare className="size-6 text-purple-400" />
          Checklist
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Track your daily tasks and stay productive
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="Today's Tasks"
          value={todayCount}
          color="#7C3AED"
        />
        <StatCard
          icon={ListTodo}
          label="Pending"
          value={pendingCount}
          color="#F59E0B"
        />
        <StatCard
          icon={ListChecks}
          label="Completed"
          value={completedCount}
          color="#10B981"
        />
      </div>

      {/* Progress Bar */}
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60 font-medium">Progress</span>
          <span className="text-white/50 text-xs">
            {completedCount} of {items.length} tasks completed ({percentage}%)
          </span>
        </div>
        <div className="relative">
          <Progress
            value={percentage}
            className="h-3 bg-white/5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-purple-600 [&>[data-slot=progress-indicator]]:to-purple-400 [&>[data-slot=progress-indicator]]:transition-all [&>[data-slot=progress-indicator]]:duration-500"
          />
          {percentage === 100 && items.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 size-5 rounded-full bg-green-500 flex items-center justify-center"
            >
              <span className="text-[10px] text-white font-bold">✓</span>
            </motion.div>
          )}
        </div>
      </GlassCard>

      {/* Add Item Input */}
      <GlassCard className="flex items-center gap-3 p-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 pointer-events-none" />
          <Input
            ref={inputRef}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new item..."
            className="pl-9 h-10 bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 text-sm"
          />
        </div>
        <Button
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          className="bg-purple-600 hover:bg-purple-500 text-white shrink-0"
          size="icon"
        >
          <Plus className="size-4" />
        </Button>
      </GlassCard>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full sm:w-auto">
          <TabsList className="bg-white/5 border border-white/10">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-300 text-white/50 text-xs"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="pl-9 h-8 bg-white/5 border-white/10 text-white/90 placeholder:text-white/25 text-xs"
          />
        </div>

        {searchQuery && (
          <Badge
            variant="outline"
            className="text-[10px] text-purple-400 border-purple-500/20 bg-purple-500/10 shrink-0"
          >
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <GlassCard className="text-center py-16">
            <CheckSquare className="size-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">
              {searchQuery
                ? 'No items match your search'
                : filterTab === 'completed'
                  ? 'No completed items yet'
                  : filterTab === 'pending'
                    ? 'All caught up!'
                    : 'Your checklist is empty'}
            </p>
            <p className="text-white/20 text-xs mt-1">
              {!searchQuery && filterTab === 'all' && 'Add your first item above'}
            </p>
          </GlassCard>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <SortableChecklistItem
                      key={item.id}
                      item={item}
                      onToggle={() => toggleItem(item.id)}
                      onEdit={(newText) => updateItem(item.id, newText)}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
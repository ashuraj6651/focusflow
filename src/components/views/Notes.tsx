'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Star,
  Edit3,
  Trash2,
  StickyNote,
  Eye,
  FileText,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { GlassCard } from '@/components/shared/GlassCard';
import { useNotesStore } from '@/stores/notesStore';
import { NOTE_COLORS } from '@/lib/types';
import { cn, getRelativeTime } from '@/lib/utils';

const NOTE_COLOR_MAP: Record<string, string> = {
  default: 'bg-white/[0.03] border-white/[0.06]',
  purple: 'bg-purple-500/[0.08] border-purple-500/[0.12]',
  pink: 'bg-pink-500/[0.08] border-pink-500/[0.12]',
  blue: 'bg-blue-500/[0.08] border-blue-500/[0.12]',
  green: 'bg-green-500/[0.08] border-green-500/[0.12]',
  yellow: 'bg-yellow-500/[0.08] border-yellow-500/[0.12]',
  orange: 'bg-orange-500/[0.08] border-orange-500/[0.12]',
  red: 'bg-red-500/[0.08] border-red-500/[0.12]',
};

const NOTE_BORDER_MAP: Record<string, string> = {
  default: 'border-l-white/20',
  purple: 'border-l-purple-500',
  pink: 'border-l-pink-500',
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  yellow: 'border-l-yellow-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
};

const COLOR_DOT_MAP: Record<string, string> = {
  default: 'bg-white/40',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

type FilterTab = 'all' | 'pinned' | 'favorites';

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote, togglePin, toggleFavorite } = useNotesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Create/Edit dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('default');
  const [showPreview, setShowPreview] = useState(false);

  // Auto-save debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'pinned' && note.pinned) ||
      (activeFilter === 'favorites' && note.favorite);
    return matchesSearch && matchesFilter;
  });

  // Sort: pinned first, then by updatedAt
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const openCreateDialog = () => {
    setEditNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('default');
    setShowPreview(false);
    setCreateOpen(true);
  };

  const openEditDialog = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    setEditNoteId(noteId);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color);
    setShowPreview(false);
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    if (editNoteId) {
      updateNote(editNoteId, {
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent,
        color: noteColor,
      });
    } else {
      addNote(noteTitle.trim() || 'Untitled Note', noteContent, noteColor);
    }
    setCreateOpen(false);
  };

  // Auto-save during editing
  const debouncedSave = useCallback(
    (title: string, content: string, color: string, id: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNote(id, {
          title: title.trim() || 'Untitled Note',
          content,
          color,
        });
      }, 2000);
    },
    [updateNote]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleEditChange = (field: 'title' | 'content', value: string) => {
    if (field === 'title') setNoteTitle(value);
    else setNoteContent(value);

    if (editNoteId) {
      const title = field === 'title' ? value : noteTitle;
      const content = field === 'content' ? value : noteContent;
      debouncedSave(title, content, noteColor, editNoteId);
    }
  };

  const handleColorChange = (color: string) => {
    setNoteColor(color);
    if (editNoteId) {
      debouncedSave(noteTitle, noteContent, color, editNoteId);
    }
  };

  const handleBlur = () => {
    if (editNoteId) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateNote(editNoteId, {
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent,
        color: noteColor,
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notes</h1>
          <p className="mt-1 text-sm text-white/35">Capture ideas, summaries, and key concepts</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          <Plus className="size-4" />
          New Note
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
          {(['all', 'pinned', 'favorites'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all capitalize',
                activeFilter === tab
                  ? 'bg-purple-600/20 text-purple-400 shadow-sm'
                  : 'text-white/35 hover:text-white/80 hover:bg-white/[0.03]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {sortedNotes.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/5 mb-4">
            <StickyNote className="size-8 text-white/20" />
          </div>
          <p className="text-white/40 text-lg font-medium">
            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
          </p>
          <p className="text-white/20 text-sm mt-1">
            {notes.length === 0
              ? 'Create your first note to capture your thoughts'
              : 'Try adjusting your search or filter'}
          </p>
        </GlassCard>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedNotes.map((note, index) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="break-inside-avoid"
              >
                <div
                  className={cn(
                    'rounded-2xl border border-l-4 p-4 backdrop-blur-xl transition-all hover:border-white/20 group',
                    NOTE_COLOR_MAP[note.color] || NOTE_COLOR_MAP.default,
                    NOTE_BORDER_MAP[note.color] || NOTE_BORDER_MAP.default
                  )}
                >
                  {/* Note Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => togglePin(note.id)}
                        className={cn(
                          'p-1 rounded-md transition-colors',
                          note.pinned
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-white/30 hover:text-white/60'
                        )}
                      >
                        {note.pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
                      </button>
                      <button
                        onClick={() => toggleFavorite(note.id)}
                        className={cn(
                          'p-1 rounded-md transition-colors',
                          note.favorite
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-white/30 hover:text-white/60'
                        )}
                      >
                        <Star
                          className={cn('size-3.5', note.favorite && 'fill-yellow-400')}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Note Content Preview */}
                  <div className="text-xs text-white/50 line-clamp-4 mb-3 prose prose-invert prose-sm max-w-none">
                    {note.content ? (
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    ) : (
                      <span className="italic">Empty note</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">
                      {getRelativeTime(note.updatedAt)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditDialog(note.id)}
                        className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="size-3" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Pinned indicator */}
                  {note.pinned && (
                    <div className="absolute top-2 right-2">
                      <Pin className="size-3 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) handleBlur();
        setCreateOpen(open);
      }}>
        <DialogContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.08] rounded-3xl sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editNoteId ? 'Edit Note' : 'New Note'}
            </DialogTitle>
            <DialogDescription className="text-white/35">
              {editNoteId
                ? 'Changes are auto-saved as you type'
                : 'Write your note with markdown support'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Title</label>
              <Input
                placeholder="Note title..."
                value={noteTitle}
                onChange={(e) => handleEditChange('title', e.target.value)}
                className="border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/30"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Color</label>
              <div className="flex gap-2 flex-wrap">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      'h-7 px-3 rounded-full border text-xs font-medium transition-all capitalize',
                      NOTE_COLOR_MAP[color] || NOTE_COLOR_MAP.default,
                      noteColor === color
                        ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-[#1a1a2e]'
                        : 'hover:opacity-80'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block size-2 rounded-full mr-1.5',
                        COLOR_DOT_MAP[color] || COLOR_DOT_MAP.default
                      )}
                    />
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Content with Preview Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/80">Content</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors',
                    showPreview
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'bg-white/[0.03] text-white/35 hover:text-white/80'
                  )}
                >
                  {showPreview ? (
                    <>
                      <Edit3 className="size-3" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="size-3" />
                      Preview
                    </>
                  )}
                </button>
              </div>

              {showPreview ? (
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/80 prose prose-invert prose-sm max-w-none">
                  {noteContent ? (
                    <ReactMarkdown>{noteContent}</ReactMarkdown>
                  ) : (
                    <span className="italic text-white/30">Nothing to preview</span>
                  )}
                </div>
              ) : (
                <Textarea
                  placeholder="Write your note here... (Markdown supported)"
                  value={noteContent}
                  onChange={(e) => handleEditChange('content', e.target.value)}
                  onBlur={handleBlur}
                  className="min-h-[200px] max-h-[400px] border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/30 resize-none"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                handleBlur();
                setCreateOpen(false);
              }}
              className="text-white/40 hover:text-white"
            >
              Cancel
            </Button>
            {!editNoteId && (
              <Button
                onClick={handleSave}
                disabled={!noteTitle.trim() && !noteContent.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Save Note
              </Button>
            )}
            {editNoteId && (
              <span className="text-xs text-white/30 flex items-center gap-1.5">
                <FileText className="size-3" />
                Auto-saved
              </span>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useTaskStore } from '@/stores/taskStore';
import { useChecklistStore } from '@/stores/checklistStore';
import { useSubjectStore } from '@/stores/subjectStore';
import { useNotesStore } from '@/stores/notesStore';
import { useGoalStore } from '@/stores/goalsStore';
import { useHabitStore } from '@/stores/habitStore';
import { useExamStore } from '@/stores/examStore';
import { useAppStore } from '@/stores/appStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';

// ---------------------------------------------------------------------------
// Central registry mapping each store's localStorage key -> the Zustand
// store instance (hook). Keys match STORES[].storeKey in src/lib/sync.ts.
//
// Why this file exists:
// Zustand's `persist` middleware keeps a live copy of state in memory in
// addition to the copy in localStorage. Clearing/overwriting localStorage
// (e.g. on sign-in/sign-out, or when Firestore pushes remote data down)
// does NOT automatically update that in-memory copy. Without the helpers
// below, a previous user's data can stay visible in the UI after switching
// accounts, and can even get re-synced into the new user's Firestore data.
// ---------------------------------------------------------------------------

interface PersistCapableStore {
  getInitialState: () => unknown;
  setState: (state: unknown, replace?: boolean) => void;
  persist: { rehydrate: () => unknown };
}

export const STORE_REGISTRY: Record<string, PersistCapableStore> = {
  'focusflow-tasks': useTaskStore as unknown as PersistCapableStore,
  'focusflow-checklist': useChecklistStore as unknown as PersistCapableStore,
  'focusflow-subjects': useSubjectStore as unknown as PersistCapableStore,
  'focusflow-notes': useNotesStore as unknown as PersistCapableStore,
  'focusflow-goals': useGoalStore as unknown as PersistCapableStore,
  'focusflow-habits': useHabitStore as unknown as PersistCapableStore,
  'focusflow-exams': useExamStore as unknown as PersistCapableStore,
  'focusflow-app': useAppStore as unknown as PersistCapableStore,
  'focusflow-pomodoro': usePomodoroStore as unknown as PersistCapableStore,
};

/**
 * Reset every store back to its initial (empty) in-memory state.
 * Must be called on sign-in AND sign-out so one account's data can never
 * leak into another account, regardless of what's happening in localStorage
 * or Firestore at the time.
 */
export function resetAllStoresInMemory(): void {
  Object.values(STORE_REGISTRY).forEach((store) => {
    try {
      store.setState(store.getInitialState(), true);
    } catch {
      // ignore individual store failures, don't block the others
    }
  });
}

/**
 * Force a given store to re-read its (freshly written) localStorage value
 * back into memory, so remote Firestore updates actually reach the UI.
 */
export function rehydrateStore(storeKey: string): void {
  const store = STORE_REGISTRY[storeKey];
  try {
    store?.persist?.rehydrate();
  } catch {
    // ignore
  }
}

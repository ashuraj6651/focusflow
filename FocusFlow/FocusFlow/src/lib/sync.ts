'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseDb, isFirebaseReady } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  query,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Store descriptor
// ---------------------------------------------------------------------------
interface StoreDesc {
  storeKey: string;
  collectionPath: string;
  stateField: string;
  isSingleton: boolean;
}

const STORES: StoreDesc[] = [
  { storeKey: 'focusflow-tasks', collectionPath: 'tasks', stateField: 'tasks', isSingleton: false },
  { storeKey: 'focusflow-checklist', collectionPath: 'checklists', stateField: 'items', isSingleton: false },
  { storeKey: 'focusflow-subjects', collectionPath: 'subjects', stateField: 'subjects', isSingleton: false },
  { storeKey: 'focusflow-notes', collectionPath: 'notes', stateField: 'notes', isSingleton: false },
  { storeKey: 'focusflow-goals', collectionPath: 'goals', stateField: 'goals', isSingleton: false },
  { storeKey: 'focusflow-habits', collectionPath: 'habits', stateField: 'habits', isSingleton: false },
  { storeKey: 'focusflow-exams', collectionPath: 'exams', stateField: 'exams', isSingleton: false },
  { storeKey: 'focusflow-app', collectionPath: 'settings', stateField: 'settings', isSingleton: true },
  { storeKey: 'focusflow-pomodoro', collectionPath: 'pomodoro', stateField: 'sessions', isSingleton: false },
];

// ---------------------------------------------------------------------------
// Write a store's data to Firestore
// ---------------------------------------------------------------------------
async function writeStoreToFirestore(uid: string, desc: StoreDesc, data: unknown) {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    if (desc.isSingleton) {
      await setDoc(
        doc(db, "users", uid, desc.collectionPath, "app"),
        data as DocumentData,
        { merge: true }
      );
    } else {
      const basePath = `users/${uid}/${desc.collectionPath}`;
      const items = data as Record<string, unknown>[];
      if (!Array.isArray(items) || items.length === 0) return;
      const batch = writeBatch(db);
      const colRef = collection(db, basePath);
      for (const item of items) {
        if (item && typeof item === 'object' && 'id' in item) {
          batch.set(doc(colRef, item.id as string), item as DocumentData, { merge: true });
        }
      }
      await batch.commit();
    }
  } catch (err) {
    console.error(`[FocusFlow] Firestore write error (${desc.storeKey}):`, err);
  }
}

// ---------------------------------------------------------------------------
// Read from Firestore → write into localStorage → Zustand picks it up
// ---------------------------------------------------------------------------
function writeLocalFromRemote(storeKey: string, stateField: string, data: unknown) {
  try {
    const raw = localStorage.getItem(storeKey);
    const parsed = raw ? JSON.parse(raw) : { version: 0 };
    parsed.state = { ...parsed.state, [stateField]: data };
    localStorage.setItem(storeKey, JSON.stringify(parsed));
    // Force Zustand to re-read from localStorage
    window.dispatchEvent(new StorageEvent('storage', { key: storeKey }));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Migration utilities
// ---------------------------------------------------------------------------
export function captureLocalStorage(): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (typeof window === 'undefined') return payload;
  for (const desc of STORES) {
    const raw = localStorage.getItem(desc.storeKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        payload[desc.storeKey] = parsed?.state?.[desc.stateField];
      } catch { /* skip */ }
    }
  }
  return payload;
}

export async function migrateToCloud(uid: string, payload: Record<string, unknown>): Promise<void> {
  for (const desc of STORES) {
    const data = payload[desc.storeKey];
    if (data === undefined || data === null) continue;
    try {
      await writeStoreToFirestore(uid, desc, data);
      console.log(`[FocusFlow] Migrated ${desc.storeKey}`);
    } catch (err) {
      console.error(`[FocusFlow] Migration error (${desc.storeKey}):`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// SyncManager component – sets up real-time Firestore listeners + local polling
// ---------------------------------------------------------------------------
export function SyncManager() {
  const { user, isSignedIn } = useAuth();
  const unsubsRef = useRef<Map<string, Unsubscribe>>(new Map());
  const lastHashesRef = useRef<Record<string, string>>({});

  // Set up Firestore listeners when user signs in, tear down on sign out
  useEffect(() => {
    const db = getFirebaseDb();
    const uid = user?.uid;

    if (!db || !uid || !isSignedIn || !isFirebaseReady()) {
      // Tear down all listeners
      unsubsRef.current.forEach((unsub) => unsub());
      unsubsRef.current.clear();
      return;
    }

    const unsubs = unsubsRef.current;

    for (const desc of STORES) {
      const basePath = `users/${uid}/${desc.collectionPath}`;

      if (desc.isSingleton) {
        const unsub = onSnapshot(
          doc(db, "users", uid, desc.collectionPath, "app"),
          (snap) => {
            if (!snap.exists()) return;
            writeLocalFromRemote(desc.storeKey, desc.stateField, snap.data());
          },
          (err) => console.error(`[FocusFlow] Snapshot error (${desc.storeKey}):`, err)
        );
        unsubs.set(desc.storeKey, unsub);
      } else {
        const unsub = onSnapshot(
          query(collection(db, basePath)),
          (snap) => {
            const items = snap.docs.map((d) => d.data());
            writeLocalFromRemote(desc.storeKey, desc.stateField, items);
          },
          (err) => console.error(`[FocusFlow] Snapshot error (${desc.storeKey}):`, err)
        );
        unsubs.set(desc.storeKey, unsub);
      }
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubs.clear();
    };
  }, [user?.uid, isSignedIn]);

  // Poll localStorage every 2s and push changes to Firestore
  useEffect(() => {
    if (!user?.uid || !isSignedIn || !isFirebaseReady()) return;

    const uid = user.uid;
    const pollId = setInterval(() => {
      for (const desc of STORES) {
        try {
          const raw = localStorage.getItem(desc.storeKey);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          const data = parsed?.state?.[desc.stateField];
          const hash = JSON.stringify(data);
          if (hash === lastHashesRef.current[desc.storeKey]) continue;
          lastHashesRef.current[desc.storeKey] = hash;
          writeStoreToFirestore(uid, desc, data);
        } catch {
          // ignore parse errors during polling
        }
      }
    }, 2000);

    return () => clearInterval(pollId);
  }, [user?.uid, isSignedIn]);

  return null;
}
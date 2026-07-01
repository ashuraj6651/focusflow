'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  type Auth,
} from 'firebase/auth';
import { isFirebaseReady, getFirebaseAuth } from '@/lib/firebase';

const GUEST_KEY = 'focusflow-guest';

interface AuthContextValue {
  user: User | null;
  isGuest: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  firebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseConfigured = isFirebaseReady();
  const authInstance = firebaseConfigured ? getFirebaseAuth() : null;

  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Restore guest session on mount
  useEffect(() => {
    if (sessionStorage.getItem(GUEST_KEY) === 'true') {
      setIsGuest(true);
    }
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    if (!firebaseConfigured || !authInstance) {
      setIsInitializing(false);
      setIsGuest(true);
      sessionStorage.setItem(GUEST_KEY, 'true');
      return;
    }

    const unsub = onAuthStateChanged(authInstance as Auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsGuest(false);
        sessionStorage.removeItem(GUEST_KEY);
      } else {
        setIsGuest(sessionStorage.getItem(GUEST_KEY) === 'true');
      }
      setIsInitializing(false);
    });

    return () => unsub();
  }, [firebaseConfigured, authInstance]);

  const clearFocusFlowData = useCallback(() => {
    if (typeof window === 'undefined') return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('focusflow-')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  }, []);

  const migrateLocalToCloud = useCallback(async (uid: string) => {
    try {
      const { captureLocalStorage, migrateToCloud } = await import('@/lib/sync');
      const payload = captureLocalStorage();
      await migrateToCloud(uid, payload);
    } catch (err) {
      console.error('[FocusFlow] Migration error:', err);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseConfigured || !authInstance) return;
    setIsLoading(true);
    try {
      const { GoogleAuthProvider } = await import('firebase/auth');
      const result = await signInWithPopup(authInstance as Auth, new GoogleAuthProvider());
      setIsGuest(false);
      sessionStorage.removeItem(GUEST_KEY);
      // Migrate local data to cloud for new sign-in
      if (result.user) {
        await migrateLocalToCloud(result.user.uid);
      }
    } catch (err) {
      console.error('[FocusFlow] Google sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseConfigured, authInstance, migrateLocalToCloud]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!firebaseConfigured || !authInstance) return;
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(authInstance as Auth, email, password);
      setIsGuest(false);
      sessionStorage.removeItem(GUEST_KEY);
      if (result.user) {
        await migrateLocalToCloud(result.user.uid);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firebaseConfigured, authInstance, migrateLocalToCloud]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!firebaseConfigured || !authInstance) return;
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(authInstance as Auth, email, password);
      setIsGuest(false);
      sessionStorage.removeItem(GUEST_KEY);
      if (result.user) {
        await migrateLocalToCloud(result.user.uid);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firebaseConfigured, authInstance, migrateLocalToCloud]);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    sessionStorage.setItem(GUEST_KEY, 'true');
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      if (firebaseConfigured && authInstance && user) {
        await firebaseSignOut(authInstance as Auth);
      }
    } catch (err) {
      console.error('[FocusFlow] Sign-out error:', err);
    } finally {
      setUser(null);
      setIsGuest(false);
      sessionStorage.removeItem(GUEST_KEY);
      clearFocusFlowData();
      setIsLoading(false);
    }
  }, [firebaseConfigured, authInstance, user, clearFocusFlowData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isInitializing,
        isLoading,
        isSignedIn: !!user,
        firebaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        continueAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
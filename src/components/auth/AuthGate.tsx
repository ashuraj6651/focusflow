'use client';

import { useState, type ReactNode } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function AuthGate({ children }: { children: ReactNode }) {
  const {
    isInitializing, user, isGuest, firebaseConfigured,
    isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, continueAsGuest,
  } = useAuth();

  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-purple-900/40 via-background to-purple-900/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-sm text-muted-foreground">Loading FocusFlow…</p>
        </div>
      </div>
    );
  }

  if (user || isGuest) return <>{children}</>;

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try { await signInWithGoogle(); }
    catch { setError('Google sign-in failed. Please try again.'); }
    finally { setBusy(false); }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setBusy(true);
    try {
      if (isSignUp) await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) setError('Invalid email or password.');
      else if (msg.includes('email-already-in-use')) setError('This email is already registered. Try signing in.');
      else if (msg.includes('weak-password')) setError('Password must be at least 6 characters.');
      else if (msg.includes('invalid-email')) setError('Please enter a valid email address.');
      else setError(msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-purple-900/40 via-background to-purple-900/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-lg w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
            FocusFlow
          </h1>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            {firebaseConfigured
              ? 'Sign in to sync across devices, or continue as guest.'
              : 'Welcome! Continue as a guest to get started.'}
          </p>
        </div>

        {firebaseConfigured && !showEmail ? (
          <>
            <Button
              onClick={handleGoogle}
              disabled={isLoading || busy}
              className="w-full gap-2 bg-white text-black hover:bg-white/90 h-11 rounded-xl font-medium"
            >
              {(isLoading || busy) ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in with Google
            </Button>
            <div className="flex items-center gap-3 w-full">
              <Separator className="flex-1 bg-white/10" />
              <span className="text-xs text-white/30">or</span>
              <Separator className="flex-1 bg-white/10" />
            </div>
            <Button
              onClick={() => setShowEmail(true)}
              variant="outline"
              className="w-full gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 h-11 rounded-xl"
            >
              <Mail className="h-4 w-4" />
              Sign in with Email
            </Button>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <Button variant="ghost" onClick={continueAsGuest} className="text-white/40 hover:text-white/60 text-sm">
              Continue as Guest →
            </Button>
          </>
        ) : firebaseConfigured && showEmail ? (
          <form onSubmit={handleEmail} className="w-full space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={6} />
            </div>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <Button type="submit" disabled={isLoading || busy} className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white h-11 rounded-xl">
              {(isLoading || busy) ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
            <p className="text-xs text-white/40 text-center">
              {isSignUp ? (
                <>Already have an account? <button type="button" onClick={() => { setIsSignUp(false); setError(''); }} className="text-purple-400 hover:text-purple-300 underline">Sign in</button></>
              ) : (
                <>Don&apos;t have an account? <button type="button" onClick={() => { setIsSignUp(true); setError(''); }} className="text-purple-400 hover:text-purple-300 underline">Sign up</button></>
              )}
            </p>
            <Button type="button" variant="ghost" onClick={() => { setShowEmail(false); setError(''); }} className="w-full text-white/40 hover:text-white/60 h-8">
              ← Back
            </Button>
          </form>
        ) : (
          <Button onClick={continueAsGuest} className="bg-purple-600 hover:bg-purple-700 text-white px-8">
            Continue as Guest
          </Button>
        )}
      </motion.div>
    </div>
  );
}
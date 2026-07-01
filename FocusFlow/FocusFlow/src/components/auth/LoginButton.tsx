'use client';

import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function LoginButton() {
  const { user, isSignedIn, isLoading, firebaseConfigured, signInWithGoogle, signOut } = useAuth();

  if (!firebaseConfigured) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/40">
        <LogIn className="h-4 w-4" />
        <span>Cloud sync not configured</span>
      </div>
    );
  }

  if (isSignedIn && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/60 truncate max-w-[180px]">{user.email}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          disabled={isLoading}
          className="h-8 text-xs border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <LogOut className="h-3 w-3 mr-1" />}
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={signInWithGoogle}
      disabled={isLoading}
      className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs"
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <LogIn className="h-3 w-3 mr-1" />}
      Sign in with Google
    </Button>
  );
}
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppContent } from '@/components/layout/AppContent';
import { AppFooter } from '@/components/layout/AppFooter';
import { useTheme } from 'next-themes';
import { requestNotificationPermission } from '@/lib/utils';
import { MobileNav } from '@/components/layout/MobileNav';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';
import { SyncManager } from '@/lib/sync';

function AppShell() {
  const { sidebarOpen, settings } = useAppStore();
  const { setTheme } = useTheme();

  useKeyboardShortcuts();

  useEffect(() => {
    setTheme(settings.theme);
    requestNotificationPermission();
  }, [settings.theme, setTheme]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-all duration-300 gradient-bg pb-16 md:pb-0',
          sidebarOpen ? 'md:ml-[260px]' : 'md:ml-[68px]'
        )}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AppContent />
        </div>
        <AppFooter />
      </div>
      <MobileNav />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppShell />
      </AuthGate>
      <SyncManager />
    </AuthProvider>
  );
}
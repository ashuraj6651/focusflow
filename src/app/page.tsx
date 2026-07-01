'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAppStore } from '@/stores/appStore';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppContent } from '@/components/layout/AppContent';
import { AppFooter } from '@/components/layout/AppFooter';
import { useTheme } from 'next-themes';
import { requestNotificationPermission } from '@/lib/utils';
import { MobileNav } from '@/components/layout/MobileNav';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function Home() {
  const { sidebarOpen, settings } = useAppStore();
  const { setTheme } = useTheme();
  const mounted = useIsMounted();

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
          'flex min-h-screen flex-1 flex-col gradient-bg pb-16 md:pb-0',
        )}
        style={mounted ? {
          marginLeft: sidebarOpen ? '280px' : '72px',
          transition: 'margin-left 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
        } : { marginLeft: '280px' }}
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
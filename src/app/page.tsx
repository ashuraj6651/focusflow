'use client';
import { AuthGate } from "@/components/auth/AuthGate";
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
  <AuthGate>
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col gradient-bg pb-16 md:pb-0 transition-all duration-300",
          sidebarOpen ? "md:ml-[280px]" : "md:ml-[72px]"
        )}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AppContent />
        </div>

        <AppFooter />
      </div>

      <MobileNav />
    </div>
  </AuthGate>
);
}
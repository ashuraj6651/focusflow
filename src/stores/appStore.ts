import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ViewType, type AppSettings, DEFAULT_SETTINGS } from '@/lib/types';

interface AppState {
  currentView: ViewType;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  settings: AppSettings;
  setCurrentView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  resetAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'dashboard',
      sidebarOpen: true,
      commandPaletteOpen: false,
      settings: DEFAULT_SETTINGS,
      setCurrentView: (view) => set({ currentView: view }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      resetAllData: () => {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.reload();
        }
      },
    }),
    { name: 'focusflow-app' }
  )
);
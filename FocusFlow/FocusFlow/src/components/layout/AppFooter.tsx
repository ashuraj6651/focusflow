'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { GraduationCap } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="flex h-10 items-center justify-center border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <p className="text-xs text-white/30">
        Made with ❤️ by <span className="font-semibold text-purple-400">ASHU</span>
      </p>
    </footer>
  );
}
'use client';

import { GraduationCap, Cloud } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t border-white/10 px-6 py-3">
  <div className="flex items-center justify-between">

    {/* Left */}
    <div className="flex items-center gap-2 text-xs text-white/40">
      <span>FocusFlow</span>
      <span>•</span>
      <span className="text-emerald-400">Cloud Sync Enabled</span>
    </div>

    {/* Center */}
    <div className="text-xs text-white/40">
      Made with <span className="text-red-500">❤️</span> by{" "}
      <span className="font-semibold text-purple-400">ASHU</span>
    </div>

    {/* Right */}
    <div className="text-xs text-white/30">
      v1.0.0
    </div>

  </div>
</footer>
  );
}
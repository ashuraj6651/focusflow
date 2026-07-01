'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn } from "lucide-react";
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import {
  Palette,
  Timer,
  Volume2,
  Globe,
  Database,
  Info,
  Download,
  Upload,
  Trash2,
  Monitor,
  Sun,
  Moon,
  Maximize,
  Bell,
  Music,
  User,
  Shield,
  Cloud,
  Clock,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/stores/appStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { ACCENT_COLORS } from '@/lib/constants';
import { requestNotificationPermission } from '@/lib/utils';
import { motion } from 'framer-motion';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function Settings() {
  const { settings, updateSettings, resetSettings, resetAllData } = useAppStore();
  const { updateTimerSettings } = usePomodoroStore();
  const { theme, setTheme } = useTheme();

const {
  user,
  signOut,
  signInWithGoogle,
  isLoading,
} = useAuth();
  const mounted = useIsMounted();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (settings.theme && settings.theme !== 'system') {
      setTheme(settings.theme);
    }
  }, [settings.theme, setTheme]);

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    updateSettings({ theme: newTheme });
    setTheme(newTheme);
  };

  const handleAccentColor = (color: string) => {
    updateSettings({ accentColor: color });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary', color);
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const d = max - min;
      let h = 0;
      let s = 0;
      if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      document.documentElement.style.setProperty('--primary-h', `${Math.round(h * 360)}`);
      document.documentElement.style.setProperty('--primary-s', `${Math.round(s * 100)}%`);
      document.documentElement.style.setProperty('--primary-l', `${Math.round(l * 100)}%`);
    }
  };

  const handleTimerSetting = (key: string, value: number) => {
    updateSettings({ [key]: value } as Partial<typeof settings>);
    switch (key) {
      case 'pomodoroFocus':
        updateTimerSettings({ focusDuration: value });
        break;
      case 'pomodoroBreak':
        updateTimerSettings({ breakDuration: value });
        break;
      case 'pomodoroLongBreak':
        updateTimerSettings({ longBreakDuration: value });
        break;
      case 'pomodoroSessionsBeforeLong':
        updateTimerSettings({ sessionsBeforeLong: value });
        break;
    }
  };

  const handleExportData = () => {
    const data = {
      app: localStorage.getItem('focusflow-app'),
      pomodoro: localStorage.getItem('focusflow-pomodoro'),
      tasks: localStorage.getItem('focusflow-tasks'),
      checklist: localStorage.getItem('focusflow-checklist'),
      subjects: localStorage.getItem('focusflow-subjects'),
      notes: localStorage.getItem('focusflow-notes'),
      goals: localStorage.getItem('focusflow-goals'),
      habits: localStorage.getItem('focusflow-habits'),
      exams: localStorage.getItem('focusflow-exams'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `focusflow-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const keys = ['app', 'pomodoro', 'tasks', 'checklist', 'subjects', 'notes', 'goals', 'habits', 'exams'];
        const storageKeys: Record<string, string> = {
          app: 'focusflow-app', pomodoro: 'focusflow-pomodoro', tasks: 'focusflow-tasks',
          checklist: 'focusflow-checklist', subjects: 'focusflow-subjects', notes: 'focusflow-notes',
          goals: 'focusflow-goals', habits: 'focusflow-habits', exams: 'focusflow-exams',
        };
        keys.forEach((key) => {
          if (data[key]) { localStorage.setItem(storageKeys[key], data[key]); }
        });
        window.location.reload();
      } catch { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      (installPrompt as unknown as { prompt: () => Promise<void> }).prompt();
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };
  {user && (
  <>
    <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 ...">
      ...
      Google Connected
    </div>

    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 ...">
      ...
      Cloud Sync
    </div>
  </>
)}

  const handleNotificationToggle = (enabled: boolean) => {
    updateSettings({ notifications: enabled });
    if (enabled) { requestNotificationPermission(); }
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-5 md:p-8 lg:p-10">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/35">Manage your preferences and account</p>
      </motion.div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── Account ─── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10">
                  <User className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Account</h3>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="relative">
                  <Avatar className="h-14 w-14 rounded-2xl">
                    <AvatarImage
  src={user?.photoURL ?? ""}
  alt={user?.displayName ?? "User"}
/>
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-violet-500 text-white text-lg font-bold rounded-2xl">
                      {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#0f0f12]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
  {user?.displayName || user?.email?.split("@")[0] || "Guest"}
</p>

<p className="text-xs text-white/45">
  {user?.email || "Not signed in"}
</p>
                  <div className="mt-4 space-y-3">

  {user && (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1">
        <Shield size={10} className="text-blue-400" />
        <span className="text-[10px] font-medium text-blue-400">
          Google Connected
        </span>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
        <Cloud size={10} className="text-emerald-400" />
        <span className="text-[10px] font-medium text-emerald-400">
          Cloud Sync
        </span>
      </div>
    </div>
  )}

  {user ? (
    <Button
      onClick={signOut}
      disabled={isLoading}
      variant="destructive"
      className="w-full rounded-xl"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? "Signing Out..." : "Sign Out"}
    </Button>
  ) : (
    <Button
      onClick={signInWithGoogle}
      disabled={isLoading}
      className="w-full rounded-xl bg-purple-600 hover:bg-purple-700"
    >
      <LogIn className="mr-2 h-4 w-4" />
      {isLoading ? "Signing In..." : "Sign in with Google"}
    </Button>
  )}

</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/30">
                <Clock size={12} />
                <span>Member since 2024</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ─── Appearance ─── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
          <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/10">
                  <Palette className="h-4 w-4 text-pink-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Appearance</h3>
              </div>

              {/* Theme Cards */}
              <div>
                <Label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 block">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'dark' as const, label: 'Dark', desc: 'Easier on the eyes', icon: Moon },
                    { value: 'light' as const, label: 'Light', desc: 'Clean & bright', icon: Sun },
                    { value: 'system' as const, label: 'System', desc: 'Follows OS', icon: Monitor },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleThemeChange(t.value)}
                      className={`relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition-all duration-300 ${
                        settings.theme === t.value
                          ? 'bg-purple-600/10 border-purple-500/30 shadow-lg shadow-purple-600/5'
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      <t.icon className={`h-5 w-5 transition-colors ${settings.theme === t.value ? 'text-purple-400' : 'text-white/30'}`} />
                      <div className="text-center">
                        <p className={`text-xs font-semibold ${settings.theme === t.value ? 'text-white' : 'text-white/50'}`}>{t.label}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{t.desc}</p>
                      </div>
                      {settings.theme === t.value && (
                        <motion.div
                          layoutId="theme-indicator"
                          className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-500"
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Colors */}
              <div>
                <Label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 block">Accent Color</Label>
                <div className="flex gap-2.5 flex-wrap">
                  {ACCENT_COLORS.map((c) => (
                    <motion.button
                      key={c.value}
                      type="button"
                      onClick={() => handleAccentColor(c.value)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative h-10 w-10 rounded-2xl transition-all duration-300 ${
                        settings.accentColor === c.value
                          ? 'ring-2 ring-offset-2 ring-offset-[#0f0f12] shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: c.value,
                        ringColor: settings.accentColor === c.value ? c.value : undefined,
                        boxShadow: settings.accentColor === c.value ? `0 4px 20px ${c.value}30` : undefined,
                      }}
                    >
                      {settings.accentColor === c.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="h-3 w-3 rounded-full bg-white/90" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ─── Timer Settings ─── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
                  <Timer className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Timer</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/60">Focus Duration</Label>
                    <span className="text-lg font-bold tabular-nums text-white bg-white/[0.04] px-3 py-1 rounded-lg">{settings.pomodoroFocus}<span className="text-xs text-white/30 ml-1">min</span></span>
                  </div>
                  <Slider
                    value={[settings.pomodoroFocus]}
                    onValueChange={([v]) => handleTimerSetting('pomodoroFocus', v)}
                    min={1} max={120} step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/60">Break Duration</Label>
                    <span className="text-lg font-bold tabular-nums text-white bg-white/[0.04] px-3 py-1 rounded-lg">{settings.pomodoroBreak}<span className="text-xs text-white/30 ml-1">min</span></span>
                  </div>
                  <Slider
                    value={[settings.pomodoroBreak]}
                    onValueChange={([v]) => handleTimerSetting('pomodoroBreak', v)}
                    min={1} max={30} step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/60">Long Break</Label>
                    <span className="text-lg font-bold tabular-nums text-white bg-white/[0.04] px-3 py-1 rounded-lg">{settings.pomodoroLongBreak}<span className="text-xs text-white/30 ml-1">min</span></span>
                  </div>
                  <Slider
                    value={[settings.pomodoroLongBreak]}
                    onValueChange={([v]) => handleTimerSetting('pomodoroLongBreak', v)}
                    min={5} max={60} step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/60">Sessions Before Long Break</Label>
                    <span className="text-lg font-bold tabular-nums text-white bg-white/[0.04] px-3 py-1 rounded-lg">{settings.pomodoroSessionsBeforeLong}</span>
                  </div>
                  <Slider
                    value={[settings.pomodoroSessionsBeforeLong]}
                    onValueChange={([v]) => handleTimerSetting('pomodoroSessionsBeforeLong', v)}
                    min={2} max={8} step={1}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ─── Sound & Notifications ─── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
          <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
                  <Volume2 className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Sound</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/60">Alarm Volume</Label>
                    <span className="text-sm font-bold tabular-nums text-white">{settings.alarmVolume}%</span>
                  </div>
                  <Slider
                    value={[settings.alarmVolume]}
                    onValueChange={([v]) => updateSettings({ alarmVolume: v })}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-white/30" />
                    <div>
                      <Label className="text-sm text-white/70">Notifications</Label>
                      <p className="text-[11px] text-white/25 mt-0.5">Get notified when sessions end</p>
                    </div>
                  </div>
                  <Switch checked={settings.notifications} onCheckedChange={handleNotificationToggle} />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Music className="h-4 w-4 text-white/30" />
                    <div>
                      <Label className="text-sm text-white/70">Background Music</Label>
                      <p className="text-[11px] text-white/25 mt-0.5">Ambient sounds during focus</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.backgroundMusic}
                    onCheckedChange={(v) => updateSettings({ backgroundMusic: v })}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ─── General ─── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Globe className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">General</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm text-white/60">Language</Label>
                  <Select value={settings.language} onValueChange={(v) => updateSettings({ language: v })}>
                    <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1f]/95 backdrop-blur-2xl border-white/[0.08] rounded-2xl">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Maximize className="h-4 w-4 text-white/30" />
                    <div>
                      <Label className="text-sm text-white/70">Auto Fullscreen</Label>
                      <p className="text-[11px] text-white/25 mt-0.5">Enter fullscreen in focus mode</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoFullscreen}
                    onCheckedChange={(v) => updateSettings({ autoFullscreen: v })}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ─── Data Management ─── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
          <GlassCard noPadding className="overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Database className="h-4 w-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Data</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportData}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Download className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white/80">Export Backup</p>
                    <p className="text-[10px] text-white/25 mt-0.5">Download your data</p>
                  </div>
                </button>

                <label className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] cursor-pointer">
                  <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Upload className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white/80">Import Backup</p>
                    <p className="text-[10px] text-white/25 mt-0.5">Restore from file</p>
                  </div>
                </label>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 rounded-2xl border border-red-500/[0.15] bg-red-500/[0.04] p-4 transition-all hover:border-red-500/[0.25] hover:bg-red-500/[0.08] text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-400">Reset Everything</p>
                      <p className="text-[10px] text-red-400/40 mt-0.5">Permanently delete all data</p>
                    </div>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#131316]/95 backdrop-blur-2xl border-white/[0.08] rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/40">
                      This will permanently delete all your data including tasks, habits, pomodoro sessions, exams, notes, and settings. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.06] rounded-xl">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={resetAllData} className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/20">
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ─── About (Full Width) ─── */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
        <GlassCard noPadding className="overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 shadow-xl shadow-purple-600/20">
                  <Info className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">FocusFlow</h3>
                  <p className="text-xs text-white/30 mt-0.5">Version 1.0.0</p>
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.1] px-3.5 py-2">
                  <Cloud size={12} className="text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Cloud Sync</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-blue-500/[0.06] border border-blue-500/[0.1] px-3.5 py-2">
                  <Shield size={12} className="text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Firebase Connected</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-purple-500/[0.06] border border-purple-500/[0.1] px-3.5 py-2">
                  <span className="text-xs font-medium text-purple-400">Made with ❤️ by Ashu Raj</span>
                </div>
              </div>
            </div>

            {isInstallable && (
              <div className="mt-5 pt-5 border-t border-white/[0.05]">
                <Button
                  onClick={handleInstallApp}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 shadow-lg shadow-purple-600/20"
                >
                  <Maximize className="w-4 h-4" />
                  Install App
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
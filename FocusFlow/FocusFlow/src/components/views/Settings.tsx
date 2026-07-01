'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Shield,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import { LoginButton } from '@/components/auth/LoginButton';

export default function Settings() {
  const { settings, updateSettings, resetSettings, resetAllData } = useAppStore();
  const { updateTimerSettings } = usePomodoroStore();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Sync theme with settings
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
      // Also set hsl values for shadcn compatibility
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
    // Sync with pomodoro store
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
        const keys = [
          'app', 'pomodoro', 'tasks', 'checklist',
          'subjects', 'notes', 'goals', 'habits', 'exams',
        ];
        const storageKeys: Record<string, string> = {
          app: 'focusflow-app',
          pomodoro: 'focusflow-pomodoro',
          tasks: 'focusflow-tasks',
          checklist: 'focusflow-checklist',
          subjects: 'focusflow-subjects',
          notes: 'focusflow-notes',
          goals: 'focusflow-goals',
          habits: 'focusflow-habits',
          exams: 'focusflow-exams',
        };
        keys.forEach((key) => {
          if (data[key]) {
            localStorage.setItem(storageKeys[key], data[key]);
          }
        });
        window.location.reload();
      } catch {
        alert('Invalid backup file.');
      }
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

  const handleNotificationToggle = (enabled: boolean) => {
    updateSettings({ notifications: enabled });
    if (enabled) {
      requestNotificationPermission();
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Appearance */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Appearance</h3>
        </div>

        {/* Theme */}
        <div className="space-y-3">
          <Label className="text-white/80">Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'dark' as const, label: 'Dark', icon: Moon },
              { value: 'light' as const, label: 'Light', icon: Sun },
              { value: 'system' as const, label: 'System', icon: Monitor },
            ].map((t) => (
              <Button
                key={t.value}
                variant="outline"
                onClick={() => handleThemeChange(t.value)}
                className={`justify-start gap-2 rounded-xl h-11 ${
                  settings.theme === t.value
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300 hover:bg-purple-600/30'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-white/10 my-6" />

        {/* Accent Color */}
        <div className="space-y-3">
          <Label className="text-white/80">Accent Color</Label>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleAccentColor(c.value)}
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className={`w-10 h-10 rounded-xl transition-all ${
                    settings.accentColor === c.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
                <span className="text-xs text-white/40 group-hover:text-white/60">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Timer Settings */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Timer className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Timer Settings</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Focus Duration</Label>
              <span className="text-sm text-white/60">{settings.pomodoroFocus} min</span>
            </div>
            <Slider
              value={[settings.pomodoroFocus]}
              onValueChange={([v]) => handleTimerSetting('pomodoroFocus', v)}
              min={1}
              max={120}
              step={1}
            />
            <div className="flex justify-between text-xs text-white/30">
              <span>1 min</span>
              <span>120 min</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Break Duration</Label>
              <span className="text-sm text-white/60">{settings.pomodoroBreak} min</span>
            </div>
            <Slider
              value={[settings.pomodoroBreak]}
              onValueChange={([v]) => handleTimerSetting('pomodoroBreak', v)}
              min={1}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-xs text-white/30">
              <span>1 min</span>
              <span>30 min</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Long Break Duration</Label>
              <span className="text-sm text-white/60">{settings.pomodoroLongBreak} min</span>
            </div>
            <Slider
              value={[settings.pomodoroLongBreak]}
              onValueChange={([v]) => handleTimerSetting('pomodoroLongBreak', v)}
              min={5}
              max={60}
              step={1}
            />
            <div className="flex justify-between text-xs text-white/30">
              <span>5 min</span>
              <span>60 min</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Sessions Before Long Break</Label>
              <span className="text-sm text-white/60">{settings.pomodoroSessionsBeforeLong}</span>
            </div>
            <Slider
              value={[settings.pomodoroSessionsBeforeLong]}
              onValueChange={([v]) => handleTimerSetting('pomodoroSessionsBeforeLong', v)}
              min={2}
              max={8}
              step={1}
            />
            <div className="flex justify-between text-xs text-white/30">
              <span>2</span>
              <span>8</span>
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/80">Auto Start Pomodoro</Label>
              <p className="text-xs text-white/40 mt-0.5">Automatically start next focus session</p>
            </div>
            <Switch
              checked={settings.autoStartPomodoro}
              onCheckedChange={(v) => updateSettings({ autoStartPomodoro: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/80">Auto Start Break</Label>
              <p className="text-xs text-white/40 mt-0.5">Automatically start break after focus</p>
            </div>
            <Switch
              checked={settings.autoStartBreak}
              onCheckedChange={(v) => updateSettings({ autoStartBreak: v })}
            />
          </div>
        </div>
      </GlassCard>

      {/* Sound & Notifications */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Volume2 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Sound & Notifications</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Alarm Volume</Label>
              <span className="text-sm text-white/60">{settings.alarmVolume}%</span>
            </div>
            <Slider
              value={[settings.alarmVolume]}
              onValueChange={([v]) => updateSettings({ alarmVolume: v })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/80">Desktop Notifications</Label>
              <p className="text-xs text-white/40 mt-0.5">Get notified when sessions end</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/80">Background Music</Label>
              <p className="text-xs text-white/40 mt-0.5">Play ambient sounds during focus</p>
            </div>
            <Switch
              checked={settings.backgroundMusic}
              onCheckedChange={(v) => updateSettings({ backgroundMusic: v })}
            />
          </div>
        </div>
      </GlassCard>

      {/* General */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">General</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white/80">Language</Label>
            <Select
              value={settings.language}
              onValueChange={(v) => updateSettings({ language: v })}
            >
              <SelectTrigger className="w-full bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/80">Auto Fullscreen in Focus Mode</Label>
              <p className="text-xs text-white/40 mt-0.5">Enter fullscreen when starting a session</p>
            </div>
            <Switch
              checked={settings.autoFullscreen}
              onCheckedChange={(v) => updateSettings({ autoFullscreen: v })}
            />
          </div>
        </div>
      </GlassCard>

      {/* Account */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Account</h3>
        </div>
        <div className="space-y-4">
          <LoginButton />
          <p className="text-xs text-white/40">
            Sign in to sync your data across all your devices securely.
          </p>
        </div>
      </GlassCard>

      {/* Data Management */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Data Management</h3>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportData}
              variant="outline"
              className="flex-1 gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 h-11 rounded-xl"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <label className="flex-1">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
              <Button
                variant="outline"
                className="w-full gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 h-11 rounded-xl cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4" />
                  Import Data
                </span>
              </Button>
            </label>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-11 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
                Reset All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-900 border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  This will permanently delete all your data including tasks, habits, pomodoro sessions,
                  exams, notes, and settings. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetAllData}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </GlassCard>

      {/* About */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">About</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60">App</span>
            <span className="text-white font-medium">FocusFlow</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Version</span>
            <span className="text-white font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Made with</span>
            <span className="text-white font-medium">❤️ by ASHU</span>
          </div>
          {isInstallable && (
            <Button
              onClick={handleInstallApp}
              className="w-full mt-2 gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11"
            >
              <Maximize className="w-4 h-4" />
              Install App
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
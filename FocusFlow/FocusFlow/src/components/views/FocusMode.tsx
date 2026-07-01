'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  CloudRain,
  Trees,
  Flame,
  Coffee,
  Waves,
  Radio,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { formatTime } from '@/lib/utils';
import { MOTIVATIONAL_QUOTES, AMBIENT_SOUNDS } from '@/lib/constants';
import type { SessionType } from '@/lib/types';

// ---- Ambient sound icon map ----
const AMBIENT_ICONS: Record<string, React.ReactNode> = {
  CloudRain: <CloudRain className="h-4 w-4" />,
  Trees: <Trees className="h-4 w-4" />,
  Flame: <Flame className="h-4 w-4" />,
  Coffee: <Coffee className="h-4 w-4" />,
  Waves: <Waves className="h-4 w-4" />,
  Radio: <Radio className="h-4 w-4" />,
};

// ---- Web Audio ambient sound engine ----
interface SoundEngine {
  ctx: AudioContext;
  gain: GainNode;
  filter: BiquadFilterNode | null;
  lfo: OscillatorNode | null;
  lfoGain: GainNode | null;
  source: AudioBufferSourceNode;
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const size = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createSoundEngine(soundId: string): SoundEngine | null {
  try {
    const ctx = new AudioContext();
    const buffer = createNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    let filter: BiquadFilterNode | null = null;
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;

    switch (soundId) {
      case 'rain':
        filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        source.connect(filter);
        filter.connect(gain);
        break;

      case 'whitenoise':
        source.connect(gain);
        break;

      case 'ocean':
        filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 0.5;
        source.connect(filter);
        filter.connect(gain);
        // LFO for ocean wave effect
        lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;
        lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.15;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        break;

      case 'forest':
        filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.3;
        source.connect(filter);
        filter.connect(gain);
        break;

      case 'fireplace':
        filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 200;
        filter.Q.value = 0.8;
        source.connect(filter);
        filter.connect(gain);
        break;

      case 'cafe':
        filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.4;
        source.connect(filter);
        filter.connect(gain);
        // Slight modulation for cafe bustle
        lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.25;
        lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.08;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        break;

      default:
        source.connect(gain);
    }

    gain.connect(ctx.destination);
    source.start();

    return { ctx, gain, filter, lfo, lfoGain, source };
  } catch {
    return null;
  }
}

// ---- Floating orbs config ----
const orbs = [
  { size: 300, x: '10%', y: '20%', color: 'rgba(124, 58, 237, 0.15)', duration: 20 },
  { size: 200, x: '80%', y: '60%', color: 'rgba(59, 130, 246, 0.12)', duration: 25 },
  { size: 250, x: '50%', y: '80%', color: 'rgba(139, 92, 246, 0.1)', duration: 18 },
  { size: 180, x: '70%', y: '15%', color: 'rgba(99, 102, 241, 0.12)', duration: 22 },
  { size: 220, x: '25%', y: '65%', color: 'rgba(124, 58, 237, 0.08)', duration: 28 },
];

// ---- Component ----
export function FocusMode() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const {
    isRunning,
    isPaused,
    currentSessionType,
    timeRemaining,
    todaySessionCount,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = usePomodoroStore();

  const [soundsOpen, setSoundsOpen] = useState(false);
  const [activeSounds, setActiveSounds] = useState<Record<string, { engine: SoundEngine; volume: number }>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeSoundsRef = useRef(activeSounds);
  activeSoundsRef.current = activeSounds;

  // Pick a random quote on mount
  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    []
  );

  // Total seconds for current session type
  const totalSeconds = useMemo(() => {
    if (currentSessionType === 'focus') return settings.focusDuration * 60;
    if (currentSessionType === 'break') return settings.breakDuration * 60;
    return settings.longBreakDuration * 60;
  }, [currentSessionType, settings]);

  const progress = ((totalSeconds - timeRemaining) / totalSeconds) * 100;

  const sessionLabel: Record<SessionType, string> = {
    focus: 'Focus Session',
    break: 'Short Break',
    'long-break': 'Long Break',
  };

  // Cleanup all active sound engines
  const stopAllSounds = useCallback((engines: Record<string, { engine: SoundEngine; volume: number }>) => {
    Object.values(engines).forEach(({ engine }) => {
      try {
        engine.gain.gain.linearRampToValueAtTime(0, engine.ctx.currentTime + 0.3);
        setTimeout(() => {
          engine.source.stop();
          engine.lfo?.stop();
          engine.ctx.close();
        }, 400);
      } catch { /* ignore */ }
    });
  }, []);

  const exitFocus = useCallback(() => {
    stopAllSounds(activeSoundsRef.current);
    setActiveSounds({});
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setCurrentView('dashboard');
  }, [setCurrentView, stopAllSounds]);

  // Exit on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFocus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitFocus]);

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      Object.values(activeSoundsRef.current).forEach(({ engine }) => {
        try {
          engine.source.stop();
          engine.lfo?.stop();
          engine.ctx.close();
        } catch { /* ignore */ }
      });
    };
  }, []);

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch { /* fullscreen not supported */ }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Toggle sound on/off
  const toggleSound = useCallback((soundId: string) => {
    setActiveSounds((prev) => {
      if (prev[soundId]) {
        const { engine, volume } = prev[soundId];
        try {
          engine.gain.gain.linearRampToValueAtTime(0, engine.ctx.currentTime + 0.3);
          setTimeout(() => {
            engine.source.stop();
            engine.lfo?.stop();
            engine.ctx.close();
          }, 400);
        } catch { /* ignore */ }
        const next = { ...prev };
        delete next[soundId];
        return next;
      }
      const engine = createSoundEngine(soundId);
      if (!engine) return prev;
      const volume = 0.5;
      engine.gain.gain.linearRampToValueAtTime(volume, engine.ctx.currentTime + 0.3);
      return { ...prev, [soundId]: { engine, volume } };
    });
  }, []);

  // Update volume for a sound
  const setVolume = useCallback((soundId: string, volume: number) => {
    setActiveSounds((prev) => {
      if (!prev[soundId]) return prev;
      const { engine } = prev[soundId];
      engine.gain.gain.linearRampToValueAtTime(volume, engine.ctx.currentTime + 0.1);
      return { ...prev, [soundId]: { ...prev[soundId], volume } };
    });
  }, []);

  // Handle start / pause / resume
  const handleTimerToggle = () => {
    if (!isRunning) {
      startTimer();
    } else if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  return (
    <div className="focus-bg fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Exit button */}
      <button
        onClick={exitFocus}
        className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white"
        aria-label="Exit focus mode"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute right-16 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white"
        aria-label="Toggle fullscreen"
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>

      {/* Session Counter */}
      <div className="absolute left-4 top-4 z-50 rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
        <p className="text-xs text-white/50">Sessions Today</p>
        <p className="text-lg font-bold text-white">{todaySessionCount}</p>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        {/* Timer */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <ProgressRing progress={progress} size={280} strokeWidth={8}>
            <div className="flex flex-col items-center">
              <span className="text-6xl font-bold tracking-tight text-white md:text-7xl">
                {formatTime(timeRemaining)}
              </span>
              <span className="mt-2 text-sm font-medium text-purple-400">
                {sessionLabel[currentSessionType]}
              </span>
            </div>
          </ProgressRing>
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-md text-center"
        >
          <p className="text-sm italic text-white/40">&ldquo;{quote.text}&rdquo;</p>
          <p className="mt-1 text-xs text-white/25">— {quote.author}</p>
        </motion.div>

        {/* DND reminder */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-xs text-white/30"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-red-500/80" />
          Do Not Disturb
        </motion.p>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 flex items-center gap-4"
        >
          <button
            onClick={resetTimer}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={handleTimerToggle}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50"
            aria-label={isRunning && !isPaused ? 'Pause timer' : 'Start timer'}
          >
            {isRunning && !isPaused ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="ml-1 h-7 w-7" />
            )}
          </button>

          <button
            onClick={exitFocus}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white"
            aria-label="Exit focus"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Keyboard hint */}
        <p className="text-xs text-white/20">Press <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-white/30">Esc</kbd> to exit</p>
      </div>

      {/* Ambient Sound Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        {/* Toggle bar */}
        <button
          onClick={() => setSoundsOpen(!soundsOpen)}
          className="flex w-full items-center justify-center gap-2 border-t border-white/5 bg-white/5/50 px-4 py-3 text-sm text-white/40 backdrop-blur-xl transition-all hover:text-white/60"
        >
          <Volume2 className="h-4 w-4" />
          <span>Ambient Sounds</span>
          {Object.keys(activeSounds).length > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-300">
              {Object.keys(activeSounds).length}
            </span>
          )}
          {soundsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        {/* Sound panel */}
        <AnimatePresence>
          {soundsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-white/5 bg-black/40 backdrop-blur-xl"
            >
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-6">
                {AMBIENT_SOUNDS.map((sound) => {
                  const isActive = !!activeSounds[sound.id];
                  const volume = activeSounds[sound.id]?.volume ?? 0.5;

                  return (
                    <motion.div
                      key={sound.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${
                        isActive
                          ? 'border-purple-500/40 bg-purple-500/10'
                          : 'border-white/5 bg-white/5'
                      }`}
                    >
                      <button
                        onClick={() => toggleSound(sound.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                        aria-label={`Toggle ${sound.name}`}
                      >
                        <div
                          className={`${
                            isActive ? 'text-purple-400' : 'text-white/40'
                          } transition-colors`}
                        >
                          {isActive ? (
                            <Volume2 className="h-5 w-5" />
                          ) : (
                            AMBIENT_ICONS[sound.icon] ?? <VolumeX className="h-5 w-5" />
                          )}
                        </div>
                      </button>
                      <span className="text-xs font-medium text-white/60">{sound.name}</span>
                      {isActive && (
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={volume}
                          onChange={(e) => setVolume(sound.id, parseFloat(e.target.value))}
                          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-500"
                          aria-label={`${sound.name} volume`}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FocusMode;
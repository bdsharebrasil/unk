import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SkipBack, SkipForward, Pause, Play } from "lucide-react";

type Props = {
  src: string;
  title?: string;
  coverUrl?: string;
  className?: string;
  /** When true, progress cursor keeps updating via rAF while playing */
  activeProgress?: boolean;
  onPlay?: () => void;
  /** When true, show only central play button (useful for login) */
  controlsOnlyPlay?: boolean;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerCard({ src, title = "Bem Vindo ao Portal UNK", coverUrl, className, activeProgress = false, onPlay, controlsOnlyPlay = false }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const progress = useMemo(() => (duration > 0 ? (current / duration) * 100 : 0), [current, duration]);

  const cancelRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const loop = useCallback(() => {
    if (!audioRef.current) return;
    setCurrent(audioRef.current.currentTime);
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => () => cancelRaf(), []);

  const onLoaded = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const onTimeUpdate = () => {
    if (!activeProgress) {
      setCurrent(audioRef.current?.currentTime || 0);
    }
  };

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      // optimistically reveal form
      setIsPlaying(true);
      try { onPlay?.(); } catch (e) { /* ignore */ }
      try {
        await el.play();
      } catch (e) {
        // ignore play errors (no src or autoplay blocked)
      }
      if (activeProgress && !el.paused) {
        cancelRaf();
        rafRef.current = requestAnimationFrame(loop);
      }
    } else {
      el.pause();
      setIsPlaying(false);
      cancelRaf();
    }
  };

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(value)) return;
    el.currentTime = Math.min(Math.max(0, value), duration || 0);
    setCurrent(el.currentTime);
  };

  const nudge = (delta: number) => {
    seek(current + delta);
  };

  const handlePlayClick = async () => {
    // call onPlay immediately to ensure UI reaction
    try { onPlay?.(); } catch (e) {}
    // then toggle audio logic
    await togglePlay();
  };

  // expose props object for conditional rendering
  const props = { controlsOnlyPlay } as any;

  return (
    <Card className={cn("relative overflow-hidden rounded-2xl liquid-glass beam-border p-5", className)}>
      <div className="relative z-10">
        {title ? (
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        ) : null}
        <div className="flex items-center gap-5">
          {coverUrl && (
            <img src={coverUrl} alt="Capa" className="h-28 w-28 rounded-xl object-cover shadow-lg" />
          )}
          <div className="flex-1">
            <div className="mb-2 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-400" style={{ width: `${progress}%` }} />
            </div>
            <div className="mb-2 flex items-center justify-between text-xs text-white/70">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              {!controlsOnlyPlay && (
                <button onClick={() => nudge(-10)} className="player-button" aria-label="Voltar 10s">
                  <SkipBack className="h-5 w-5" />
                </button>
              )}
              <button onClick={handlePlayClick} className={cn("player-button", isPlaying && "active")} aria-label={isPlaying ? "Pausar" : "Tocar"}>
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              {!controlsOnlyPlay && (
                <button onClick={() => nudge(10)} className="player-button" aria-label="Avançar 10s">
                  <SkipForward className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <audio ref={audioRef} src={src} onLoadedMetadata={onLoaded} onTimeUpdate={onTimeUpdate} onEnded={() => { setIsPlaying(false); cancelRaf(); }} />
      </div>
    </Card>
  );
}

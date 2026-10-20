import { useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";

export const AnthemPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-border bg-card py-2 pl-2 pr-4 shadow-card">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Пауза — гімн Фартлек" : "Слухати гімн Фартлек"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <Music2 className="h-4 w-4 text-primary" aria-hidden />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold">Фартлек — гімн</span>
        <span className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
          Музика для мотивації
        </span>
      </div>
      <audio
        ref={audioRef}
        src="https://fartlek.com.ua/wp-content/uploads/2026/04/Fartlek-Events.mp3"
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  );
};

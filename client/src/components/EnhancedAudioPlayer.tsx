import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface EnhancedAudioPlayerProps {
  src: string;
  title?: string;
}

export function EnhancedAudioPlayer({ src, title }: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      seek(newTime);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {title && (
        <div className="flex items-center gap-2">
          <span className="text-lg">🎧</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative w-full h-2 bg-gray-200 rounded-full cursor-pointer"
             onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const percent = (e.clientX - rect.left) / rect.width;
               seek(percent * duration);
             }}>
          <div 
            className="absolute left-0 top-0 h-full bg-[var(--accent-blue)] rounded-full transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />
          <div 
            className="absolute top-1/2 w-4 h-4 bg-[var(--accent-blue)] rounded-full transform -translate-y-1/2 transition-all duration-150"
            style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => skip(-10)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Skip back 10s"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={togglePlayPause}
            className="p-3 bg-[var(--accent-blue)] text-white rounded-full hover:bg-[var(--accent-yellow)] hover:text-[var(--text-primary)] transition-all duration-200"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          
          <button
            onClick={() => skip(10)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Skip forward 10s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Speed:</span>
          <div className="flex gap-1">
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => changePlaybackRate(rate)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  playbackRate === rate
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'bg-gray-200 text-[var(--text-secondary)] hover:bg-gray-300'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              if (audioRef.current) {
                audioRef.current.volume = newVolume;
              }
            }}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
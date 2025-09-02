import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Volume2, VolumeX, Gauge } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export function AudioPlayer({ src, title, className = "" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      setIsLoading(false);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
    };
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSpeedChange = (speed: string) => {
    const newSpeed = parseFloat(speed);
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {title && (
        <h4 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">
          🎧 {title}
        </h4>
      )}

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          disabled={isLoading}
          size="sm"
          className="bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 text-white p-2 h-10 w-10"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        {/* Progress Slider */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] min-w-[35px]">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="flex-1"
            disabled={isLoading}
          />
          <span className="text-xs text-[var(--text-secondary)] min-w-[35px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-16"
          />
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1">
          <Gauge className="w-4 h-4 text-[var(--text-secondary)]" />
          <Select value={playbackRate.toString()} onValueChange={handleSpeedChange}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5×</SelectItem>
              <SelectItem value="0.75">0.75×</SelectItem>
              <SelectItem value="1">1×</SelectItem>
              <SelectItem value="1.25">1.25×</SelectItem>
              <SelectItem value="1.5">1.5×</SelectItem>
              <SelectItem value="1.75">1.75×</SelectItem>
              <SelectItem value="2">2×</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
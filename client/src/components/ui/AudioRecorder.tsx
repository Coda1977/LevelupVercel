import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface AudioRecorderProps {
  audioUrl: string;
  onAudioUrlChange: (url: string) => void;
}

export function AudioRecorder({ audioUrl, onAudioUrlChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        onAudioUrlChange(url);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAudioUrlChange(url);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Audio Recording</Label>
      
      <div className="flex gap-3">
        {!isRecording ? (
          <Button
            type="button"
            onClick={startRecording}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🎤 Start Recording
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700"
          >
            ⏹️ Stop Recording ({formatTime(recordingTime)})
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <Label htmlFor="audio-upload" className="cursor-pointer">
            📁 Upload Audio
          </Label>
          <Input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Audio URL Input */}
      <div>
        <Label htmlFor="audioUrl">Audio URL</Label>
        <Input
          id="audioUrl"
          value={audioUrl}
          onChange={(e) => onAudioUrlChange(e.target.value)}
          placeholder="https://example.com/audio.mp3 or upload/record above"
        />
      </div>

      {/* Audio Preview */}
      {(audioUrl || audioBlob) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <Label className="mb-2 block">Audio Preview</Label>
          <audio 
            controls 
            className="w-full"
            src={audioUrl}
            onClick={(e) => e.stopPropagation()}
            controlsList="nodownload"
          >
            Your browser does not support the audio element.
          </audio>
          <div className="mt-2 text-xs text-gray-600">
            💡 Tip: Use the speed controls (⚙️) in the main audio player for faster playback
          </div>
        </div>
      )}
    </div>
  );
} 
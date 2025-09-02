import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Volume2, Trash2, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AudioControlsProps {
  chapter: {
    id: number;
    title: string;
    audioUrl?: string;
  };
}

export function AudioControls({ chapter }: AudioControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [voice, setVoice] = useState("shimmer");
  const [quality, setQuality] = useState("standard");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateAudioMutation = useMutation({
    mutationFn: async ({ voice, quality }: { voice: string; quality: string }) => {
      const response = await apiRequest("POST", `/api/chapters/${chapter.id}/generate-audio`, {
        voice,
        quality,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Audio generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to generate audio: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAudioMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/chapters/${chapter.id}/audio`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Audio deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete audio: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateAudio = () => {
    generateAudioMutation.mutate({ voice, quality });
  };

  const handleDeleteAudio = () => {
    if (window.confirm("Delete audio file? This cannot be undone.")) {
      deleteAudioMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {chapter.audioUrl && (
        <div className="mb-2">
          <AudioPlayer src={chapter.audioUrl} title={chapter.title} />
        </div>
      )}
      
      <div className="flex gap-2 flex-wrap items-center">
        {!chapter.audioUrl ? (
          // Generation controls when no audio exists
          <>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alloy">Alloy</SelectItem>
                <SelectItem value="echo">Echo</SelectItem>
                <SelectItem value="fable">Fable</SelectItem>
                <SelectItem value="onyx">Onyx</SelectItem>
                <SelectItem value="nova">Nova</SelectItem>
                <SelectItem value="shimmer">Shimmer</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleGenerateAudio}
              disabled={generateAudioMutation.isPending}
              size="sm"
              className="bg-[var(--accent-yellow)] text-[var(--text-primary)] hover:bg-[var(--accent-yellow)]/80"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {generateAudioMutation.isPending ? "Generating..." : "Generate Audio"}
            </Button>
          </>
        ) : (
          // Controls when audio exists
          <>
            <Button
              onClick={handleGenerateAudio}
              disabled={generateAudioMutation.isPending}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Volume2 className="w-3 h-3 mr-1" />
              {generateAudioMutation.isPending ? "Regenerating..." : "Regenerate"}
            </Button>
            
            <Button
              onClick={handleDeleteAudio}
              disabled={deleteAudioMutation.isPending}
              size="sm"
              variant="outline"
              className="text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {deleteAudioMutation.isPending ? "Deleting..." : "Delete Audio"}
            </Button>
            
            <a
              href={chapter.audioUrl}
              download={`${chapter.title}.mp3`}
              className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </a>
          </>
        )}
      </div>
    </div>
  );
}
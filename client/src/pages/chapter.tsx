import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MobileNav } from "@/components/MobileNav";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Clock, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ChapterPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [readingProgress, setReadingProgress] = useState(0);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const { data: chapters = [] } = useQuery<any[]>({ queryKey: ["/api/chapters"] });
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: progress = [] } = useQuery<any[]>({ 
    queryKey: ["/api/progress"], 
    enabled: isAuthenticated 
  });

  const chapter = chapters.find((c: any) => c.slug === slug);
  const category = categories.find((c: any) => c.id === chapter?.categoryId);
  const chapterProgress = progress.find((p: any) => p.chapterId === chapter?.id);
  
  useEffect(() => {
    if (chapterProgress) {
      setIsCompleted(chapterProgress.completed);
    }
  }, [chapterProgress]);

  // Track reading progress
  useEffect(() => {
    if (!contentRef.current) return;
    
    let startTime = Date.now();
    const updateReadingTime = () => {
      if (hasStartedReading) {
        setReadingTime(prev => prev + 1);
      }
    };
    const timer = setInterval(updateReadingTime, 1000);

    const handleScroll = () => {
      if (!contentRef.current) return;
      
      if (!hasStartedReading) {
        setHasStartedReading(true);
        startTime = Date.now();
      }
      
      const element = contentRef.current;
      const scrollTop = window.pageYOffset;
      const elementTop = element.offsetTop;
      const elementHeight = element.scrollHeight;
      const windowHeight = window.innerHeight;
      
      const progress = Math.min(100, Math.max(0, 
        ((scrollTop - elementTop + windowHeight * 0.5) / elementHeight) * 100
      ));
      
      setReadingProgress(progress);
      
      // Auto-complete when user reaches 90% and has spent reasonable time
      if (progress >= 90 && readingTime >= 30 && !isCompleted) {
        handleAutoComplete();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, [hasStartedReading, readingTime, isCompleted]);

  const markCompleteMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      if (!chapter) return;
      return await apiRequest("POST", `/api/progress/${chapter.id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      setIsCompleted(true);
      setShowCompletionModal(true);
      toast({
        title: "Chapter Completed! 🎉",
        description: "Great job! Keep building your management skills.",
      });
    },
  });

  const handleAutoComplete = () => {
    if (!isCompleted) {
      markCompleteMutation.mutate(true);
    }
  };

  const handleManualComplete = () => {
    markCompleteMutation.mutate(true);
  };

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-[var(--text-secondary)]">
        Chapter not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-white pb-20 md:pb-0">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[var(--accent-yellow)] to-[var(--accent-blue)] transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>
      
      {/* Reading Stats Floating Panel */}
      {hasStartedReading && (
        <div className="fixed top-4 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-secondary)]">
                {Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[var(--accent-blue)] font-semibold">
                {Math.round(readingProgress)}%
              </span>
            </div>
            {isCompleted && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <section className="py-8 md:py-12 px-3 md:px-5 bg-white/90 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Button
            className="mb-4 px-4 py-2 bg-[var(--accent-yellow)] text-[var(--text-primary)] rounded-full font-semibold hover:bg-[var(--accent-blue)] hover:text-white transition"
            onClick={() => setLocation(category ? `/category/${category.slug}` : '/learn')}
          >
            ← Back to {category?.title || 'Categories'}
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            {chapter.contentType === 'book_summary' && (
              <span className="bg-[var(--accent-blue)] text-white px-3 py-1 rounded-full text-sm font-semibold">
                📚 Book Summary
              </span>
            )}
            <span className="text-[var(--text-secondary)] text-sm">
              Chapter {chapter.chapterNumber} • {chapter.estimatedMinutes} min read
            </span>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-extrabold mb-4 tracking-tight text-[var(--text-primary)]">
            {chapter.title}
          </h1>
          
          {chapter.description && (
            <div className="text-[var(--text-secondary)] text-lg mb-6 prose prose-lg max-w-none" 
                 dangerouslySetInnerHTML={{ __html: chapter.description }} />
          )}

          {/* Book Summary Metadata */}
          {chapter.contentType === 'book_summary' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {chapter.author && (
                  <div>
                    <span className="font-semibold text-[var(--text-secondary)]">Author:</span>
                    <span className="ml-2 text-[var(--text-primary)]">{chapter.author}</span>
                  </div>
                )}
                {chapter.readingTime && (
                  <div>
                    <span className="font-semibold text-[var(--text-secondary)]">Original Length:</span>
                    <span className="ml-2 text-[var(--text-primary)]">{chapter.readingTime} hours</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-[var(--text-secondary)]">Summary Time:</span>
                  <span className="ml-2 text-[var(--text-primary)]">{chapter.estimatedMinutes} minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {chapter.audioUrl && (
            <div className="mb-6">
              <AudioPlayer 
                src={chapter.audioUrl} 
                title={`Listen to: ${chapter.title}`}
                className="max-w-full"
              />
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-3 md:px-5 py-8 md:py-12">
        <div ref={contentRef} className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: chapter.content || '' }} />
        </div>

        {/* Key Takeaways for Book Summaries */}
        {chapter.contentType === 'book_summary' && chapter.keyTakeaways && chapter.keyTakeaways.length > 0 && (
          <div className="mt-8 p-6 bg-[var(--accent-yellow)]/10 rounded-lg border border-[var(--accent-yellow)]/20">
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
              🔑 Key Takeaways
            </h3>
            <ul className="space-y-2">
              {chapter.keyTakeaways.map((takeaway: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[var(--accent-blue)] font-bold">•</span>
                  <span className="text-[var(--text-primary)]">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Media Links */}
        <div className="mt-8 space-y-4">
          {chapter.podcastUrl && (
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                🎧 {chapter.podcastHeader || 'Podcast'}
              </h4>
              <a 
                href={chapter.podcastUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-blue)] hover:underline"
              >
                Listen on External Platform →
              </a>
            </div>
          )}
          
          {chapter.videoUrl && (
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                📺 {chapter.videoHeader || 'Video'}
              </h4>
              <a 
                href={chapter.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-blue)] hover:underline"
              >
                Watch Video →
              </a>
            </div>
          )}
        </div>
        
        {/* Completion Section */}
        {hasStartedReading && readingProgress > 60 && !isCompleted && (
          <div className="mt-12 p-6 bg-[var(--accent-yellow)]/10 rounded-lg border border-[var(--accent-yellow)]/20 text-center">
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
              🎯 Ready to Complete This Chapter?
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              You've read {Math.round(readingProgress)}% of this chapter and spent {Math.floor(readingTime / 60)} minutes learning.
              Mark it complete when you've absorbed the key concepts.
            </p>
            <Button
              onClick={handleManualComplete}
              disabled={markCompleteMutation.isPending}
              className="bg-[var(--accent-blue)] text-white px-8 py-3 rounded-full font-semibold hover:bg-[var(--accent-yellow)] hover:text-[var(--text-primary)] transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <CheckCircle className="w-5 h-5" />
              {markCompleteMutation.isPending ? 'Completing...' : 'Mark as Complete'}
            </Button>
          </div>
        )}
        
        {/* Already Completed */}
        {isCompleted && (
          <div className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Award className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-bold text-green-800">Chapter Completed!</h3>
            </div>
            <p className="text-green-700 mb-4">
              Great work! You've successfully completed this chapter. Keep building your management skills.
            </p>
            <Button
              onClick={() => setLocation(category ? `/category/${category.slug}` : '/learn')}
              className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-all duration-300"
            >
              Continue Learning →
            </Button>
          </div>
        )}
      </section>

      <MobileNav />
    </div>
  );
}
import { type Chapter } from "@shared/schema";
import { Clock, Eye, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ChapterCardProps {
  chapter: Chapter & { completed?: boolean; chapterNumber?: number };
  onChapterClick: (chapter: Chapter) => void;
}

export function ChapterCard({ chapter, onChapterClick }: ChapterCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  // Extract key points from content (first 3 bullet points or sentences)
  const getKeyPoints = (): string[] => {
    // For book summaries, use the manual key takeaways if available
    if (chapter.contentType === 'book_summary' && chapter.keyTakeaways && Array.isArray(chapter.keyTakeaways) && chapter.keyTakeaways.length > 0) {
      return chapter.keyTakeaways.slice(0, 4);
    }
    
    if (!chapter.content) return [];
    
    // Remove HTML tags for better text processing
    const cleanContent = chapter.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Look for structured content with clear learning points
    const learningPatterns = [
      // Look for numbered lists (1. 2. 3.)
      /(?:^|\n)\s*\d+\.\s*([^.\n]+(?:\.[^.\n]*)*)/g,
      // Look for bullet points (• - *)  
      /(?:^|\n)\s*[•\-\*]\s*([^.\n]+(?:\.[^.\n]*)*)/g,
      // Look for "Key" or "Important" sections
      /(?:key|important|main|primary).*?:?\s*([^.\n]+(?:\.[^.\n]*)*)/gi,
      // Look for sentences with actionable verbs
      /([^.!?]*(?:learn|understand|apply|develop|build|create|manage|improve)[^.!?]*[.!?])/gi
    ];
    
    let points: string[] = [];
    for (const pattern of learningPatterns) {
      const matches = Array.from(cleanContent.matchAll(pattern));
      if (matches.length > 0) {
        points = matches.map(match => match[1].trim()).filter(point => 
          point.length > 15 && point.length < 120 && !point.includes('<')
        );
        if (points.length >= 3) break;
      }
    }
    
    // If no structured content found, extract meaningful sentences
    if (points.length < 3) {
      const sentences = cleanContent.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => 
          s.length > 25 && 
          s.length < 120 && 
          !s.toLowerCase().includes('click') &&
          !s.toLowerCase().includes('here') &&
          (s.includes('manager') || s.includes('team') || s.includes('leadership') || 
           s.includes('learn') || s.includes('skill') || s.includes('effective'))
        );
      points = sentences.slice(0, 4);
    }
    
    return points.slice(0, 4).map((point: string) => 
      point.charAt(0).toUpperCase() + point.slice(1).replace(/[.!?]*$/, '')
    );
  };
  
  const keyPoints = getKeyPoints();
  
  const handlePreviewToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(!showPreview);
  };

  return (
    <div className={`chapter-card p-8 cursor-pointer ${chapter.completed ? 'completed' : ''}`}>
      <div onClick={() => onChapterClick(chapter)}>
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-2">
          <div className={`status-dot ${chapter.completed ? 'completed' : 'current'}`} />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {chapter.completed ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <span className="text-sm font-semibold text-[var(--text-secondary)]">
          Chapter {chapter.chapterNumber || chapter.id}
        </span>
      </div>
      
      <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-blue)]">
        {chapter.title}
      </h3>
      
        <p className="text-[var(--text-secondary)] text-base leading-6 mb-5">
          {chapter.preview}
        </p>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {chapter.duration}
          </span>
          <span className="text-sm font-semibold text-[var(--accent-blue)]">
            Read Chapter →
          </span>
        </div>
      </div>
      
      {/* Preview Section */}
      {keyPoints.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            onClick={handlePreviewToggle}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-blue)] hover:text-[var(--accent-yellow)] transition-colors w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {chapter.contentType === 'book_summary' ? 'Key Takeaways' : 'Key Learning Points'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPreview ? 'rotate-180' : ''}`} />
          </button>
          
          {showPreview && (
            <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
              {keyPoints.map((point: string, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--accent-yellow)] mt-1 font-bold">•</span>
                  <span className="leading-relaxed">{point}</span>
                </div>
              ))}
              <div className="text-xs text-[var(--text-secondary)] italic mt-3 pt-2 border-t border-gray-100">
                Click above to read the full chapter
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

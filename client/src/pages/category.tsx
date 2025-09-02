import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChapterCard } from "@/components/ChapterCard";
import { EnhancedAudioPlayer } from "@/components/EnhancedAudioPlayer";
import { MobileNav } from "@/components/MobileNav";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Home } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: chapters = [] } = useQuery<any[]>({ queryKey: ["/api/chapters"] });
  const { data: progress = [] } = useQuery<any[]>({ queryKey: ["/api/progress"] });

  const category = categories.find((c: any) => c.slug === slug);
  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-[var(--text-secondary)]">Category not found</div>
    );
  }

  const categoryChapters = chapters
    .filter((c: any) => c.categoryId === category.id)
    .sort((a: any, b: any) => a.chapterNumber - b.chapterNumber)
    .map((chapter: any) => {
      const chapterProgress = progress.find((p: any) => p.chapterId === chapter.id);
      return {
        ...chapter,
        completed: chapterProgress?.completed || false,
      };
    });
  const lessons = categoryChapters.filter((c: any) => c.contentType === 'lesson' || !c.contentType);
  const bookSummaries = categoryChapters.filter((c: any) => c.contentType === 'book_summary');
  const completedCount = categoryChapters.filter((c: any) => c.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-white pb-20 md:pb-0">
      {/* Breadcrumbs */}
      <nav className="py-4 px-5 md:px-10 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => setLocation('/learn')}
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <span className="text-[var(--text-secondary)]">→</span>
            <button
              onClick={() => setLocation('/learn')}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
            >
              Learn
            </button>
            <span className="text-[var(--text-secondary)]">→</span>
            <span className="font-semibold text-[var(--text-primary)]">{category.title}</span>
          </div>
        </div>
      </nav>

      {/* Hero/Header */}
      <section className="py-16 md:py-20 px-5 md:px-10 text-center bg-white/90 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <button
            className="mb-6 px-6 py-3 bg-[var(--accent-yellow)] text-[var(--text-primary)] rounded-full font-semibold hover:bg-[var(--accent-blue)] hover:text-white transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => setLocation('/learn')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Categories
          </button>
          <div className="w-20 h-20 bg-[var(--accent-blue)] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white text-3xl font-black">{category.title.charAt(0)}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">{category.title}</h1>
          <div className="text-[var(--text-secondary)] text-lg md:text-xl mb-6 prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: category.description }} />
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              {Array.from({ length: categoryChapters.length }, (_, i) => (
                <div
                  key={i}
                  className={`progress-dot ${i < completedCount ? 'completed' : i === completedCount ? 'current' : ''}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold">{Math.round((completedCount / (categoryChapters.length || 1)) * 100)}% Complete</span>
          </div>
        </div>
      </section>

      {/* Lessons & Book Summaries */}
      <section className="max-w-6xl mx-auto px-5 md:px-10 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Lessons */}
          <div className="flex-1">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="text-2xl">📖</span> Lessons
                <span className="text-lg font-normal text-[var(--text-secondary)]">({lessons.length})</span>
              </h2>
              {lessons.length === 0 ? (
                <div className="text-[var(--text-secondary)] text-lg py-8 text-center">
                  No lessons yet for this category.
                </div>
              ) : (
                <div className="grid gap-6">
                  {lessons.map((chapter: any) => (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      onChapterClick={() => setLocation(`/chapter/${chapter.slug}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Book Summaries */}
          <div className="flex-1">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="text-2xl">📚</span> Book Summaries
                <span className="text-lg font-normal text-[var(--text-secondary)]">({bookSummaries.length})</span>
              </h2>
              {bookSummaries.length === 0 ? (
                <div className="text-[var(--text-secondary)] text-lg py-8 text-center">
                  No book summaries yet for this category.
                </div>
              ) : (
                <div className="grid gap-6">
                {bookSummaries.map((book: any) => (
                  <div
                    key={book.id}
                    className={`chapter-card ${book.completed ? 'completed' : ''} cursor-pointer`}
                    onClick={() => setLocation(`/chapter/${book.slug}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📖</span>
                          <div className={`status-dot ${book.completed ? 'completed' : 'current'}`}></div>
                        </div>
                        <span className="text-sm text-[var(--text-secondary)] bg-[var(--accent-yellow)] px-2 py-1 rounded-full">
                          {book.readingTime || 15} min read
                        </span>
                      </div>
                      <h4 className="font-bold text-lg mb-2">{book.title}</h4>
                      {book.author && (
                        <p className="text-sm text-[var(--text-secondary)] mb-3">by {book.author}</p>
                      )}
                      <div className="text-sm text-[var(--text-secondary)] prose prose-sm max-w-none mb-4" 
                           dangerouslySetInnerHTML={{ __html: book.description }} />
                      {/* Enhanced Audio Player */}
                      {book.audioUrl && (
                        <div 
                          className="mt-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EnhancedAudioPlayer 
                            src={book.audioUrl} 
                            title="Audio Version"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <MobileNav />
    </div>
  );
} 
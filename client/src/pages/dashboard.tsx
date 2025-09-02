import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, BookOpen, MessageSquare, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["/api/chapters"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  const totalChapters = chapters.length;
  const completedChapters = progress.filter((p: any) => p.completed).length;

  const categoriesWithProgress = categories.map((category: any) => {
    const categoryChapters = chapters.filter((c: any) => c.categoryId === category.id);
    const categoryProgress = progress.filter((p: any) => 
      p.completed && categoryChapters.some((c: any) => c.id === p.chapterId)
    ).length;
    
    return {
      ...category,
      progress: categoryProgress,
      total: categoryChapters.length,
      path: `/learn#${category.slug}`
    };
  });

  const recentChapters = chapters
    .filter((chapter: any) => {
      const chapterProgress = progress.find((p: any) => p.chapterId === chapter.id);
      return chapterProgress && !chapterProgress.completed;
    })
    .slice(0, 2);

  const completedThisWeek = progress.filter((p: any) => {
    const completedDate = new Date(p.completedAt || p.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return p.completed && completedDate > weekAgo;
  }).length;

  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there';
    
    if (hour < 12) {
      return `Good morning, ${firstName}!`;
    } else if (hour < 17) {
      return `Good afternoon, ${firstName}!`;
    } else {
      return `Good evening, ${firstName}!`;
    }
  };

  const getActivityMessage = () => {
    if (completedThisWeek > 0) {
      return `You've completed ${completedThisWeek} chapter${completedThisWeek > 1 ? 's' : ''} this week!`;
    } else if (recentChapters.length > 0) {
      return "Ready to continue your learning journey?";
    } else if (completedChapters === totalChapters) {
      return "Congratulations! You've completed all available content.";
    } else {
      return "Ready to start building your management skills?";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-20 md:pb-0">
      {/* Welcome Section */}
      <section className="py-16 md:py-20 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start">
            <div className="flex-1">
              <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-2">{getPersonalizedGreeting()}</p>
              <h1 className="text-[clamp(32px,5vw,48px)] font-black tracking-[-1px] leading-[1.1] mb-6 text-[var(--text-primary)]">Keep Building Your Management Skills</h1>
              <p className="text-lg text-[var(--text-secondary)] max-w-md mb-8">
                {getActivityMessage()}
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setLocation('/learn')}
                  className="bg-[var(--accent-blue)] text-white px-6 py-3 rounded-full font-semibold hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  {recentChapters.length > 0 ? 'Continue Learning' : 'Start Learning'}
                </Button>
                <Button 
                  onClick={() => setLocation('/chat')}
                  variant="outline"
                  className="px-6 py-3 rounded-full font-semibold border-2 border-[var(--accent-blue)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white transition-all duration-300 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ask AI Coach
                </Button>
              </div>
            </div>
            <div className="flex-1 max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-lg">
              <h3 className="text-lg md:text-xl font-bold mb-3">Your Progress</h3>
              <p className="text-[var(--text-secondary)] text-base mb-6">
                You've completed {completedChapters} out of {totalChapters} chapters
              </p>
              <ProgressBar current={completedChapters} total={totalChapters} />
              <p className="text-sm text-[var(--text-secondary)] font-medium">
                {recentChapters[0] ? `Next: ${recentChapters[0].title}` : 'All chapters completed!'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Learning */}
      {recentChapters.length > 0 && (
        <section className="py-12 md:py-16 px-5 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="section-header mb-4">Continue Your Journey</h2>
              <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                Pick up where you left off or explore new topics
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12 overflow-x-auto">
              {recentChapters.map((chapter: any) => (
                <div
                  key={chapter.id}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => setLocation(`/chapter/${chapter.slug}`)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white border-4 border-[var(--text-primary)] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <div className="w-6 h-6 bg-[var(--text-primary)] rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{chapter.title}</h3>
                      <p className="text-[var(--text-secondary)] text-sm mb-3">
                        {categories.find((c: any) => c.id === chapter.categoryId)?.title}
                      </p>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Pick up where you left off in this management essential
                      </p>
                    </div>
                    <div className="bg-[var(--accent-yellow)] px-4 py-2 rounded-full text-sm font-semibold">
                      Continue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Overview */}
      <section className="py-12 md:py-16 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="section-header mb-4">Explore All Topics</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              Master the three pillars of effective management
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 overflow-x-auto">
            {categoriesWithProgress.map((category: any) => (
              <div
                key={category.id}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => setLocation('/learn')}
              >
                <div className="mb-6">
                  <div className="w-16 h-16 bg-white border-4 border-[var(--text-primary)] rounded-2xl flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-[var(--text-primary)] rounded-lg"></div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm">{category.description}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {Array.from({ length: category.total }, (_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                          i < category.progress 
                            ? 'bg-[var(--accent-yellow)] ring-2 ring-[var(--accent-yellow)] ring-opacity-30' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {category.progress} of {category.total} chapters
                  </p>
                </div>
                
                <div className="bg-[var(--accent-yellow)] px-4 py-2 rounded-full text-sm font-semibold text-center">
                  {category.progress === 0 ? 'Start Learning' : 'Continue'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MobileNav />
    </div>
  );
}

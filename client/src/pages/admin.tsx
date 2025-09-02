import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, BookOpen, FolderPlus, TrendingUp, Target, Users } from "lucide-react";

// Import required components
import { TiptapEditor } from "@/components/ui/TiptapEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AudioRecorder } from "@/components/ui/AudioRecorder";
import { AudioControls } from "@/components/AudioControls";
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';

// Lazy load heavy components for better performance
const ChapterEditor = lazy(() => import("@/components/admin/ChapterEditor").then(module => ({default: module.ChapterEditor})));
const ContentAnalytics = lazy(() => import("@/components/admin/ContentAnalytics").then(module => ({default: module.ContentAnalytics})));
const BulkOperations = lazy(() => import("@/components/admin/BulkOperations").then(module => ({default: module.BulkOperations})));

// Add types for Category and Chapter
interface Category {
  id: number;
  title: string;
  description: string;
  sortOrder: number;
}

interface Chapter {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  categoryId: number;
  chapterNumber: number;
  estimatedMinutes: number;
  podcastUrl?: string;
  podcastHeader?: string;
  videoUrl?: string;
  videoHeader?: string;
  // Book summary fields
  contentType?: 'lesson' | 'book_summary';
  author?: string;
  readingTime?: number;
  keyTakeaways?: string[];
  audioUrl?: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  // Add preview mode state
  const [previewMode, setPreviewMode] = useState(false);
  // Add content type state
  const [contentType, setContentType] = useState<'lesson' | 'book_summary'>('lesson');

  // Edit/delete state
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);

  // Category form state
  const [categoryData, setCategoryData] = useState({
    title: "",
    description: "",
    sortOrder: 1,
  });

  // Chapter form state
  const [chapterData, setChapterData] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    categoryId: "",
    chapterNumber: 1,
    estimatedMinutes: 5,
    podcastUrl: "",
    podcastHeader: "Podcast",
    videoUrl: "",
    videoHeader: "Video",
    // Book summary fields
    contentType: 'lesson' as 'lesson' | 'book_summary',
    author: "",
    readingTime: 15,
    keyTakeaways: [] as string[],
    audioUrl: "",
  });

  // Enhanced auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Auto-save draft to localStorage for both new and existing chapters
  useEffect(() => {
    if (showChapterForm) {
      const draftKey = editChapter ? `chapterDraft_${editChapter.id}` : 'newChapterDraft';
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && !isDirty) {
        try {
          const parsed = JSON.parse(savedDraft);
          setChapterData(parsed.data);
          setLastSaved(new Date(parsed.savedAt));
          toast({
            title: "Draft restored",
            description: `Restored from ${new Date(parsed.savedAt).toLocaleTimeString()}`,
          });
        } catch (e) {
          console.error('Failed to restore draft:', e);
        }
      }
    }
  }, [showChapterForm, editChapter, isDirty]);

  // Enhanced auto-save with debouncing
  useEffect(() => {
    if (!showChapterForm || !isDirty) return;

    const saveTimer = setTimeout(async () => {
      setIsAutoSaving(true);
      const draftKey = editChapter ? `chapterDraft_${editChapter.id}` : 'newChapterDraft';
      const draftData = {
        data: chapterData,
        savedAt: new Date().toISOString(),
        isEdit: !!editChapter
      };
      
      try {
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (e) {
        toast({
          title: "Auto-save failed",
          description: "Local storage might be full",
          variant: "destructive"
        });
      } finally {
        setIsAutoSaving(false);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [chapterData, showChapterForm, isDirty, editChapter, toast]);

  // Track changes to mark as dirty
  const updateChapterData = (updates: Partial<typeof chapterData>) => {
    setChapterData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  // Clear drafts on successful save
  const clearDraft = () => {
    const draftKey = editChapter ? `chapterDraft_${editChapter.id}` : 'newChapterDraft';
    localStorage.removeItem(draftKey);
    setLastSaved(null);
    setIsDirty(false);
  };

  // Fetch categories and chapters
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch content analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/content"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/content");
      return res.json();
    },
  });

  // Pagination state for chapters
  const [chapterPage, setChapterPage] = useState(1);
  const chapterPageSize = 10;

  // Fetch paginated chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ["/api/chapters", chapterPage, chapterPageSize],
    queryFn: async () => {
      const res = await fetch(`/api/chapters?page=${chapterPage}&pageSize=${chapterPageSize}`);
      return res.json();
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryData) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryData({ title: "", description: "", sortOrder: 1 });
      setShowCategoryForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create chapter mutation
  const createChapterMutation = useMutation({
    mutationFn: async (data: typeof chapterData) => {
      const response = await apiRequest("POST", "/api/chapters", {
        ...data,
        categoryId: parseInt(data.categoryId),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chapter created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      clearDraft();
      setChapterData({
        title: "",
        slug: "",
        description: "",
        content: "",
        categoryId: "",
        chapterNumber: 1,
        estimatedMinutes: 5,
        podcastUrl: "",
        podcastHeader: "Podcast",
        videoUrl: "",
        videoHeader: "Video",
        contentType: 'lesson',
        author: "",
        readingTime: 15,
        keyTakeaways: [],
        audioUrl: "",
      });
      setShowChapterForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update chapter mutation
  const updateChapterMutation = useMutation({
    mutationFn: async (data: typeof chapterData & { id: number }) => {
      const response = await apiRequest("PUT", `/api/chapters/${data.id}`, {
        ...data,
        categoryId: parseInt(data.categoryId),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chapter updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      clearDraft();
      setChapterData({
        title: "",
        slug: "",
        description: "",
        content: "",
        categoryId: "",
        chapterNumber: 1,
        estimatedMinutes: 5,
        podcastUrl: "",
        podcastHeader: "Podcast",
        videoUrl: "",
        videoHeader: "Video",
        contentType: 'lesson',
        author: "",
        readingTime: 15,
        keyTakeaways: [],
        audioUrl: "",
      });
      setEditChapter(null);
      setShowChapterForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk selection state for chapters
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  
  // Bulk operations state
  const [showBulkCategoryDialog, setShowBulkCategoryDialog] = useState(false);
  const [showBulkReorderDialog, setShowBulkReorderDialog] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");

  const handleSelectChapter = (id: number, checked: boolean) => {
    setSelectedChapters((prev) =>
      checked ? [...prev, id] : prev.filter((cid) => cid !== id)
    );
  };

  const handleSelectAllChapters = (checked: boolean) => {
    if (checked) {
      setSelectedChapters(chapters.map((c) => c.id));
    } else {
      setSelectedChapters([]);
    }
  };

  const handleBulkDeleteChapters = () => {
    if (window.confirm('Delete all selected chapters? This cannot be undone.')) {
      selectedChapters.forEach((id) => deleteChapterMutation.mutate(id));
      setSelectedChapters([]);
    }
  };

  // Bulk category change
  const handleBulkCategoryChange = () => {
    setShowBulkCategoryDialog(true);
  };

  const handleBulkCategorySubmit = async () => {
    if (!bulkCategoryId) return;
    
    try {
      await Promise.all(
        selectedChapters.map(id => 
          fetch(`/api/chapters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId: parseInt(bulkCategoryId) })
          })
        )
      );
      
      toast({
        title: "Success",
        description: `Updated ${selectedChapters.length} chapters`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setSelectedChapters([]);
      setShowBulkCategoryDialog(false);
      setBulkCategoryId("");
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update chapters",
        variant: "destructive"
      });
    }
  };

  // Bulk reorder
  const handleBulkReorder = () => {
    setShowBulkReorderDialog(true);
  };

  // Bulk export
  const handleBulkExport = () => {
    const selectedChapterData = chapters.filter(c => selectedChapters.includes(c.id));
    const exportData = {
      chapters: selectedChapterData,
      categories: categories,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapters-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Exported ${selectedChapters.length} chapters`,
    });
  };

  // Handle drag end for chapters
  const handleChapterDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(chapters);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    // Persist new order to backend
    const order = reordered.map((chapter, idx) => ({ id: chapter.id, chapterNumber: idx + 1 }));
    fetch('/api/chapters/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  };

  // Bulk selection state for categories
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const handleSelectCategory = (id: number, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, id] : prev.filter((cid) => cid !== id)
    );
  };

  const handleSelectAllCategories = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(categories.map((c) => c.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleBulkDeleteCategories = () => {
    if (window.confirm('Delete all selected categories? This cannot be undone.')) {
      selectedCategories.forEach((id) => deleteCategoryMutation.mutate(id));
      setSelectedCategories([]);
    }
  };

  // Handle drag end for categories
  const handleCategoryDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(categories);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    // Persist new order to backend
    const order = reordered.map((cat, idx) => ({ id: cat.id, sortOrder: idx + 1 }));
    fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  };

  // Mutations for delete
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteCategoryId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  const deleteChapterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chapters/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Chapter deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setDeleteChapterId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Edit handlers
  function handleEditCategory(category: Category) {
    setEditCategory(category);
    setShowCategoryForm(true);
    setCategoryData({
      title: category.title,
      description: category.description,
      sortOrder: category.sortOrder,
    });
  }
  function handleEditChapter(chapter: Chapter) {
    setEditChapter(chapter);
    setShowChapterForm(true);
    setChapterData({
      title: chapter.title,
      slug: chapter.slug,
      description: chapter.description,
      content: chapter.content,
      categoryId: chapter.categoryId.toString(),
      chapterNumber: chapter.chapterNumber,
      estimatedMinutes: chapter.estimatedMinutes,
      podcastUrl: chapter.podcastUrl || "",
      podcastHeader: chapter.podcastHeader || "Podcast",
      videoUrl: chapter.videoUrl || "",
      videoHeader: chapter.videoHeader || "Video",
      contentType: chapter.contentType || 'lesson',
      author: chapter.author || "",
      readingTime: chapter.readingTime || 15,
      keyTakeaways: chapter.keyTakeaways || [],
      audioUrl: chapter.audioUrl || "",
    });
  }

  function handleAddChapter() {
    setEditChapter(null);
    // Clear localStorage draft for new chapters
    localStorage.removeItem('chapterDraft');
    localStorage.removeItem('newChapterDraft');
    setLastSaved(null);
    setIsDirty(false);
    setChapterData({
      title: "",
      slug: "",
      description: "",
      content: "",
      categoryId: "",
      chapterNumber: 1,
      estimatedMinutes: 5,
      podcastUrl: "",
      podcastHeader: "Podcast",
      videoUrl: "",
      videoHeader: "Video",
      contentType: 'lesson',
      author: "",
      readingTime: 15,
      keyTakeaways: [],
      audioUrl: "",
    });
    setShowChapterForm(true);
  }

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(categoryData);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (editChapter) {
      // Update existing chapter
      updateChapterMutation.mutate({ ...chapterData, id: editChapter.id });
    } else {
      // Create new chapter
      createChapterMutation.mutate(chapterData);
    }
  };

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Helper to render media embed
  function renderMediaEmbed(url: string) {
    if (!url) return null;
    // Spotify
    if (url.includes("spotify.com/episode/") || url.includes("spotify.com/show/")) {
      return (
        <iframe
          src={url.replace("/show/", "/embed/show/").replace("/episode/", "/embed/episode/")}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg my-4"
        ></iframe>
      );
    }
    // YouTube
    const ytMatch = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    if (ytMatch) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          width="100%"
          height="315"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg my-4"
        ></iframe>
      );
    }
    // TED
    const tedMatch = url.match(/ted.com\/talks\/([\w-]+)/);
    if (tedMatch) {
      return (
        <iframe
          src={`https://embed.ted.com/talks/${tedMatch[1]}`}
          width="100%"
          height="315"
          frameBorder="0"
          allowFullScreen
          className="rounded-lg my-4"
        ></iframe>
      );
    }
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-5 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
          Content Management
        </h1>
        <p className="text-[var(--text-secondary)] text-lg md:text-xl">
          Add and manage learning content for Level Up
        </p>
      </div>

      {/* Content Analytics Dashboard */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Content Analytics
        </h2>
        
        {analyticsLoading ? (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Total Engagement</p>
                      <p className="text-2xl font-bold text-[var(--accent-blue)]">{analytics.summary?.totalEngagement || 0}</p>
                    </div>
                    <Target className="w-8 h-8 text-[var(--accent-blue)]" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Active Users</p>
                      <p className="text-2xl font-bold text-[var(--accent-yellow)]">{analytics.userEngagement?.activeUsers || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-[var(--accent-yellow)]" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.userEngagement?.completionRate || 0}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Avg Chapters/User</p>
                      <p className="text-2xl font-bold text-purple-600">{analytics.userEngagement?.avgChaptersPerUser || 0}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Content */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📈 Most Popular Chapters</CardTitle>
                  <CardDescription>Chapters with highest completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.chapterStats?.slice(0, 5).map((chapter: any, index: number) => (
                      <div key={chapter.chapterId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{chapter.title}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{chapter.categoryTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[var(--accent-blue)]">{chapter.completions || 0} completions</p>
                          <p className="text-xs text-green-600">{chapter.completionRate || 0}% rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔥 Trending This Week</CardTitle>
                  <CardDescription>Recently completed content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.trendingChapters?.slice(0, 5).map((chapter: any, index: number) => (
                      <div key={chapter.chapterId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{chapter.title}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{chapter.categoryTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{chapter.recentCompletions} this week</p>
                          <p className="text-xs text-green-500">↗ Trending</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Performance */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">📊 Category Performance</CardTitle>
                <CardDescription>Engagement by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {analytics.categoryStats?.map((category: any) => (
                    <div key={category.categoryId} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold mb-2">{category.categoryTitle}</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-[var(--text-secondary)]">Chapters:</span> {category.totalChapters}</p>
                        <p><span className="text-[var(--text-secondary)]">Completions:</span> {category.totalCompletions}</p>
                        <p><span className="text-[var(--text-secondary)]">Users:</span> {category.totalUsers}</p>
                        <p><span className="text-[var(--text-secondary)]">Rate:</span> <span className="font-semibold text-[var(--accent-blue)]">{category.avgCompletionRate}%</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Engagement Alert */}
            {analytics.summary?.leastEngagedChapters?.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-800">⚠️ Need Attention</CardTitle>
                  <CardDescription className="text-orange-700">Chapters with low engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.summary.leastEngagedChapters.map((chapter: any) => (
                      <div key={chapter.chapterId} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <p className="font-semibold text-sm">{chapter.title}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{chapter.categoryTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-600 font-bold">{chapter.completions || 0} completions</p>
                          <p className="text-xs text-orange-500">{chapter.completionRate || 0}% rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-[var(--text-secondary)]">No analytics data available yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-12 md:gap-16">
        {/* Categories Section */}
        <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Categories</h2>
                  <Button
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    className="bg-[var(--accent-yellow)] text-[var(--text-primary)] hover:bg-[var(--accent-yellow)]/80 text-lg font-semibold px-6 py-3 shadow-md"
                  >
                    <FolderPlus className="w-5 h-5 mr-2" />
                    Add Category
                  </Button>
                </div>

                {showCategoryForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Create New Category</CardTitle>
                      <CardDescription>
                        Categories group related learning content together
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateCategory} className="space-y-4">
                        <div>
                          <Label htmlFor="categoryTitle">Title</Label>
                          <Input
                            id="categoryTitle"
                            value={categoryData.title}
                            onChange={(e) => setCategoryData({ ...categoryData, title: e.target.value })}
                            placeholder="e.g., Leadership Foundations"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="categoryDescription">Description</Label>
                          <TiptapEditor
                            value={categoryData.description}
                            onChange={(html) => setCategoryData({ ...categoryData, description: html })}
                            placeholder="Brief description of what this category covers"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sortOrder">Sort Order</Label>
                          <Input
                            id="sortOrder"
                            type="number"
                            value={categoryData.sortOrder}
                            onChange={(e) => setCategoryData({ ...categoryData, sortOrder: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            type="submit" 
                            disabled={createCategoryMutation.isPending}
                            className="bg-[var(--text-primary)] text-[var(--bg-primary)]"
                          >
                            {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCategoryForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <DragDropContext onDragEnd={handleCategoryDragEnd}>
                  <Droppable droppableId="category-list">
                    {(provided) => (
                      <div className="space-y-3" ref={provided.innerRef} {...provided.droppableProps}>
                        {categories.length === 0 ? (
                          <p className="text-[var(--text-secondary)] text-center py-8">
                            No categories yet. Create your first category to get started.
                          </p>
                        ) : (
                          categories.map((category: Category, index: number) => (
                      <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-shadow ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                          >
                            <Card>
                              <CardContent className="p-6 md:p-8 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category.id)}
                                    onChange={(e) => handleSelectCategory(category.id, e.target.checked)}
                                    className="w-5 h-5"
                                  />
                                  <div>
                                    <h3 className="font-semibold text-[var(--text-primary)] text-lg md:text-xl mb-1">{category.title}</h3>
                                    <div className="text-base md:text-lg text-[var(--text-secondary)] mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: category.description }} />
                                    <div className="text-sm md:text-base text-[var(--text-secondary)] mt-2">Order: {category.sortOrder}</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>Edit</Button>
                                  <Button size="sm" variant="destructive" onClick={() => setDeleteCategoryId(category.id)}>Delete</Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
        </div>

        {/* Chapters Section */}
        <div>
          <div className="border-t border-gray-200 mb-8 pt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Chapters</h2>
              <Button
                onClick={handleAddChapter}
                className="bg-[var(--accent-yellow)] text-[var(--text-primary)] hover:bg-[var(--accent-yellow)]/80 text-lg font-semibold px-6 py-3 shadow-md"
                disabled={categories.length === 0}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Chapter
              </Button>
            </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              type="button"
              variant="outline"
              disabled={chapterPage === 1}
              onClick={() => setChapterPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>Page {chapterPage}</span>
            <Button
              type="button"
              variant="outline"
              disabled={chapters.length < chapterPageSize}
              onClick={() => setChapterPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>

          {/* Enhanced Bulk Actions Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedChapters.length === chapters.length && chapters.length > 0}
                onChange={(e) => handleSelectAllChapters(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-semibold">Select All ({selectedChapters.length})</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={selectedChapters.length === 0}
                onClick={handleBulkCategoryChange}
                className="text-sm"
              >
                Change Category
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={selectedChapters.length === 0}
                onClick={handleBulkReorder}
                className="text-sm"
              >
                Reorder
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={selectedChapters.length === 0}
                onClick={handleBulkExport}
                className="text-sm"
              >
                Export
              </Button>
              
              <Button
                type="button"
                variant="destructive"
                disabled={selectedChapters.length === 0}
                onClick={handleBulkDeleteChapters}
                className="text-sm"
              >
                Delete Selected
              </Button>
            </div>
          </div>

          {categories.length === 0 && (
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-4" />
                <p className="text-[var(--text-secondary)]">
                  Create at least one category before adding chapters
                </p>
              </CardContent>
            </Card>
          )}

          {/* Full-screen Dialog for Chapter Form */}
          <Dialog open={showChapterForm && categories.length > 0} onOpenChange={setShowChapterForm}>
            <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] p-0 bg-white flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-8 py-6 border-b">
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {editChapter ? 'Edit Chapter' : 'Create New Chapter'}
                  </DialogTitle>
                  <DialogDescription>
                    {editChapter ? 'Update the chapter details and content' : 'Add a new learning chapter with content and media'}
                  </DialogDescription>
                  {/* Auto-save status */}
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {isAutoSaving ? (
                      <span className="text-blue-600 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Auto-saving...
                      </span>
                    ) : lastSaved ? (
                      <span className="text-green-600">
                        ✓ Last saved: {lastSaved.toLocaleTimeString()}
                      </span>
                    ) : isDirty ? (
                      <span className="text-orange-600">● Unsaved changes</span>
                    ) : (
                      <span className="text-gray-500">Ready</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setShowChapterForm(false)} className="text-2xl px-4 py-2">✕</Button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col items-center">
                <div className="w-full max-w-3xl flex justify-end mb-4">
                  <Button
                    type="button"
                    variant={previewMode ? "default" : "outline"}
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? "Edit" : "Preview"}
                  </Button>
                </div>
                <form onSubmit={handleCreateChapter} className="w-full max-w-3xl space-y-6">
                  {previewMode ? (
                    <div className="bg-white rounded-2xl p-8 shadow-lg mb-8 mt-2">
                      <div className="prose prose-lg max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: chapterData.content }} />
                      </div>
                      {chapterData.podcastUrl && (
                        <div className="mt-8">
                          <h3 className="text-xl font-bold mb-4">{chapterData.podcastHeader}</h3>
                          {renderMediaEmbed(chapterData.podcastUrl)}
                        </div>
                      )}
                      {chapterData.videoUrl && (
                        <div className="mt-8">
                          <h3 className="text-xl font-bold mb-4">{chapterData.videoHeader}</h3>
                          {renderMediaEmbed(chapterData.videoUrl)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Suspense fallback={<div className='p-8 text-center'>Loading editor...</div>}>
                      <TiptapEditor
                        value={chapterData.content}
                        onChange={(html) => updateChapterData({ content: html })}
                        placeholder="Main content of the chapter (rich formatting supported)"
                      />
                    </Suspense>
                  )}
                  <div>
                    <Label htmlFor="chapterTitle">Title</Label>
                    <Input
                      id="chapterTitle"
                      value={chapterData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        updateChapterData({ 
                          title,
                          slug: generateSlug(title)
                        });
                      }}
                      placeholder="e.g., Building Trust with Your Team"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select 
                      value={chapterData.contentType} 
                      onValueChange={(value: 'lesson' | 'book_summary') => updateChapterData({ contentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lesson">📝 Lesson</SelectItem>
                        <SelectItem value="book_summary">📚 Book Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {chapterData.contentType === 'book_summary' && (
                    <>
                      <div>
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          value={chapterData.author}
                          onChange={(e) => setChapterData({ ...chapterData, author: e.target.value })}
                          placeholder="e.g., Jim Collins"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="readingTime">Reading Time (minutes)</Label>
                        <Input
                          id="readingTime"
                          type="number"
                          value={chapterData.readingTime}
                          onChange={(e) => setChapterData({ ...chapterData, readingTime: parseInt(e.target.value) })}
                          min="1"
                          placeholder="15"
                        />
                      </div>
                      <div>
                        <Label htmlFor="keyTakeaways">Key Takeaways (one per line)</Label>
                        <textarea
                          id="keyTakeaways"
                          value={chapterData.keyTakeaways.join('\n')}
                          onChange={(e) => setChapterData({ 
                            ...chapterData, 
                            keyTakeaways: e.target.value.split('\n').filter(takeaway => takeaway.trim())
                          })}
                          placeholder="Enter key takeaways, one per line..."
                          className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                        />
                      </div>
                      <div>
                        <AudioRecorder
                          audioUrl={chapterData.audioUrl}
                          onAudioUrlChange={(url) => setChapterData({ ...chapterData, audioUrl: url })}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="chapterSlug">URL Slug</Label>
                    <Input
                      id="chapterSlug"
                      value={chapterData.slug}
                      onChange={(e) => setChapterData({ ...chapterData, slug: e.target.value })}
                      placeholder="building-trust-with-your-team"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categorySelect">Category</Label>
                    <Select 
                      value={chapterData.categoryId} 
                      onValueChange={(value) => setChapterData({ ...chapterData, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chapterNumber">Chapter Number</Label>
                      <Input
                        id="chapterNumber"
                        type="number"
                        value={chapterData.chapterNumber}
                        onChange={(e) => setChapterData({ ...chapterData, chapterNumber: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedMinutes">Duration (minutes)</Label>
                      <Input
                        id="estimatedMinutes"
                        type="number"
                        value={chapterData.estimatedMinutes}
                        onChange={(e) => setChapterData({ ...chapterData, estimatedMinutes: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="chapterDescription">Description</Label>
                    <TiptapEditor
                      value={chapterData.description}
                      onChange={(html) => updateChapterData({ description: html })}
                      placeholder="Brief description of the chapter content"
                    />
                  </div>
                  <div>
                    <Label htmlFor="podcastUrl">Podcast URL (Spotify, optional)</Label>
                    <Input
                      id="podcastUrl"
                      value={chapterData.podcastUrl}
                      onChange={(e) => setChapterData({ ...chapterData, podcastUrl: e.target.value })}
                      placeholder="Spotify episode or show URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="podcastHeader">Podcast Header</Label>
                    <Input
                      id="podcastHeader"
                      value={chapterData.podcastHeader}
                      onChange={(e) => setChapterData({ ...chapterData, podcastHeader: e.target.value })}
                      placeholder="e.g., Listen & Learn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="videoUrl">Video URL (YouTube or TED, optional)</Label>
                    <Input
                      id="videoUrl"
                      value={chapterData.videoUrl}
                      onChange={(e) => setChapterData({ ...chapterData, videoUrl: e.target.value })}
                      placeholder="YouTube or TED talk URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="videoHeader">Video Header</Label>
                    <Input
                      id="videoHeader"
                      value={chapterData.videoHeader}
                      onChange={(e) => setChapterData({ ...chapterData, videoHeader: e.target.value })}
                      placeholder="e.g., Watch This"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={createChapterMutation.isPending || updateChapterMutation.isPending}
                      className="bg-[var(--text-primary)] text-[var(--bg-primary)]"
                    >
                      {editChapter 
                        ? (updateChapterMutation.isPending ? "Updating..." : "Update Chapter")
                        : (createChapterMutation.isPending ? "Creating..." : "Create Chapter")
                      }
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowChapterForm(false);
                        setEditChapter(null);
                        setChapterData({
                          title: "",
                          slug: "",
                          description: "",
                          content: "",
                          categoryId: "",
                          chapterNumber: 1,
                          estimatedMinutes: 5,
                          podcastUrl: "",
                          podcastHeader: "Podcast",
                          videoUrl: "",
                          videoHeader: "Video",
                          contentType: 'lesson',
                          author: "",
                          readingTime: 15,
                          keyTakeaways: [],
                          audioUrl: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          {/* Chapters List with Drag-and-Drop */}
          <DragDropContext onDragEnd={handleChapterDragEnd}>
            <Droppable droppableId="chapter-list">
              {(provided) => (
                <div className="space-y-3" ref={provided.innerRef} {...provided.droppableProps}>
                  {chapters.length === 0 ? (
                    <p className="text-[var(--text-secondary)] text-center py-8">
                      No chapters yet. Create your first chapter to get started.
                    </p>
                  ) : (
                    chapters.map((chapter: Chapter, index: number) => (
                      <Draggable key={chapter.id} draggableId={chapter.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-shadow ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                          >
                            <Card>
                              <CardContent className="p-6 md:p-8 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedChapters.includes(chapter.id)}
                                    onChange={(e) => handleSelectChapter(chapter.id, e.target.checked)}
                                    className="w-5 h-5"
                                  />
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-[var(--text-primary)] text-lg md:text-xl mb-1">{chapter.title}</h3>
                                    <div className="text-base md:text-lg text-[var(--text-secondary)] mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: chapter.description }} />
                                    
                                    {/* Audio Status */}
                                    <div className="mt-2 flex items-center gap-2">
                                      {chapter.audioUrl ? (
                                        <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                                          🎧 Audio Available
                                        </span>
                                      ) : (
                                        <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                          No Audio
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-sm md:text-base text-[var(--text-secondary)]">
                                      <span>Chapter {chapter.chapterNumber}</span>
                                      <span>{chapter.estimatedMinutes} min</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEditChapter(chapter)}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => setDeleteChapterId(chapter.id)}>Delete</Button>
                                  </div>
                                  <AudioControls chapter={chapter} />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
      </div>

      {/* Delete Category Dialog */}
      <Dialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)]">Are you sure you want to delete this category? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button onClick={() => deleteCategoryMutation.mutate(deleteCategoryId!)} className="bg-[var(--accent-yellow)] text-[var(--text-primary)]">Delete</Button>
              <Button variant="ghost" onClick={() => setDeleteCategoryId(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Chapter Dialog */}
      <Dialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)]">Are you sure you want to delete this chapter? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button onClick={() => deleteChapterMutation.mutate(deleteChapterId!)} className="bg-[var(--accent-yellow)] text-[var(--text-primary)]">Delete</Button>
              <Button variant="ghost" onClick={() => setDeleteChapterId(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Category Change Dialog */}
      <Dialog open={showBulkCategoryDialog} onOpenChange={setShowBulkCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Update category for {selectedChapters.length} selected chapters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkCategory">New Category</Label>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleBulkCategorySubmit} disabled={!bulkCategoryId}>
                Update Chapters
              </Button>
              <Button variant="ghost" onClick={() => setShowBulkCategoryDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Reorder Dialog */}
      <Dialog open={showBulkReorderDialog} onOpenChange={setShowBulkReorderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reorder Chapters</DialogTitle>
            <DialogDescription>
              Set new chapter numbers for {selectedChapters.length} selected chapters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedChapters.map((chapterId, index) => {
                const chapter = chapters.find(c => c.id === chapterId);
                return (
                  <div key={chapterId} className="flex items-center gap-3 p-2 border rounded">
                    <Input
                      type="number"
                      min="1"
                      defaultValue={chapter?.chapterNumber || index + 1}
                      className="w-20"
                      onBlur={(e) => {
                        const newNumber = parseInt(e.target.value);
                        // Could store these values in state for bulk update
                      }}
                    />
                    <span className="flex-1 text-sm">{chapter?.title}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => {
                toast({ title: "Feature coming soon", description: "Bulk reorder will be available in next update" });
                setShowBulkReorderDialog(false);
              }}>
                Update Order
              </Button>
              <Button variant="ghost" onClick={() => setShowBulkReorderDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

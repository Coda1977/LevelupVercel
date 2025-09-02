import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, BookOpen, FolderPlus, Edit, Trash2, ShieldAlert } from "lucide-react";
import { TiptapEditor } from "@/components/ui/TiptapEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AudioControls } from "@/components/AudioControls";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";

// Types
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
  contentType?: 'lesson' | 'book_summary';
  author?: string;
  readingTime?: number;
  keyTakeaways?: string[];
  audioUrl?: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  
  // Show loading while checking admin status
  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Checking admin access...</p>
        </div>
      </div>
    );
  }
  
  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
              {user?.email && (
                <div className="mt-2 text-sm">
                  Logged in as: <span className="font-medium">{user.email}</span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you believe you should have access, please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

  const [categoryData, setCategoryData] = useState({
    title: '',
    description: '',
    sortOrder: 1
  });

  const [chapterData, setChapterData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    categoryId: 0,
    chapterNumber: 1,
    estimatedMinutes: 5,
    podcastUrl: '',
    podcastHeader: '',
    videoUrl: '',
    videoHeader: '',
    contentType: 'lesson' as 'lesson' | 'book_summary',
    author: '',
    readingTime: 15,
    keyTakeaways: [] as string[]
  });

  // Queries
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: chapters = [] } = useQuery<Chapter[]>({ queryKey: ["/api/chapters"] });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryData) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Category created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowCategoryForm(false);
      setCategoryData({ title: '', description: '', sortOrder: 1 });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof categoryData> }) => {
      const response = await apiRequest("PATCH", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Category updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditCategory(null);
      setCategoryData({ title: '', description: '', sortOrder: 1 });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Category deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteCategoryId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const createChapterMutation = useMutation({
    mutationFn: async (data: typeof chapterData) => {
      const response = await apiRequest("POST", "/api/chapters", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Chapter created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setShowChapterForm(false);
      resetChapterForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateChapterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof chapterData> }) => {
      const response = await apiRequest("PATCH", `/api/chapters/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Chapter updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setEditChapter(null);
      resetChapterForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/chapters/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Chapter deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setDeleteChapterId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Helper functions
  const resetChapterForm = () => {
    setChapterData({
      title: '',
      slug: '',
      description: '',
      content: '',
      categoryId: 0,
      chapterNumber: 1,
      estimatedMinutes: 5,
      podcastUrl: '',
      podcastHeader: '',
      videoUrl: '',
      videoHeader: '',
      contentType: 'lesson',
      author: '',
      readingTime: 15,
      keyTakeaways: []
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCategory) {
      updateCategoryMutation.mutate({ id: editCategory.id, data: categoryData });
    } else {
      createCategoryMutation.mutate(categoryData);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditCategory(category);
    setCategoryData({
      title: category.title,
      description: category.description,
      sortOrder: category.sortOrder
    });
    setShowCategoryForm(true);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (editChapter) {
      updateChapterMutation.mutate({ id: editChapter.id, data: chapterData });
    } else {
      createChapterMutation.mutate(chapterData);
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditChapter(chapter);
    setChapterData({
      title: chapter.title,
      slug: chapter.slug,
      description: chapter.description,
      content: chapter.content,
      categoryId: chapter.categoryId,
      chapterNumber: chapter.chapterNumber,
      estimatedMinutes: chapter.estimatedMinutes,
      podcastUrl: chapter.podcastUrl || '',
      podcastHeader: chapter.podcastHeader || '',
      videoUrl: chapter.videoUrl || '',
      videoHeader: chapter.videoHeader || '',
      contentType: chapter.contentType || 'lesson',
      author: chapter.author || '',
      readingTime: chapter.readingTime || 15,
      keyTakeaways: chapter.keyTakeaways || []
    });
    setShowChapterForm(true);
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (chapterData.title && !editChapter) {
      const slug = chapterData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setChapterData(prev => ({ ...prev, slug }));
    }
  }, [chapterData.title, editChapter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-white p-3 md:p-5">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-[var(--text-primary)] tracking-tight">
          Admin Dashboard
        </h1>

        <div className="grid lg:grid-cols-2 gap-12 md:gap-16">
          {/* Categories Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Categories</h2>
              <Button
                onClick={() => {
                  setEditCategory(null);
                  setCategoryData({ title: '', description: '', sortOrder: categories.length + 1 });
                  setShowCategoryForm(!showCategoryForm);
                }}
                className="bg-[var(--accent-yellow)] text-[var(--text-primary)] hover:bg-[var(--accent-yellow)]/80 text-lg font-semibold px-6 py-3 shadow-md"
              >
                <FolderPlus className="w-5 h-5 mr-2" />
                Add Category
              </Button>
            </div>

            {showCategoryForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editCategory ? 'Edit Category' : 'Create New Category'}</CardTitle>
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
                        disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        className="bg-[var(--accent-yellow)] text-[var(--text-primary)]"
                      >
                        {editCategory ? 'Update' : 'Create'} Category
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditCategory(null);
                          setCategoryData({ title: '', description: '', sortOrder: 1 });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {categories?.map((category: Category) => (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-2">{category.title}</h3>
                        <div className="text-[var(--text-secondary)] prose prose-sm max-w-none" 
                             dangerouslySetInnerHTML={{ __html: category.description }} />
                        <p className="text-sm text-[var(--text-secondary)] mt-2">Sort Order: {category.sortOrder}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteCategoryId(category.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Chapters Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Chapters</h2>
              <Button
                onClick={() => {
                  setEditChapter(null);
                  resetChapterForm();
                  setShowChapterForm(true);
                }}
                disabled={categories.length === 0}
                className="bg-[var(--accent-yellow)] text-[var(--text-primary)] hover:bg-[var(--accent-yellow)]/80 text-lg font-semibold px-6 py-3 shadow-md"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Add Chapter
              </Button>
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

            <div className="space-y-3">
              {chapters?.map((chapter: Chapter) => (
                <Card key={chapter.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-1">{chapter.title}</h3>
                        <div className="text-[var(--text-secondary)] prose prose-sm max-w-none mb-2" 
                             dangerouslySetInnerHTML={{ __html: chapter.description }} />
                        
                        {/* Content Type Badge */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className={`text-sm px-2 py-1 rounded ${
                            chapter.contentType === 'book_summary' 
                              ? 'text-blue-600 bg-blue-50' 
                              : 'text-green-600 bg-green-50'
                          }`}>
                            {chapter.contentType === 'book_summary' ? '📚 Book Summary' : '📝 Lesson'}
                          </span>
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

                        {/* Book Summary Details */}
                        {chapter.contentType === 'book_summary' && chapter.author && (
                          <div className="mt-2 text-sm text-[var(--text-secondary)]">
                            <span className="font-medium">Author:</span> {chapter.author}
                            {chapter.readingTime && <span className="ml-3"><span className="font-medium">Reading Time:</span> {chapter.readingTime} min</span>}
                            {chapter.keyTakeaways && chapter.keyTakeaways.length > 0 && (
                              <div className="mt-1">
                                <span className="font-medium">Key Takeaways:</span> {chapter.keyTakeaways.length} points
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-2 text-sm text-[var(--text-secondary)]">
                          <span>Chapter {chapter.chapterNumber}</span>
                          <span>{chapter.estimatedMinutes} min</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditChapter(chapter)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteChapterId(chapter.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <AudioControls chapter={chapter} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Chapter Form Dialog */}
        <Dialog open={showChapterForm} onOpenChange={setShowChapterForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editChapter ? 'Edit Chapter' : 'Create New Chapter'}</DialogTitle>
              <DialogDescription>
                {editChapter ? 'Update the chapter details and content' : 'Add a new learning chapter'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chapterTitle">Title</Label>
                  <Input
                    id="chapterTitle"
                    value={chapterData.title}
                    onChange={(e) => setChapterData({ ...chapterData, title: e.target.value })}
                    placeholder="e.g., Introduction to Leadership"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="chapterSlug">Slug</Label>
                  <Input
                    id="chapterSlug"
                    value={chapterData.slug}
                    onChange={(e) => setChapterData({ ...chapterData, slug: e.target.value })}
                    placeholder="e.g., introduction-to-leadership"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select value={chapterData.categoryId.toString()} onValueChange={(value) => setChapterData({ ...chapterData, categoryId: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={chapterData.contentType} onValueChange={(value: 'lesson' | 'book_summary') => setChapterData({ ...chapterData, contentType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson">📝 Lesson</SelectItem>
                      <SelectItem value="book_summary">📚 Book Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
                  <Input
                    id="estimatedMinutes"
                    type="number"
                    value={chapterData.estimatedMinutes}
                    onChange={(e) => setChapterData({ ...chapterData, estimatedMinutes: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              {/* Book Summary Fields */}
              {chapterData.contentType === 'book_summary' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">📚 Book Summary Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={chapterData.author}
                        onChange={(e) => setChapterData({ ...chapterData, author: e.target.value })}
                        placeholder="e.g., Jim Collins"
                        required={chapterData.contentType === 'book_summary'}
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
                  </div>
                  <div>
                    <Label htmlFor="keyTakeaways">Key Takeaways (3-6 points, one per line)</Label>
                    <textarea
                      id="keyTakeaways"
                      value={chapterData.keyTakeaways.join('\n')}
                      onChange={(e) => setChapterData({ 
                        ...chapterData, 
                        keyTakeaways: e.target.value.split('\n').filter(takeaway => takeaway.trim()).slice(0, 6)
                      })}
                      placeholder="Enter 3-6 key takeaways, one per line:&#10;• Clear, actionable insights from the book&#10;• Focus on practical management concepts&#10;• Keep each point concise (1-2 sentences max)"
                      className="w-full p-3 border border-gray-300 rounded-md min-h-[120px] resize-vertical"
                      rows={6}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {chapterData.keyTakeaways.length}/6 takeaways • Focus on actionable insights that managers can apply immediately
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <TiptapEditor
                  value={chapterData.description}
                  onChange={(html) => setChapterData({ ...chapterData, description: html })}
                  placeholder="Brief description of the chapter"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <TiptapEditor
                  value={chapterData.content}
                  onChange={(html) => setChapterData({ ...chapterData, content: html })}
                  placeholder="Full chapter content"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={createChapterMutation.isPending || updateChapterMutation.isPending}
                  className="bg-[var(--accent-yellow)] text-[var(--text-primary)]"
                >
                  {editChapter ? 'Update' : 'Create'} Chapter
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setShowChapterForm(false);
                    setEditChapter(null);
                    resetChapterForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialogs */}
        <Dialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this category? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button onClick={() => deleteCategoryMutation.mutate(deleteCategoryId!)} variant="destructive">
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setDeleteCategoryId(null)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Chapter</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this chapter? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button onClick={() => deleteChapterMutation.mutate(deleteChapterId!)} variant="destructive">
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setDeleteChapterId(null)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
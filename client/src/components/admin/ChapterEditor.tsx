import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TiptapEditor } from "@/components/ui/TiptapEditor";
import { AudioRecorder } from "@/components/ui/AudioRecorder";
import { AudioControls } from "@/components/AudioControls";
import { Plus, BookOpen } from "lucide-react";

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

interface ChapterEditorProps {
  categories: Category[];
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  formData: Partial<Chapter>;
  setFormData: (data: Partial<Chapter>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  isGeneratingAudio: boolean;
  onGenerateAudio: () => void;
  lastSaved: Date | null;
  isDirty: boolean;
  isAutoSaving: boolean;
}

export function ChapterEditor({
  categories,
  showForm,
  setShowForm,
  formData,
  setFormData,
  onSubmit,
  isEditing,
  isGeneratingAudio,
  onGenerateAudio,
  lastSaved,
  isDirty,
  isAutoSaving
}: ChapterEditorProps) {
  if (!showForm) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {isEditing ? 'Edit Chapter' : 'Create New Chapter'}
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Update chapter information' : 'Add a new chapter to your content library'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isAutoSaving && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                Saving...
              </div>
            )}
            {lastSaved && !isDirty && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {isDirty && !isAutoSaving && (
              <div className="flex items-center gap-1 text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Unsaved changes
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Chapter title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-friendly-slug"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.categoryId?.toString() || ''} 
                onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
            <div className="space-y-2">
              <Label htmlFor="chapterNumber">Chapter Number</Label>
              <Input
                id="chapterNumber"
                type="number"
                value={formData.chapterNumber || ''}
                onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) || 1 })}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
              <Input
                id="estimatedMinutes"
                type="number"
                value={formData.estimatedMinutes || ''}
                onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 5 })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type</Label>
            <Select 
              value={formData.contentType || 'lesson'} 
              onValueChange={(value: 'lesson' | 'book_summary') => setFormData({ ...formData, contentType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">Lesson</SelectItem>
                <SelectItem value="book_summary">Book Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.contentType === 'book_summary' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={formData.author || ''}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Book author"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="readingTime">Reading Time (minutes)</Label>
                  <Input
                    id="readingTime"
                    type="number"
                    value={formData.readingTime || ''}
                    onChange={(e) => setFormData({ ...formData, readingTime: parseInt(e.target.value) || undefined })}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyTakeaways">Key Takeaways (one per line)</Label>
                <textarea
                  id="keyTakeaways"
                  value={formData.keyTakeaways?.join('\n') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    keyTakeaways: e.target.value.split('\n').filter(line => line.trim())
                  })}
                  placeholder="Enter key takeaways, one per line"
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-md resize-y"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the chapter"
              required
              className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-md resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <TiptapEditor
              content={formData.content || ''}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your chapter content here..."
            />
          </div>

          {/* Audio Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Audio Options</h3>
            
            {formData.audioUrl && (
              <div className="space-y-2">
                <Label>Current Audio</Label>
                <AudioControls audioUrl={formData.audioUrl} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                onClick={onGenerateAudio}
                disabled={isGeneratingAudio || !formData.content}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isGeneratingAudio ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generate AI Audio
                  </>
                )}
              </Button>

              <div className="flex-1">
                <AudioRecorder
                  onAudioRecorded={(audioUrl) => setFormData({ ...formData, audioUrl })}
                  disabled={isGeneratingAudio}
                />
              </div>
            </div>
          </div>

          {/* Media URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Podcast</h4>
              <div className="space-y-2">
                <Label htmlFor="podcastUrl">Podcast URL</Label>
                <Input
                  id="podcastUrl"
                  value={formData.podcastUrl || ''}
                  onChange={(e) => setFormData({ ...formData, podcastUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="podcastHeader">Podcast Header</Label>
                <Input
                  id="podcastHeader"
                  value={formData.podcastHeader || ''}
                  onChange={(e) => setFormData({ ...formData, podcastHeader: e.target.value })}
                  placeholder="Episode title or description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Video</h4>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoHeader">Video Header</Label>
                <Input
                  id="videoHeader"
                  value={formData.videoHeader || ''}
                  onChange={(e) => setFormData({ ...formData, videoHeader: e.target.value })}
                  placeholder="Video title or description"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Update Chapter' : 'Create Chapter'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Trash2, Move, Edit, Download, Upload } from "lucide-react";

interface Chapter {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  categoryId: number;
  chapterNumber: number;
  estimatedMinutes: number;
  contentType?: 'lesson' | 'book_summary';
  author?: string;
}

interface Category {
  id: number;
  title: string;
  description: string;
  sortOrder: number;
}

interface BulkOperationsProps {
  chapters: Chapter[];
  categories: Category[];
  onReorder: (chapters: Chapter[]) => void;
  onBulkDelete: (chapterIds: number[]) => void;
  onBulkCategoryUpdate: (chapterIds: number[], categoryId: number) => void;
  onBulkExport: (chapterIds: number[]) => void;
}

export function BulkOperations({
  chapters,
  categories,
  onReorder,
  onBulkDelete,
  onBulkCategoryUpdate,
  onBulkExport
}: BulkOperationsProps) {
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [isReorderMode, setIsReorderMode] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedChapters(new Set(chapters.map(c => c.id)));
    } else {
      setSelectedChapters(new Set());
    }
  };

  const handleSelectChapter = (chapterId: number, checked: boolean) => {
    const newSelected = new Set(selectedChapters);
    if (checked) {
      newSelected.add(chapterId);
    } else {
      newSelected.delete(chapterId);
    }
    setSelectedChapters(newSelected);
  };

  const handleBulkAction = () => {
    const selectedIds = Array.from(selectedChapters);
    if (selectedIds.length === 0) return;

    switch (bulkAction) {
      case 'delete':
        onBulkDelete(selectedIds);
        break;
      case 'category':
        if (targetCategoryId) {
          onBulkCategoryUpdate(selectedIds, parseInt(targetCategoryId));
        }
        break;
      case 'export':
        onBulkExport(selectedIds);
        break;
    }

    // Reset selections
    setSelectedChapters(new Set());
    setBulkAction('');
    setTargetCategoryId('');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update chapter numbers based on new order
    const updatedChapters = items.map((chapter, index) => ({
      ...chapter,
      chapterNumber: index + 1
    }));

    onReorder(updatedChapters);
  };

  const selectedCount = selectedChapters.size;
  const allSelected = selectedCount === chapters.length && chapters.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < chapters.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="w-5 h-5" />
          Bulk Operations
        </CardTitle>
        <CardDescription>
          Select multiple chapters to perform bulk actions or drag to reorder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bulk Action Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              {...(someSelected && { 'data-state': 'indeterminate' })}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({selectedCount} selected)
            </label>
          </div>

          {selectedCount > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Choose action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Change Category</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>

                {bulkAction === 'category' && (
                  <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                    <SelectTrigger className="w-48">
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
                )}

                {bulkAction === 'delete' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!bulkAction || (bulkAction === 'category' && !targetCategoryId)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete {selectedCount} Chapters
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete {selectedCount} chapters.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkAction} className="bg-red-600 hover:bg-red-700">
                          Delete Chapters
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || (bulkAction === 'category' && !targetCategoryId)}
                  >
                    {bulkAction === 'category' && <Edit className="w-4 h-4 mr-2" />}
                    {bulkAction === 'export' && <Download className="w-4 h-4 mr-2" />}
                    Apply to {selectedCount} Chapters
                  </Button>
                )}
              </div>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => setIsReorderMode(!isReorderMode)}
          >
            <Move className="w-4 h-4 mr-2" />
            {isReorderMode ? 'Exit' : 'Reorder Mode'}
          </Button>
        </div>

        {/* Chapter List */}
        <div className="space-y-2">
          {isReorderMode ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="chapters">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {chapters.map((chapter, index) => (
                      <Draggable key={chapter.id} draggableId={chapter.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-4 p-4 border rounded-lg ${
                              snapshot.isDragging ? 'bg-blue-50 shadow-lg' : 'bg-white'
                            }`}
                          >
                            <Move className="w-5 h-5 text-gray-400 cursor-grab" />
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedChapters.has(chapter.id)}
                                onCheckedChange={(checked) => 
                                  handleSelectChapter(chapter.id, checked as boolean)
                                }
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{chapter.title}</h4>
                              <p className="text-sm text-gray-600">
                                Chapter {chapter.chapterNumber} • {chapter.estimatedMinutes} min • 
                                {categories.find(c => c.id === chapter.categoryId)?.title || 'No Category'}
                              </p>
                            </div>
                            <div className="text-sm text-gray-500">
                              #{chapter.chapterNumber}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedChapters.has(chapter.id)}
                      onCheckedChange={(checked) => 
                        handleSelectChapter(chapter.id, checked as boolean)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{chapter.title}</h4>
                    <p className="text-sm text-gray-600">
                      Chapter {chapter.chapterNumber} • {chapter.estimatedMinutes} min • 
                      {categories.find(c => c.id === chapter.categoryId)?.title || 'No Category'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {chapter.contentType === 'book_summary' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 mr-2">
                        Book Summary
                      </span>
                    )}
                    #{chapter.chapterNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {chapters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No chapters available for bulk operations
          </div>
        )}
      </CardContent>
    </Card>
  );
}
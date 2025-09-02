import React, { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Image } from "@tiptap/extension-image";
import { Highlight } from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, placeholder }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable underline in StarterKit to avoid conflicts
        // as we're adding it separately
      }),
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      Highlight,
      TaskList,
      TaskItem,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[160px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-yellow)] bg-white text-base",
        placeholder: placeholder || "Start writing...",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return <div className="border rounded-md p-3 bg-white text-base min-h-[160px]">Loading editor...</div>;

  const colors = [
    '#000000', // Black
    '#666666', // Gray
    '#FF0000', // Red
    '#FF6600', // Orange
    '#FFD700', // Yellow
    '#00FF00', // Green
    '#0066FF', // Blue
    '#6600FF', // Purple
    '#FF0066', // Pink
  ];

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 border-b pb-2 bg-[var(--muted)] rounded-t-md px-2">
        {/* Headings */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 rounded transition-colors font-bold text-lg ${editor.isActive('heading', { level: 1 }) ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded transition-colors font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 rounded transition-colors font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>H3</button>
        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>1. List</button>
        {/* Task List */}
        <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('taskList') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>☑️</button>
        {/* Table */}
        <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="px-2 py-1 rounded transition-colors hover:bg-[var(--accent-yellow)]/60">Table</button>
        {/* Image */}
        <button type="button" onClick={() => {
          const url = window.prompt('Enter image URL or leave blank to upload');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          } else {
            // For upload, you could integrate a file picker and upload logic here
            alert('Image upload not implemented. Paste a URL for now.');
          }
        }} className="px-2 py-1 rounded transition-colors hover:bg-[var(--accent-yellow)]/60">🖼️</button>
        {/* Highlight */}
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('highlight') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>Highlight</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded font-bold transition-colors ${editor.isActive('bold') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded italic transition-colors ${editor.isActive('italic') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 rounded underline transition-colors ${editor.isActive('underline') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 rounded line-through transition-colors ${editor.isActive('strike') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>S</button>
        
        {/* Text Color */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="px-2 py-1 rounded transition-colors hover:bg-[var(--accent-yellow)]/60 border-2 border-current"
            style={{ color: editor.getAttributes('textStyle').color || '#000000' }}
          >
            A
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-10">
              <div className="grid grid-cols-3 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTextColor(color)}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetColor().run()}
                className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                Reset Color
              </button>
            </div>
          )}
        </div>
        
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`px-2 py-1 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-[var(--accent-yellow)] text-[var(--text-primary)]' : 'hover:bg-[var(--accent-yellow)]/60'}`}>&#8220; &#8221;</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="px-2 py-1 rounded transition-colors hover:bg-[var(--accent-yellow)]/60">―</button>
      </div>
      <div className="prose prose-lg max-w-none bg-white border border-[var(--border)] rounded-b-md p-4 min-h-[160px] focus-within:ring-2 focus-within:ring-[var(--accent-yellow)] transition-shadow">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor; 
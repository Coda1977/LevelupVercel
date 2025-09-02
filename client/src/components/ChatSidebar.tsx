import { useState } from "react";
import { Edit2, Trash2, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: string;
  name: string;
  summary: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  selectedSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({
  sessions,
  selectedSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  isOpen,
  onToggle
}: ChatSidebarProps) {
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { toast } = useToast();

  const handleDeleteChat = (chatId: string) => {
    if (sessions.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one chat session.",
        variant: "destructive",
      });
      return;
    }
    onDeleteChat(chatId);
  };

  const handleRename = (sessionId: string, newName: string) => {
    if (newName.trim()) {
      onRenameChat(sessionId, newName.trim());
    }
    setRenamingSessionId(null);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/90 p-2 rounded-lg shadow-lg border border-gray-200"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative top-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-sm border-r border-gray-200 
        flex flex-col p-4 gap-4 h-full lg:h-auto transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-2 mb-4 pt-12 lg:pt-0">
          <div className="w-8 h-8 bg-[var(--accent-blue)] rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-black">∞</span>
          </div>
          <span className="font-bold text-lg">Your Chats</span>
        </div>
        
        <button
          className="w-full py-2 bg-[var(--accent-yellow)] text-[var(--text-primary)] rounded-lg font-semibold hover:bg-[var(--accent-blue)] hover:text-white transition"
          onClick={onNewChat}
        >
          + New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto mt-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`group p-3 rounded-lg mb-2 cursor-pointer transition border relative ${
                selectedSessionId === session.id 
                  ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]' 
                  : 'hover:bg-gray-100 border-transparent'
              }`}
              onClick={() => {
                onSessionSelect(session.id);
                // Close sidebar on mobile after selection
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
            >
              {renamingSessionId === session.id ? (
                <input
                  className="font-semibold truncate pr-8 bg-white text-black border rounded px-2 py-1 w-40"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(session.id, renameValue)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleRename(session.id, renameValue);
                    } else if (e.key === 'Escape') {
                      setRenamingSessionId(null);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <div className="flex items-center">
                  <div className="font-semibold truncate pr-2">{session.name}</div>
                  <button
                    className="ml-1 text-xs text-gray-400 hover:text-[var(--accent-yellow)]"
                    onClick={e => {
                      e.stopPropagation();
                      setRenamingSessionId(session.id);
                      setRenameValue(session.name);
                    }}
                    title="Rename session"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {session.summary && (
                <div className="text-xs opacity-70 truncate">{session.summary}</div>
              )}
              <button
                className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedSessionId === session.id 
                    ? 'text-white hover:bg-white/20' 
                    : 'text-gray-400 hover:bg-red-100 hover:text-red-600'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(session.id);
                }}
                title="Delete chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
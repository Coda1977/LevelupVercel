import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ChatSession {
  id: string;
  name: string;
  summary: string;
}

export function useChatSessions(isAuthenticated: boolean, isLoading: boolean) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetch('/api/chat/sessions')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          setSessions(data);
          if (data.length > 0 && !data.find((s: any) => s.id === selectedSessionId)) {
            setSelectedSessionId(data[0].id);
          }
        })
        .catch(error => {
          console.error('Failed to load chat sessions:', error);
          toast({
            title: "Error",
            description: "Failed to load chat sessions. Please refresh the page.",
            variant: "destructive",
          });
        });
    }
  }, [isLoading, isAuthenticated, selectedSessionId, toast]);

  const createNewChat = async () => {
    try {
      // Generate unique session ID for new chat
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Optimistically add new session to UI
      const tempSession: ChatSession = {
        id: `temp-${newSessionId}`,
        name: `New Chat`,
        summary: ''
      };
      
      setSessions(prev => [tempSession, ...prev]);
      setSelectedSessionId(tempSession.id);
      
      // Create the session on the server
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newSessionId })
      });
      
      if (!res.ok) throw new Error('Failed to create session');
      
      const sessionRes = await fetch('/api/chat/sessions');
      const sessionList = await sessionRes.json();
      setSessions(sessionList);
      
      // Find and select the real session
      const realSession = sessionList.find((s: ChatSession) => s.id.includes(newSessionId.split('-')[1]));
      if (realSession) {
        setSelectedSessionId(realSession.id);
      }
      
    } catch (error) {
      console.error('Failed to create new chat session:', error);
      // Revert optimistic update on error
      const revertedSessions = sessions.filter(s => !s.id.startsWith('temp-'));
      setSessions(revertedSessions);
      if (revertedSessions.length > 0) {
        setSelectedSessionId(revertedSessions[0].id);
      }
      
      toast({
        title: "Error",
        description: "Failed to create new chat session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/session/${chatId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) throw new Error('Failed to delete chat');
      
      const sessionRes = await fetch('/api/chat/sessions');
      const sessionList = await sessionRes.json();
      setSessions(sessionList);
      
      if (selectedSessionId === chatId && sessionList.length > 0) {
        setSelectedSessionId(sessionList[0].id);
      }
      
      toast({
        title: "Chat deleted",
        description: "Your chat session has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renameChat = (chatId: string, newName: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === chatId ? { ...session, name: newName } : session
      )
    );
  };

  return {
    sessions,
    setSessions,
    selectedSessionId,
    setSelectedSessionId,
    createNewChat,
    deleteChat,
    renameChat
  };
}
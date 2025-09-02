import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function useStreamingChat(selectedSessionId: string, isAuthenticated: boolean) {
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/chat/history", selectedSessionId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/history/${selectedSessionId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load chat history`);
      }
      return res.json();
    },
    enabled: isAuthenticated && !!selectedSessionId,
    retry: 2,
    retryDelay: 1000,
  });

  const generateChatName = async (currentUserMessage: string) => {
    try {
      const messagesForNaming = [
        ...messages,
        { role: 'user', content: currentUserMessage, timestamp: new Date().toISOString() }
      ];
      
      const res = await fetch(`/api/chat/session/${selectedSessionId}/generate-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForNaming })
      });
      
      if (res.ok) {
        const { name } = await res.json();
        // Trigger refetch of sessions
        return name;
      }
    } catch (error) {
      console.error('Failed to generate session name:', error);
      // Silently fail to avoid disrupting the chat experience
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isAITyping) return;
    
    setIsAITyping(true);
    setChatError(null);
    setStreamingMessage('');
    
    // Ensure UI updates immediately by forcing a re-render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const currentMessage = inputMessage;
    setInputMessage('');

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          sessionId: selectedSessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr.trim() === '[DONE]') continue;
              
              const data = JSON.parse(jsonStr);
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }
            } catch (e) {
              if (line !== 'data: ') {
                console.warn('Failed to parse SSE data:', line, e);
              }
            }
          }
        }
      }

      // Generate session name if this is the first message
      if (messages.length === 0) {
        await generateChatName(currentMessage);
      }

      // Clear streaming state and refresh message history
      setStreamingMessage(null);
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/history", selectedSessionId] 
      });

    } catch (error: any) {
      console.error('Failed to send message:', error);
      setChatError(error.message || 'Failed to send message');
      setInputMessage(currentMessage); // Restore input
      
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAITyping(false);
      setStreamingMessage(null);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    isAITyping,
    chatError,
    streamingMessage,
    sendMessage,
    copyMessage
  };
}
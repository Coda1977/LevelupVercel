import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { MobileNav } from "@/components/MobileNav";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatStarterPrompts } from "@/components/ChatStarterPrompts";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Custom hooks for session management and streaming chat
  const {
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    createNewChat,
    deleteChat,
    renameChat
  } = useChatSessions(isAuthenticated, isLoading);

  const {
    messages,
    inputMessage,
    setInputMessage,
    isAITyping,
    chatError,
    streamingMessage,
    sendMessage,
    copyMessage
  } = useStreamingChat(selectedSessionId, isAuthenticated);

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

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Loading state
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-gradient-to-b from-[var(--bg-primary)] to-white">
        <ChatSidebar
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSessionSelect={setSelectedSessionId}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          onRenameChat={renameChat}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col items-center lg:ml-0">
          <ChatHeader />
          
          {/* Chat Container */}
          <div className="w-full max-w-2xl flex-1 flex flex-col bg-white/80 rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6" style={{ minHeight: 400 }}>
              {messages.length === 0 && !streamingMessage ? (
                <ChatStarterPrompts onPromptClick={setInputMessage} />
              ) : (
                <MessageList
                  ref={messagesEndRef}
                  messages={messages}
                  streamingMessage={streamingMessage}
                  isAITyping={isAITyping}
                  user={user}
                  onCopyMessage={copyMessage}
                />
              )}
            </div>
            
            {/* Input Area */}
            <ChatInput
              inputMessage={inputMessage}
              isAITyping={isAITyping}
              chatError={chatError}
              onInputChange={setInputMessage}
              onSendMessage={sendMessage}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

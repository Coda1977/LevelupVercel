import { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  isAITyping: boolean;
  chatError: string | null;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export function ChatInput({ 
  inputMessage, 
  isAITyping, 
  chatError, 
  onInputChange, 
  onSendMessage 
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      {chatError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {chatError}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <Textarea
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAITyping ? "AI is typing..." : "Ask me about management, leadership, or Level Up concepts..."}
          disabled={isAITyping}
          className="flex-1 min-h-[3rem] max-h-32 resize-none border-gray-200 focus:border-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
          rows={1}
        />
        <Button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || isAITyping}
          className="h-12 px-4 bg-[var(--accent-blue)] hover:bg-blue-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
import { forwardRef } from 'react';
import { Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/hooks/useStreamingChat';

interface MessageListProps {
  messages: Message[];
  streamingMessage: string | null;
  isAITyping: boolean;
  user: any;
  onCopyMessage: (content: string) => void;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, streamingMessage, isAITyping, user, onCopyMessage }, ref) => {
    return (
      <div className="flex flex-col gap-6">
        {messages.map((message: Message, index: number) => (
          <div
            key={index}
            className={`flex gap-3 items-end animate-fade-in ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-base font-bold shadow-md">
              {message.role === 'assistant' ? (
                <div className="w-10 h-10 bg-[var(--accent-blue)] border-2 border-[var(--accent-yellow)] rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white font-black">∞</span>
                </div>
              ) : (
                <div className="w-10 h-10 bg-[var(--accent-yellow)] rounded-full flex items-center justify-center">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            {/* Message Bubble */}
            <div className={`relative max-w-[70%] p-4 rounded-2xl shadow-md text-base leading-relaxed ${
              message.role === 'user'
                ? 'bg-[var(--accent-blue)] text-white'
                : 'bg-white border border-gray-100'
            }`}>
              {message.role === 'assistant' ? (
                <ReactMarkdown 
                  components={{
                    p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-[var(--text-primary)]" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-1" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--accent-yellow)] pl-4 italic mb-3" {...props} />,
                    code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                    a: ({node, ...props}) => <a className="text-[var(--accent-blue)] hover:underline" {...props} />
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <span className="whitespace-pre-wrap">{message.content}</span>
              )}
              {/* Copy button */}
              <button
                className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[var(--accent-blue)] transition"
                onClick={() => onCopyMessage(message.content)}
                title="Copy message"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingMessage && (
          <div className="flex gap-3 items-end animate-fade-in">
            <div className="w-10 h-10 bg-[var(--accent-blue)] border-2 border-[var(--accent-yellow)] rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white font-black">∞</span>
            </div>
            <div className="relative max-w-[70%] p-4 rounded-2xl shadow-md text-base leading-relaxed bg-white border border-gray-100">
              <ReactMarkdown 
                components={{
                  p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-[var(--text-primary)]" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-1" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--accent-yellow)] pl-4 italic mb-3" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                  a: ({node, ...props}) => <a className="text-[var(--accent-blue)] hover:underline" {...props} />
                }}
              >
                {streamingMessage}
              </ReactMarkdown>
              <div className="absolute bottom-2 right-2 w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* AI typing indicator */}
        {isAITyping && !streamingMessage && (
          <div className="flex gap-3 items-end">
            <div className="w-10 h-10 bg-[var(--accent-blue)] border-2 border-[var(--accent-yellow)] rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white font-black">∞</span>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={ref} />
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
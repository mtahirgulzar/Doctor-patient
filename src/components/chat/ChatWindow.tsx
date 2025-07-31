import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onTyping: () => void;
  loading: boolean;
  isTyping: boolean;
  otherUserEmail: string;
}

export const ChatWindow = ({
  messages,
  onSendMessage,
  onTyping,
  loading,
  isTyping,
  otherUserEmail
}: ChatWindowProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-4 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">
          {otherUserEmail}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
            />
          ))
        )}
        {isTyping && (
          <div className="flex items-center mb-2 ml-2">
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 max-w-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            <span className="text-xs text-gray-500 ml-2">{otherUserEmail.split('@')[0]} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        onSendMessage={onSendMessage} 
        onTyping={onTyping}
        disabled={!user}
      />
    </div>
  );
};

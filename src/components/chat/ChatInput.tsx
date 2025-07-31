import { useEffect } from 'react';
import { useState, KeyboardEvent, useCallback, useRef, FormEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, onTyping, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const handleTypingDebounced = useCallback(() => {
    const now = Date.now();
    const TYPING_INDICATOR_DELAY = 500;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (now - lastTypingTimeRef.current > TYPING_INDICATOR_DELAY) {
      onTyping();
      lastTypingTimeRef.current = now;
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (message.trim().length > 0) {
        onTyping();
        lastTypingTimeRef.current = Date.now();
      }
    }, TYPING_INDICATOR_DELAY * 2);
  }, [onTyping, message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    onSendMessage(message);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
      handleTypingDebounced();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="text-black w-full border border-gray-300 rounded-lg py-2 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={1}
            disabled={disabled}
          />
          <button
            type="button"
            className="absolute right-2 bottom-2 text-gray-500 hover:text-blue-600 focus:outline-none"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <input type="file" id="file-upload" className="hidden" multiple />
          </button>
        </div>
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </form>
  );
};

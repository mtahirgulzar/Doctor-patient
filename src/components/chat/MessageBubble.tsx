import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const { user } = useAuth();
    const isCurrentUser = message.from === user?.email;

    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCurrentUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
            >
                <div className="text-sm">{message.text}</div>
                <div 
                    className={`flex items-center justify-end gap-1 text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}
                >
                    <span>{format(message.timestamp, 'h:mm a')}</span>
                    {isCurrentUser && message.read && (
                        <span className="flex items-center" aria-label="Read">
                            <Eye className="w-3 h-3 ml-1" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
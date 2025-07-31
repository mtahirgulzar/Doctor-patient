import { useRouter } from 'next/navigation';
import { Chat } from '@/types/chat';
import { format } from 'date-fns';

interface ChatListProps {
  chats: Array<Chat & { otherParticipant: string }>;
  loading: boolean;
  currentChatId?: string;
}

export const ChatList = ({ chats, loading, currentChatId }: ChatListProps) => {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-400 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">No conversations yet</h3>
        <p className="text-gray-500 mt-1">Start a new conversation by selecting a user</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`p-4 hover:bg-gray-50 cursor-pointer ${
            currentChatId === chat.id ? 'bg-blue-50' : ''
          }`}
          onClick={() => router.push(`/chat/${encodeURIComponent(chat.otherParticipant)}`)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {chat.otherParticipant}
            </h3>
            {chat.lastMessage && (
              <span className="text-xs text-gray-500">
                {format(chat.lastMessage.timestamp, 'h:mm a')}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <p className="text-sm text-gray-500 truncate mt-1">
              {chat.lastMessage.text}
            </p>
          )}
          {chat.unreadCount > 0 && (
            <div className="flex justify-end mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {chat.unreadCount} new
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

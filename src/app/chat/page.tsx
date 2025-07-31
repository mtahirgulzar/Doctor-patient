'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useChat } from '@/hooks/useChat';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Define the two users in the system
const USERS = {
  doctor: {
    email: 'doctoruser1@gmail.com',
    name: 'Doctor User',
    role: 'doctor' as const
  },
  patient: {
    email: 'patientuser1@gmail.com',
    name: 'Patient User',
    role: 'patient' as const
  }
};

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const otherUserEmail = params?.email ? decodeURIComponent(params.email as string) : undefined;
  
  // Determine the other user based on who's currently logged in
  const otherUser = user?.email === USERS.doctor.email ? USERS.patient : USERS.doctor;
  
  const { 
    messages, 
    loading: messagesLoading, 
    sendMessage, 
    isTyping, 
    handleTyping 
  } = useChat(otherUserEmail);

  // If no chat is selected, redirect to the other user
  useEffect(() => {
    if (!otherUserEmail && user) {
      router.push(`/chat/${encodeURIComponent(otherUser.email)}`);
    }
  }, [otherUserEmail, user, router, otherUser.email]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-80px)]">
          <div className="bg-white rounded-xl shadow overflow-hidden h-full flex">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {user?.email === USERS.doctor.email ? 'Patients' : 'Doctors'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div 
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    otherUserEmail === otherUser.email ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => router.push(`/chat/${encodeURIComponent(otherUser.email)}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {otherUser.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {otherUser.role === 'doctor' ? 'Doctor' : 'Patient'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {otherUserEmail ? (
                <ChatWindow
                  messages={messages}
                  onSendMessage={sendMessage}
                  onTyping={handleTyping}
                  loading={messagesLoading}
                  isTyping={isTyping}
                  otherUserEmail={otherUserEmail}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6 max-w-md">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      {user?.email === USERS.doctor.email ? 'Patient Chat' : 'Doctor Chat'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {user?.email === USERS.doctor.email 
                        ? 'Chat with your patient' 
                        : 'Chat with your doctor'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

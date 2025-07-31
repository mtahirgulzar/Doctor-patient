import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ref,
  push,
  onValue,
  set,
  update,
  off,
  query,
  orderByChild,
  serverTimestamp,
  get
} from 'firebase/database';
import { db } from '@/firebase';
import { Message, Chat } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { saveMessages, getMessages as getLocalMessages, addMessage as addLocalMessage } from '@/lib/localStorage';

export const useChat = (otherUserEmail?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CHAT_ID = 'doctor_patient'; // Fixed chat ID

  // Send a new message
  const sendMessage = async (text: string) => {
    if (!user?.email || !otherUserEmail) return;

    try {
      const messagesRef = ref(db, `chats/${CHAT_ID}/messages`);
      const newMessageRef = push(messagesRef);
      const messageId = newMessageRef.key;

      if (!messageId) throw new Error('Failed to generate message ID');

      const timestamp = new Date();
      const messageData = {
        id: messageId,
        text,
        from: user.email,
        to: otherUserEmail,
        timestamp: timestamp,
        read: false
      };

      // Optimistically add the message to local storage
      await addLocalMessage(CHAT_ID, messageData);
      setMessages(prev => [...prev, messageData]);

      try {
        await set(newMessageRef, {
          ...messageData,
          timestamp: serverTimestamp()
        });

        // Update the last message in the chat
        await update(ref(db, `chats/${CHAT_ID}`), {
          lastMessage: {
            text,
            from: user.email,
            timestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Failed to send message to server:', error);
        // The message is already in local storage, so it will be synced when back online
        throw new Error('Message saved locally but failed to send. It will be sent when you\'re back online.');
      }

      return messageData;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    }
  };

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!user?.email || !otherUserEmail || messageIds.length === 0) return;

    try {
      const updates: { [key: string]: unknown } = {};
      messageIds.forEach(id => {
        if (id) {
          updates[`chats/${CHAT_ID}/messages/${id}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user?.email, otherUserEmail]);

  // Encode email for use in Firebase paths
  const encodeEmail = useCallback((email: string): string => {
    return email.replace(/\./g, ',').replace(/@/g, '--at--');
  }, []);

  // Handle typing indicator
  const handleTyping = useCallback(async () => {
    if (!user?.email || !otherUserEmail) {
      console.log('Missing user email or otherUserEmail');
      return;
    }

    const typingPath = `typing/${CHAT_ID}/${encodeEmail(user.email)}`;
    console.log('Typing path:', typingPath);
    const userTypingRef = ref(db, typingPath);

    try {
      // Update typing status to true
      console.log('Setting typing status to true for', user.email);
      await set(userTypingRef, true);
      console.log('Successfully set typing status to true');

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to mark as not typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Setting typing status to false for', user.email);
          await set(userTypingRef, false);
          console.log('Successfully set typing status to false');
        } catch (error) {
          console.error('Error setting typing status to false:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Error setting typing status to true:', error);
    }
  }, [user?.email, otherUserEmail, encodeEmail]);

  // Load messages from local storage first, then sync with server
  const loadMessages = useCallback(async () => {
    if (!user?.email || !otherUserEmail) return;
    setLoading(true);
    
    try {
      // Try to load from local storage first
      const localMessages = await getLocalMessages(CHAT_ID);
      if (localMessages.length > 0) {
        setMessages(localMessages);
      }
      
      // Then sync with server
      const messagesRef = ref(db, `chats/${CHAT_ID}/messages`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'));
      
      // Use get() instead of onValue for the initial load to avoid duplicate messages
      const snapshot = await get(messagesQuery);
      const messagesList: Message[] = [];
      const unreadMessageIds: string[] = [];
      let shouldMarkAsRead = false;

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const messageId = childSnapshot.key;
        if (!messageId) return;

        // Skip if we don't have the message data yet
        if (!data || !data.timestamp) return;

        const timestamp = data.timestamp.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : new Date(data.timestamp);

        const message = {
          id: messageId,
          text: data.text || '',
          from: data.from || '',
          to: data.to || '',
          timestamp: timestamp,
          read: data.read || false
        };

        messagesList.push(message);

        // Track unread messages that were sent to the current user
        if (!message.read && message.to === user.email) {
          unreadMessageIds.push(messageId);
          shouldMarkAsRead = true;
        }
      });

      // Sort messages by timestamp
      messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Update the UI with the latest messages
      setMessages(messagesList);
      
      // Save messages to local storage
      try {
        await saveMessages(CHAT_ID, messagesList);
      } catch (error) {
        console.error('Failed to save messages to local storage:', error);
      }

      // Mark messages as read if there are any unread
      if (shouldMarkAsRead && unreadMessageIds.length > 0) {
        try {
          await markAsRead(unreadMessageIds);
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user?.email, otherUserEmail, markAsRead]);

  // Set up real-time listener for new messages
  useEffect(() => {
    if (!user?.email || !otherUserEmail) return;

    const messagesRef = ref(db, `chats/${CHAT_ID}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    const onMessageAdded = onValue(messagesQuery, async (snapshot) => {
      const messagesList: Message[] = [];
      const unreadMessageIds: string[] = [];
      let shouldMarkAsRead = false;

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const messageId = childSnapshot.key;
        if (!messageId) return;

        // Skip if we don't have the message data yet
        if (!data || !data.timestamp) return;

        const timestamp = data.timestamp.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : new Date(data.timestamp);

        const message = {
          id: messageId,
          text: data.text || '',
          from: data.from || '',
          to: data.to || '',
          timestamp: timestamp,
          read: data.read || false
        };

        messagesList.push(message);

        // Track unread messages that were sent to the current user
        if (!message.read && message.to === user.email) {
          unreadMessageIds.push(messageId);
          shouldMarkAsRead = true;
        }
      });

      // Sort messages by timestamp
      messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Update the UI with the latest messages
      setMessages(messagesList);

      // Save messages to local storage
      try {
        await saveMessages(CHAT_ID, messagesList);
      } catch (error) {
        console.error('Failed to save messages to local storage:', error);
      }

      // Mark messages as read if there are any unread
      if (shouldMarkAsRead && unreadMessageIds.length > 0) {
        try {
          await markAsRead(unreadMessageIds);
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      }
    }, (error) => {
      console.error('Error in real-time listener:', error);
      // Don't show error to user if we're offline - we'll use the local data
    });

    return () => {
      off(messagesRef, 'value', onMessageAdded);
    };
  }, [user?.email, otherUserEmail, markAsRead]);

  // Initial load of messages
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Listen for other user's typing status
  useEffect(() => {
    if (!user?.email || !otherUserEmail) {
      console.log('Missing user email or otherUserEmail in typing listener');
      return;
    }
    
    const typingPath = `typing/${CHAT_ID}`;
    console.log('Listening to typing path:', typingPath);
    const typingRef = ref(db, typingPath);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val() || {};
      console.log('Typing data received:', typingData);
      
      const otherUserEncoded = encodeEmail(otherUserEmail);
      console.log('Checking typing status for:', otherUserEncoded);
      console.log('Current typing data:', JSON.stringify(typingData));
      
      const isTyping = !!typingData[otherUserEncoded];
      console.log('Is other user typing?', isTyping);
      
      setOtherUserTyping(isTyping);
    }, (error) => {
      console.error('Error in typing listener:', error);
    });

    return () => {
      console.log('Cleaning up typing listener');
      off(typingRef, 'value', unsubscribe);
    };
  }, [user?.email, otherUserEmail, encodeEmail]);

  // Clean up typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Mark as not typing when component unmounts
      if (user?.email && otherUserEmail) {
        const typingRef = ref(db, `typing/${CHAT_ID}/${encodeEmail(user.email)}`);
        set(typingRef, false).catch(console.error);
      }
    };
  }, [user?.email, otherUserEmail, encodeEmail]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    otherUserTyping,
    handleTyping
  };
};

// export const useChatList = () => {
//   const { user } = useAuth();
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!user?.email) return;

//     const chatsRef = collection(db, 'chats');
//     const q = query(
//       chatsRef,
//       where('participants', 'array-contains', user.email),
//       orderBy('lastMessage.timestamp', 'desc')
//     );

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const chatsData: Chat[] = [];

//       snapshot.forEach((doc) => {
//         const data = doc.data();
//         chatsData.push({
//           id: doc.id,
//           participants: data.participants,
//           lastMessage: data.lastMessage ? {
//             text: data.lastMessage.text,
//             timestamp: data.lastMessage.timestamp?.toDate()
//           } : undefined,
//           unreadCount: data.unreadCount || 0
//         });
//       });

//       setChats(chatsData);
//       setLoading(false);
//     }, (err) => {
//       console.error('Error getting chats:', err);
//       setError('Failed to load chats');
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [user?.email]);

//   return {
//     chats: chats.map(chat => ({
//       ...chat,
//       otherParticipant: chat.participants.find(email => email !== user?.email) || ''
//     })),
//     loading,
//     error
//   };
// };
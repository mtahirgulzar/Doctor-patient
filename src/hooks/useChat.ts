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
  const CHAT_ID = 'doctor_patient'; 


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

      await addLocalMessage(CHAT_ID, messageData);
      setMessages(prev => [...prev, messageData]);

      try {
        await set(newMessageRef, {
          ...messageData,
          timestamp: serverTimestamp()
        });

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
        throw new Error('Message saved locally but failed to send. It will be sent when you\'re back online.');
      }

      return messageData;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    }
  };

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

  const encodeEmail = useCallback((email: string): string => {
    return email.replace(/\./g, ',').replace(/@/g, '--at--');
  }, []);

  const handleTyping = useCallback(async () => {
    if (!user?.email || !otherUserEmail) {
      console.log('Missing user email or otherUserEmail');
      return;
    }

    const typingPath = `typing/${CHAT_ID}/${encodeEmail(user.email)}`;
    console.log('Typing path:', typingPath);
    const userTypingRef = ref(db, typingPath);

    try {
      console.log('Setting typing status to true for', user.email);
      await set(userTypingRef, true);
      console.log('Successfully set typing status to true');

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

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

  const loadMessages = useCallback(async () => {
    if (!user?.email || !otherUserEmail) return;
    setLoading(true);
    
    try {
      const localMessages = await getLocalMessages(CHAT_ID);
      if (localMessages.length > 0) {
        setMessages(localMessages);
      }
      
      const messagesRef = ref(db, `chats/${CHAT_ID}/messages`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'));
      
      const snapshot = await get(messagesQuery);
      const messagesList: Message[] = [];
      const unreadMessageIds: string[] = [];
      let shouldMarkAsRead = false;

      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const messageId = childSnapshot.key;
        if (!messageId) return;

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

        if (!message.read && message.to === user.email) {
          unreadMessageIds.push(messageId);
          shouldMarkAsRead = true;
        }
      });

      messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setMessages(messagesList);
      
      try {
        await saveMessages(CHAT_ID, messagesList);
      } catch (error) {
        console.error('Failed to save messages to local storage:', error);
      }

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
        if (!message.read && message.to === user.email) {
          unreadMessageIds.push(messageId);
          shouldMarkAsRead = true;
        }
      });

      messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(messagesList);
      try {
        await saveMessages(CHAT_ID, messagesList);
      } catch (error) {
        console.error('Failed to save messages to local storage:', error);
      }

      if (shouldMarkAsRead && unreadMessageIds.length > 0) {
        try {
          await markAsRead(unreadMessageIds);
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      }
    }, (error) => {
      console.error('Error in real-time listener:', error);
    });

    return () => {
      off(messagesRef, 'value', onMessageAdded);
    };
  }, [user?.email, otherUserEmail, markAsRead]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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

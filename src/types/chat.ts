// @ts-nocheck

export interface Message {
  id: string;
  text: string;
  from: string;
  to: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user emails
  lastMessage?: {
    text: string;
    timestamp: Date;
  };
  unreadCount: number;
}

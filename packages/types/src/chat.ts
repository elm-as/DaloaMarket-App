import { Database } from './database.types';

export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export interface ChatConversationPreview {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  listingId?: string | null;
  listingTitle?: string | null;
  listingPhoto?: string | null;
  listingPrice?: number | null;
}

export interface ChatMessageItem extends MessageRow {
  isMine: boolean;
}

import { supabase } from '../supabase';
import { ChatConversationPreview, ChatMessageItem } from '@daloa/types';

export const chatService = {
  /**
   * Récupère la liste des conversations récentes de l'utilisateur
   */
  async getConversations(userId: string): Promise<ChatConversationPreview[]> {
    const { data: sentMessages, error: sentErr } = await supabase
      .from('messages')
      .select('*, receiver:receiver_id(id, full_name, avatar_url), listings:listing_id(id, title, photos, price)')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    const { data: receivedMessages, error: recErr } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, full_name, avatar_url), listings:listing_id(id, title, photos, price)')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (sentErr || recErr) throw sentErr || recErr;

    const conversationsMap: Record<string, ChatConversationPreview> = {};

    (sentMessages || []).forEach((msg: any) => {
      const partner = msg.receiver || { id: msg.receiver_id, full_name: 'Utilisateur', avatar_url: null };
      if (!conversationsMap[partner.id] || new Date(msg.created_at) > new Date(conversationsMap[partner.id].lastMessageTime)) {
        conversationsMap[partner.id] = {
          partnerId: partner.id,
          partnerName: partner.full_name || 'Utilisateur',
          partnerAvatar: partner.avatar_url || null,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
          listingId: msg.listing_id,
          listingTitle: msg.listings?.title,
          listingPhoto: msg.listings?.photos?.[0],
          listingPrice: msg.listings?.price,
        };
      }
    });

    (receivedMessages || []).forEach((msg: any) => {
      const partner = msg.sender || { id: msg.sender_id, full_name: 'Utilisateur', avatar_url: null };
      const current = conversationsMap[partner.id];
      const isUnread = !msg.is_read;

      if (!current || new Date(msg.created_at) > new Date(current.lastMessageTime)) {
        conversationsMap[partner.id] = {
          partnerId: partner.id,
          partnerName: partner.full_name || 'Utilisateur',
          partnerAvatar: partner.avatar_url || null,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: (current?.unreadCount || 0) + (isUnread ? 1 : 0),
          listingId: msg.listing_id || current?.listingId,
          listingTitle: msg.listings?.title || current?.listingTitle,
          listingPhoto: msg.listings?.photos?.[0] || current?.listingPhoto,
          listingPrice: msg.listings?.price || current?.listingPrice,
        };
      } else if (isUnread) {
        current.unreadCount += 1;
      }
    });

    return Object.values(conversationsMap).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  },

  /**
   * Récupère l'historique des messages échangés entre deux utilisateurs
   */
  async getMessages(currentUserId: string, partnerId: string): Promise<ChatMessageItem[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Marquer les messages reçus comme lus
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);

    return (data || []).map((msg) => ({
      ...msg,
      isMine: msg.sender_id === currentUserId,
    }));
  },

  /**
   * Envoie un message
   */
  async sendMessage(params: {
    senderId: string;
    receiverId: string;
    content: string;
    listingId?: string | null;
    imageUrl?: string | null;
  }): Promise<ChatMessageItem> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: params.senderId,
        receiver_id: params.receiverId,
        content: params.content,
        listing_id: params.listingId || null,
        image_url: params.imageUrl || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      isMine: true,
    };
  },

  /**
   * Souscription temps réel aux nouveaux messages
   */
  subscribeToMessages(userId: string, onNewMessage: (msg: any) => void) {
    return supabase
      .channel(`chat_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        (payload) => onNewMessage(payload.new)
      )
      .subscribe();
  },
};

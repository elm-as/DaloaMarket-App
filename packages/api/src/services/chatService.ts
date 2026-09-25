import { supabase } from '../supabase';
import { ChatConversationPreview, ChatMessageItem } from '@daloa/types';
import { censorMessageContent } from '@daloa/utils';

/**
 * Une conversation = une personne ET une annonce, comme sur le site. Les
 * messages sans annonce forment le fil « support ». L'app regroupait tout par
 * personne : deux annonces d'un même vendeur se mélangeaient dans un seul fil.
 */
const threadListingId = (listingId?: string | null): string | null =>
  listingId && listingId !== 'support' && listingId !== 'null' ? listingId : null;

const threadKey = (partnerId: string, listingId?: string | null) => `${partnerId}|${listingId || 'support'}`;

export const chatService = {
  /**
   * Récupère la liste des conversations récentes de l'utilisateur
   */
  async getConversations(userId: string): Promise<ChatConversationPreview[]> {
    const { data: sentMessages, error: sentErr } = await supabase
      .from('messages')
      .select('*, receiver:receiver_id(id, full_name, shop_name, avatar_url), listings:listing_id(id, title, photos, price)')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    const { data: receivedMessages, error: recErr } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, full_name, shop_name, avatar_url), listings:listing_id(id, title, photos, price)')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (sentErr || recErr) throw sentErr || recErr;

    const conversationsMap: Record<string, ChatConversationPreview> = {};

    (sentMessages || []).forEach((msg: any) => {
      const partner = msg.receiver || { id: msg.receiver_id, full_name: 'Utilisateur', shop_name: null, avatar_url: null };
      const partnerName = partner.shop_name?.trim() || partner.full_name || 'Utilisateur';
      const key = threadKey(partner.id, msg.listing_id);
      if (!conversationsMap[key] || new Date(msg.created_at) > new Date(conversationsMap[key].lastMessageTime)) {
        conversationsMap[key] = {
          partnerId: partner.id,
          partnerName,
          partnerAvatar: partner.avatar_url || null,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
          listingId: msg.listing_id,
          listingTitle: msg.listings?.title || (!msg.listing_id ? 'Support & Assistance DaloaMarket' : undefined),
          listingPhoto: msg.listings?.photos?.[0],
          listingPrice: msg.listings?.price,
        };
      }
    });

    (receivedMessages || []).forEach((msg: any) => {
      const partner = msg.sender || { id: msg.sender_id, full_name: 'Utilisateur', shop_name: null, avatar_url: null };
      const partnerName = partner.shop_name?.trim() || partner.full_name || 'Utilisateur';
      const key = threadKey(partner.id, msg.listing_id);
      const current = conversationsMap[key];
      const isUnread = !msg.read;

      if (!current || new Date(msg.created_at) > new Date(current.lastMessageTime)) {
        conversationsMap[key] = {
          partnerId: partner.id,
          partnerName,
          partnerAvatar: partner.avatar_url || null,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: (current?.unreadCount || 0) + (isUnread ? 1 : 0),
          listingId: msg.listing_id || current?.listingId,
          listingTitle: msg.listings?.title || current?.listingTitle || (!msg.listing_id ? 'Support & Assistance DaloaMarket' : undefined),
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
  async getMessages(currentUserId: string, partnerId: string, listingId?: string | null): Promise<ChatMessageItem[]> {
    const lid = threadListingId(listingId);
    let query = supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`);
    query = lid ? query.eq('listing_id', lid) : query.is('listing_id', null);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    // Marquer comme lus les messages reçus de CE fil seulement
    let markRead = supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', currentUserId)
      .eq('read', false);
    markRead = lid ? markRead.eq('listing_id', lid) : markRead.is('listing_id', null);
    await markRead;

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
    const cleanContent = censorMessageContent(params.content);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: params.senderId,
        receiver_id: params.receiverId,
        content: cleanContent,
        listing_id: threadListingId(params.listingId),
        read: false,
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

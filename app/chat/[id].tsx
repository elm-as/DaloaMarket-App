import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useChatMessages, chatService } from '@daloa/api';
import { colors, radii, spacing, typography, AppText, AppPressable, useAccent, showAlert } from '@daloa/ui';
import { Send, Lock } from 'lucide-react-native';
import { formatDate, censorMessageContent } from '@daloa/utils';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';
import { useChatPartnerDetails } from '../../src/hooks/useChatPartnerDetails';
import { ChatRoomHeader } from '../../src/components/chat/ChatRoomHeader';

export default function ChatRoomScreen() {
  const searchParams = useLocalSearchParams<{
    id: string;
    partnerName?: string;
    partnerAvatar?: string;
    listingId?: string;
    listingTitle?: string;
    listingPhoto?: string;
    listingPrice?: string;
  }>();

  const partnerId = searchParams.id;
  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user, isAdmin } = useAuth();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Recherche initiale des messages avec l'identifiant d'annonce si disponible
  const initialListingId = searchParams.listingId && searchParams.listingId !== 'support' && searchParams.listingId !== 'null'
    ? searchParams.listingId
    : undefined;

  const { data: messages, refetch } = useChatMessages(user?.id, partnerId, initialListingId);
  const messageList = messages || [];

  // Résolution robuste des métadonnées (nom, avatar, annonce) si manquantes lors d'une ouverture par push
  const {
    partnerName,
    partnerAvatar,
    listingId,
    listingTitle,
    listingPhoto,
    listingPrice,
  } = useChatPartnerDetails(
    {
      partnerId,
      partnerName: searchParams.partnerName,
      partnerAvatar: searchParams.partnerAvatar,
      listingId: searchParams.listingId,
      listingTitle: searchParams.listingTitle,
      listingPhoto: searchParams.listingPhoto,
      listingPrice: searchParams.listingPrice,
    },
    messageList
  );

  const isSupport = (!listingId || listingId === 'support' || listingId === 'null') && (
    partnerName?.includes('DaloaMarket') ||
    listingTitle?.includes('Support') ||
    partnerId === 'af3721dd-6c4d-4709-930b-2f509f16e428' ||
    partnerId === 'c9842647-f3d3-4ed8-9e42-ce16a2e40262'
  );
  const isReadOnly = isSupport && !isAdmin;

  if (!user) {
    return (
      <AuthGuardView
        title="Connexion requise"
        description="Connectez-vous pour échanger directement avec vos correspondants."
        fallbackRoute="/(tabs)"
      />
    );
  }

  useEffect(() => {
    if (!user?.id) return;
    const channel = chatService.subscribeToMessages(user.id, () => refetch());
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, refetch]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messageList]);

  const handleSend = async () => {
    if (isReadOnly || !inputText.trim() || !user?.id || !partnerId) return;
    const rawText = inputText.trim();
    const textToSend = censorMessageContent(rawText);
    setInputText('');

    try {
      setIsSending(true);
      await chatService.sendMessage({
        senderId: user.id,
        receiverId: partnerId,
        content: textToSend,
        listingId: listingId || undefined,
      });
      refetch();
      // La notification du destinataire est émise par la base
      // (trigger push_webhook_messages), à partir du message enregistré.
    } catch (err) {
      console.warn('Erreur envoi message:', err);
      setInputText(textToSend);
      showAlert('Envoi impossible', 'Le message n\'a pas pu être envoyé. Vérifiez votre connexion.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ChatRoomHeader
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        listingId={listingId}
        listingTitle={listingTitle}
        listingPhoto={listingPhoto}
        listingPrice={listingPrice}
        accent={accent}
      />

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesScroll}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messageList.map((msg) => {
            const isMine = msg.isMine;
            return (
              <View key={msg.id} style={[styles.messageRow, isMine ? styles.myRow : styles.partnerRow]}>
                <View
                  style={[
                    styles.bubble,
                    isMine
                      ? { backgroundColor: accent.DEFAULT, borderBottomRightRadius: radii.sm }
                      : styles.partnerBubble,
                  ]}
                >
                  <AppText variant="body" color={isMine ? colors.text.inverse : colors.text.DEFAULT}>
                    {msg.content}
                  </AppText>
                  <AppText
                    variant="overline"
                    color={isMine ? 'rgba(255,255,255,0.75)' : colors.text.subtle}
                    style={styles.bubbleTime}
                  >
                    {formatDate(msg.created_at, true).split(' à ')[1] || ''}
                  </AppText>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Barre d'envoi ou bannière informative */}
        {isReadOnly ? (
          <View style={styles.readOnlyBanner}>
            <View style={styles.lockCircle}>
              <Lock size={16} color={colors.status.warning} />
            </View>
            <AppText variant="caption" color={colors.text.muted} style={styles.readOnlyText}>
              Message officiel de l’équipe DaloaMarket. Ce canal informatif ne reçoit pas de réponse directe.
            </AppText>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Écrire un message..."
              placeholderTextColor={colors.text.subtle}
              style={styles.textInput}
              multiline
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            <AppPressable
              haptic="selection"
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              style={[styles.sendBtn, { backgroundColor: accent.DEFAULT }, !inputText.trim() && styles.sendBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le message"
            >
              <Send size={18} color={colors.text.inverse} />
            </AppPressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.DEFAULT },
  flex1: { flex: 1 },
  messagesScroll: { padding: spacing[4], gap: spacing[2] },
  messageRow: { flexDirection: 'row', marginVertical: 2 },
  myRow: { justifyContent: 'flex-end' },
  partnerRow: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radii.xl,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3] + 2,
  },
  partnerBubble: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderBottomLeftRadius: radii.sm,
  },
  bubbleTime: { alignSelf: 'flex-end', marginTop: 3 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  textInput: {
    flex: 1,
    color: colors.text.DEFAULT,
    backgroundColor: colors.bg.subtle,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    maxHeight: 100,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.normal,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendBtnDisabled: { opacity: 0.5 },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  lockCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyText: {
    flex: 1,
    textAlign: 'center',
  },
});

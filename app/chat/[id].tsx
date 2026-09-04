import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useChatMessages, chatService } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  typography,
  Avatar,
  CurrencyText,
  AppText,
  AppPressable,
  useAccent,
} from '@daloa/ui';
import { Send, ArrowLeft } from 'lucide-react-native';
import { formatDate } from '@daloa/utils';
import { AuthGuardView } from '../../src/components/common/AuthGuardView';

export default function ChatRoomScreen() {
  const {
    id: partnerId,
    partnerName,
    partnerAvatar,
    listingId,
    listingTitle,
    listingPhoto,
    listingPrice,
  } = useLocalSearchParams<{ id: string; partnerName?: string; partnerAvatar?: string; listingId?: string; listingTitle?: string; listingPhoto?: string; listingPrice?: string }>();

  const router = useRouter();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  if (!user) {
    return (
      <AuthGuardView
        title="Connexion requise"
        description="Connectez-vous pour échanger directement avec vos correspondants."
        fallbackRoute="/(tabs)"
      />
    );
  }

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: messages, refetch } = useChatMessages(user?.id, partnerId);
  const messageList = messages || [];

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
    if (!inputText.trim() || !user?.id || !partnerId) return;
    const textToSend = inputText.trim();
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
    } catch (err) {
      console.warn('Erreur envoi message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Compact gradient header */}
      <LinearGradient
        colors={[accent[400], accent[600], accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.chatHeader}
      >
        <AppPressable
          onPress={() => router.back()}
          rippleBorderless
          style={styles.backBtn}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={18} color={colors.text.inverse} />
        </AppPressable>

        <View style={styles.headerCenter}>
          <Avatar uri={partnerAvatar} name={partnerName || '?'} size={36} />
          <View style={styles.headerInfo}>
            <AppText variant="bodyStrong" color={colors.text.inverse} numberOfLines={1}>
              {partnerName || 'Discussion'}
            </AppText>
            {listingTitle && (
              <AppText variant="caption" color={accent[100]} numberOfLines={1}>
                Re : {listingTitle}
              </AppText>
            )}
          </View>
        </View>

        {listingId && listingPrice && (
          <AppPressable
            onPress={() => router.push(`/listing/${listingId}` as any)}
            style={styles.priceChip}
            haptic="selection"
            accessibilityLabel="Voir l'annonce"
          >
            <CurrencyText amount={parseFloat(listingPrice)} size="sm" weight="bold" color="rgba(255,255,255,0.95)" />
          </AppPressable>
        )}
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Encart produit épinglé */}
        {listingTitle && (
          <AppPressable
            haptic="none"
            onPress={() => listingId && router.push(`/listing/${listingId}` as any)}
            style={[styles.pinnedProduct, { backgroundColor: accent[50], borderBottomColor: accent[100] }]}
            accessibilityLabel="Voir l'annonce liée"
          >
            {listingPhoto ? (
              <Image source={{ uri: listingPhoto }} style={styles.productThumb} contentFit="cover" transition={150} />
            ) : null}
            <View style={styles.pinnedInfo}>
              <AppText variant="caption" color={colors.text.DEFAULT} numberOfLines={1}>
                {listingTitle}
              </AppText>
              {listingPrice && (
                <CurrencyText amount={parseFloat(listingPrice)} size="sm" weight="bold" color={accent.DEFAULT} />
              )}
            </View>
          </AppPressable>
        )}

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

        {/* Barre d'envoi */}
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.DEFAULT,
  },
  flex1: {
    flex: 1,
  },
  // ─── Header ───
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: spacing[2],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  priceChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: 5,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  // ─── Pinned product ───
  pinnedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    gap: spacing[3],
  },
  productThumb: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
  },
  pinnedInfo: {
    flex: 1,
    gap: 2,
  },
  // ─── Messages ───
  messagesScroll: {
    padding: spacing[4],
    gap: spacing[2],
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  partnerRow: {
    justifyContent: 'flex-start',
  },
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
  bubbleTime: {
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  // ─── Input bar ───
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
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

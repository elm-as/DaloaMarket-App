import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useChatMessages, chatService } from '@daloa/api';
import {
  colors,
  radii,
  spacing,
  typography,
  Header,
  Avatar,
  CurrencyText,
} from '@daloa/ui';
import { Send, Image as ImageIcon } from 'lucide-react-native';
import { formatDate, Haptics } from '@daloa/utils';

export default function ChatRoomScreen() {
  const {
    id: partnerId,
    partnerName,
    partnerAvatar,
    listingId,
    listingTitle,
    listingPhoto,
    listingPrice,
  } = useLocalSearchParams<{
    id: string;
    partnerName?: string;
    partnerAvatar?: string;
    listingId?: string;
    listingTitle?: string;
    listingPhoto?: string;
    listingPrice?: string;
  }>();

  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: messages, refetch } = useChatMessages(user?.id, partnerId);
  const messageList = messages || [];

  useEffect(() => {
    if (!user?.id) return;
    const channel = chatService.subscribeToMessages(user.id, () => {
      refetch();
    });
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
    Haptics.selection();

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Header
        title={partnerName || 'Discussion'}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Encart Produit épinglé si lié à une annonce */}
        {listingTitle && (
          <TouchableOpacity
            onPress={() => listingId && router.push(`/listing/${listingId}`)}
            style={styles.pinnedProduct}
          >
            {listingPhoto ? (
              <Image source={{ uri: listingPhoto }} style={styles.productThumb} />
            ) : null}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {listingTitle}
              </Text>
              {listingPrice && (
                <CurrencyText
                  amount={parseFloat(listingPrice)}
                  size="xs"
                  weight="bold"
                  color={colors.market.primary}
                />
              )}
            </View>
          </TouchableOpacity>
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
              <View
                key={msg.id}
                style={[styles.messageRow, isMine ? styles.myRow : styles.partnerRow]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.myBubble : styles.partnerBubble,
                  ]}
                >
                  <Text style={[styles.bubbleText, isMine && styles.myBubbleText]}>
                    {msg.content}
                  </Text>
                  <Text style={[styles.bubbleTime, isMine && styles.myBubbleTime]}>
                    {formatDate(msg.created_at, true).split(' à ')[1] || ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.dark.textDim}
            style={styles.textInput}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  pinnedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    gap: spacing[3],
  },
  productThumb: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
  },
  productTitle: {
    color: colors.dark.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
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
  myBubble: {
    backgroundColor: colors.market.primary,
    borderBottomRightRadius: radii.xs,
  },
  partnerBubble: {
    backgroundColor: colors.dark.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderBottomLeftRadius: radii.xs,
  },
  bubbleText: {
    color: colors.dark.text,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    color: colors.dark.textDim,
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  myBubbleTime: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  textInput: {
    flex: 1,
    color: colors.dark.text,
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    maxHeight: 100,
    fontSize: typography.sizes.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.market.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

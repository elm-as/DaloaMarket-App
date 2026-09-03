import React, { useEffect, useMemo } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, useAccent } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { useConversations } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';

function TabBadge({ count, color }: { count: number; color: string }) {
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

function TabItemView({
  icon: Icon,
  label,
  focused,
  badgeCount = 0,
  badgeColor = colors.status.error,
}: {
  icon: any;
  label: string;
  focused: boolean;
  badgeCount?: number;
  badgeColor?: string;
}) {
  const accent = useAccent();
  const scale = useSharedValue(focused ? 1 : 0.95);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.95, { stiffness: 450, damping: 28 });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.tabItemContainer,
        focused && [styles.tabItemFocused, { backgroundColor: accent[50] }],
        animatedStyle,
      ]}
    >
      <View style={styles.iconBox}>
        <Icon
          size={20}
          color={focused ? accent[700] : colors.grey[500]}
          strokeWidth={focused ? 2.4 : 1.8}
        />
        {badgeCount > 0 && <TabBadge count={badgeCount} color={badgeColor} />}
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          { color: focused ? accent[700] : colors.grey[500] },
          focused && styles.tabLabelFocused,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const accent = useAccent();
  const { user } = useAuth();
  const { data: conversations } = useConversations(user?.id);

  const unreadCount = useMemo(
    () => (conversations || []).reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.DEFAULT,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
          paddingHorizontal: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabItemView icon={Home} label="Accueil" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selection(),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ focused }) => (
            <TabItemView icon={Search} label="Explorer" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selection(),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Vendre',
          tabBarButton: () => (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.mediumImpact();
                router.push('/listing/create' as any);
              }}
              style={styles.centerBtnWrapper}
              accessibilityLabel="Vendre un article"
            >
              <LinearGradient
                colors={[accent[400], accent.DEFAULT, accent[700]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.centerBtnCircle, { shadowColor: accent.DEFAULT }]}
              >
                <Plus size={24} color={colors.text.inverse} strokeWidth={2.8} />
              </LinearGradient>
              <Text style={[styles.centerBtnLabel, { color: accent[700] }]}>Vendre</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => (
            <TabItemView
              icon={MessageSquare}
              label="Messages"
              focused={focused}
              badgeCount={unreadCount}
              badgeColor={colors.status.error}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Haptics.selection();
            router.push('/chat' as any);
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabItemView icon={User} label="Profil" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.selection(),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.xl,
    minWidth: 62,
    gap: 2,
  },
  tabItemFocused: {
    transform: [{ scale: 1 }],
  },
  iconBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  tabLabelFocused: {
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.bg.surface,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 8.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  centerBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    width: 64,
  },
  centerBtnCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.bg.surface,
  },
  centerBtnLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.1,
  },
});

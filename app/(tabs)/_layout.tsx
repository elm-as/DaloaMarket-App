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
import { colors, useAccent } from '@daloa/ui';
import { Haptics } from '@daloa/utils';
import { useConversations } from '@daloa/api';
import { useAuth } from '../../src/context/AuthContext';

/* Pastille de notification (badge) réutilisable — fidèle au web */
function TabBadge({ count, color }: { count: number; color: string }) {
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

/* Icône d'onglet avec point orange animé sous le label (fidèle au web) */
function TabIcon({
  icon: Icon,
  color,
  focused,
  badgeCount = 0,
  badgeColor = colors.status.error,
}: {
  icon: any;
  color: string;
  focused: boolean;
  badgeCount?: number;
  badgeColor?: string;
}) {
  const scale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0, { stiffness: 500, damping: 35 });
  }, [focused, scale]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <View style={styles.tabIconWrapper}>
      <View style={styles.tabIconInner}>
        <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
        {badgeCount > 0 && <TabBadge count={badgeCount} color={badgeColor} />}
      </View>
      <Animated.View style={[styles.activeDot, dotStyle]} />
    </View>
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
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.grey[400],
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Rechercher',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Search} color={color} focused={focused} />
          ),
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
              style={styles.centerActionWrapper}
              accessibilityLabel="Vendre un article"
            >
              <LinearGradient
                colors={[accent[400], accent.DEFAULT, accent[700]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.centerActionButton}
              >
                <Plus size={24} color={colors.text.inverse} strokeWidth={2.8} />
              </LinearGradient>
              <Text style={styles.centerActionLabel}>Vendre</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null, // Commandes accessible via l'AppBar (icône Package) + Profil, comme le web
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={MessageSquare}
              color={color}
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Masqué de la barre de navigation car accessible via l'AppBar en haut
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconInner: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[600],
    marginTop: 3,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -11,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 9,
    fontWeight: '900',
  },
  centerActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    zIndex: 10,
    width: 68,
  },
  centerActionButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: colors.bg.surface,
  },
  centerActionLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.primary[600],
    marginTop: 2,
    letterSpacing: -0.1,
  },
});

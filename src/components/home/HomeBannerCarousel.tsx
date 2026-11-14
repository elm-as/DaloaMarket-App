import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  useWindowDimensions,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing, AppPressable, useAccent } from '@daloa/ui';
import { Haptics, getBoostDestination } from '@daloa/utils';
import { PromoBanner } from '@daloa/types';
import { promoBannersService } from '@daloa/api';
import { useAuth } from '../../context/AuthContext';
import { HomeBannerSlide } from './HomeBannerSlide';
import {
  AUTO_GLIDE_MS,
  AUTO_PLAY_MS,
  buildLoopBannerItems,
  DEFAULT_MOBILE_BANNERS,
  INTERACTION_COOLDOWN_MS,
  MANUAL_GLIDE_MS,
  resolveBannerAction,
  resolveSlideSlot,
  resolveSwipeReleaseTarget,
  SWIPE_SETTLE_MS,
} from './homeBannerConfig';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface AnimateSlotParams {
  visualSlot: number;
  settledSlot: number;
  realIndex: number;
  durationMs: number;
}

export const HomeBannerCarousel: React.FC = () => {
  const router = useRouter();
  const accent = useAccent();
  const { width: windowWidth } = useWindowDimensions();
  const bannerWidth = Math.max(260, Math.min(windowWidth - spacing[3] * 2, 460));
  const slideGap = spacing[2];
  const slideStep = bannerWidth + slideGap;

  const { isAuthenticated, profile } = useAuth();
  const boostDestination = getBoostDestination(isAuthenticated, profile, {
    login: '/auth/login',
    myListings: '/seller/my-listings',
    packs: '/pro/packs',
  });

  const [banners, setBanners] = useState<PromoBanner[]>(DEFAULT_MOBILE_BANNERS);
  const [activeIndex, setActiveIndex] = useState(0);
  const loopItems = useMemo(() => buildLoopBannerItems(banners), [banners]);

  const initialOffset = banners.length > 1 ? -slideStep : 0;
  const translateX = useRef(new Animated.Value(initialOffset)).current;

  const activeIndexRef = useRef(0);
  const slideStepRef = useRef(slideStep);
  const bannersLengthRef = useRef(banners.length);
  const currentOffsetRef = useRef(initialOffset);
  const dragStartXRef = useRef(initialOffset);
  const dragOriginDxRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const lastSettledAtRef = useRef(Date.now());
  const animRunIdRef = useRef(0);
  const runningAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  slideStepRef.current = slideStep;
  bannersLengthRef.current = banners.length;

  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentOffsetRef.current = value;
    });
    return () => translateX.removeListener(listenerId);
  }, [translateX]);

  const stopActiveAnimation = useCallback(() => {
    animRunIdRef.current += 1;
    runningAnimRef.current?.stop();
    runningAnimRef.current = null;
    isAnimatingRef.current = false;
  }, []);

  useEffect(() => {
    stopActiveAnimation();
    const count = banners.length;
    const clampedIndex = Math.max(0, Math.min(activeIndexRef.current, Math.max(0, count - 1)));
    activeIndexRef.current = clampedIndex;
    setActiveIndex(clampedIndex);
    const restingX = count > 1 ? -(clampedIndex + 1) * slideStep : 0;
    currentOffsetRef.current = restingX;
    translateX.setValue(restingX);
  }, [banners.length, slideStep, stopActiveAnimation, translateX]);

  useEffect(() => {
    let mounted = true;
    const loadBanners = async () => {
      try {
        const active = await promoBannersService.getActiveBanners();
        if (!mounted) return;
        const filtered = (active || []).filter((b: PromoBanner) => b.link_type !== 'referral');
        if (filtered.length === 1) {
          const fallback = DEFAULT_MOBILE_BANNERS.find((d) => d.link_type !== filtered[0].link_type)
            ?? DEFAULT_MOBILE_BANNERS[1];
          setBanners([filtered[0], fallback]);
        } else if (filtered.length > 1) {
          setBanners(filtered);
        }
      } catch {
        // Conserver les bannières par défaut si hors-ligne
      }
    };
    loadBanners();
    return () => {
      mounted = false;
      stopActiveAnimation();
    };
  }, [stopActiveAnimation]);

  const animateToSlot = useCallback(({
    visualSlot,
    settledSlot,
    realIndex,
    durationMs,
  }: AnimateSlotParams) => {
    stopActiveAnimation();

    const runId = animRunIdRef.current;
    const step = slideStepRef.current;
    activeIndexRef.current = realIndex;
    setActiveIndex(realIndex);
    isAnimatingRef.current = true;

    const anim = Animated.timing(translateX, {
      toValue: -visualSlot * step,
      duration: durationMs,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    runningAnimRef.current = anim;

    anim.start(({ finished }) => {
      if (animRunIdRef.current !== runId) return;
      runningAnimRef.current = null;
      isAnimatingRef.current = false;
      if (!finished) return;

      if (visualSlot !== settledSlot) {
        const restingX = -settledSlot * slideStepRef.current;
        currentOffsetRef.current = restingX;
        translateX.setValue(restingX);
      }
      lastSettledAtRef.current = Date.now();
    });
  }, [stopActiveAnimation, translateX]);

  const animateToSlide = useCallback((
    targetIndex: number,
    direction: 'forward' | 'backward' | 'direct',
    durationMs: number,
  ) => {
    const count = bannersLengthRef.current;
    if (count <= 1) return;
    const normalized = ((targetIndex % count) + count) % count;
    const { visualSlot, settledSlot } = resolveSlideSlot({
      count,
      fromIndex: activeIndexRef.current,
      targetIndex: normalized,
      direction,
    });
    animateToSlot({ visualSlot, settledSlot, realIndex: normalized, durationMs });
  }, [animateToSlot]);

  const animateToSlotRef = useRef(animateToSlot);
  animateToSlotRef.current = animateToSlot;

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gs) => (
      bannersLengthRef.current > 1
      && Math.abs(gs.dx) > 8
      && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.25
    ),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (_, gs) => {
      stopActiveAnimation();
      isDraggingRef.current = true;
      cooldownUntilRef.current = Date.now() + INTERACTION_COOLDOWN_MS;
      dragOriginDxRef.current = gs.dx;
      dragStartXRef.current = currentOffsetRef.current;
      translateX.stopAnimation((stoppedValue) => {
        dragStartXRef.current = stoppedValue;
        currentOffsetRef.current = stoppedValue;
      });
    },
    onPanResponderMove: (_, gs) => {
      const count = bannersLengthRef.current;
      const step = slideStepRef.current;
      const minX = -(count + 1) * step;
      const delta = gs.dx - dragOriginDxRef.current;
      const nextX = Math.max(minX, Math.min(0, dragStartXRef.current + delta));
      currentOffsetRef.current = nextX;
      translateX.setValue(nextX);
    },
    onPanResponderRelease: (_, gs) => {
      isDraggingRef.current = false;
      cooldownUntilRef.current = Date.now() + INTERACTION_COOLDOWN_MS;
      const release = resolveSwipeReleaseTarget({
        startX: dragStartXRef.current,
        currentX: currentOffsetRef.current,
        velocityX: gs.vx,
        slideStep: slideStepRef.current,
        count: bannersLengthRef.current,
      });
      animateToSlotRef.current({
        visualSlot: release.visualSlot,
        settledSlot: release.settledSlot,
        realIndex: release.realIndex,
        durationMs: SWIPE_SETTLE_MS,
      });
    },
    onPanResponderTerminate: () => {
      isDraggingRef.current = false;
      cooldownUntilRef.current = Date.now() + INTERACTION_COOLDOWN_MS;
      const release = resolveSwipeReleaseTarget({
        startX: dragStartXRef.current,
        currentX: currentOffsetRef.current,
        velocityX: 0,
        slideStep: slideStepRef.current,
        count: bannersLengthRef.current,
      });
      animateToSlotRef.current({
        visualSlot: release.visualSlot,
        settledSlot: release.settledSlot,
        realIndex: release.realIndex,
        durationMs: SWIPE_SETTLE_MS,
      });
    },
  }), [stopActiveAnimation, translateX]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      if (isDraggingRef.current || isAnimatingRef.current) return;
      if (Date.now() < cooldownUntilRef.current) return;
      if (Date.now() - lastSettledAtRef.current < AUTO_PLAY_MS) return;
      animateToSlide((activeIndexRef.current + 1) % banners.length, 'forward', AUTO_GLIDE_MS);
    }, 500);
    return () => clearInterval(timer);
  }, [banners.length, animateToSlide]);

  const handleDotPress = (index: number) => {
    cooldownUntilRef.current = Date.now() + INTERACTION_COOLDOWN_MS;
    animateToSlide(index, 'direct', MANUAL_GLIDE_MS);
  };

  const handleBannerPress = (banner: PromoBanner) => {
    Haptics.selection();
    promoBannersService.trackBannerClick(banner.id);
    const action = resolveBannerAction(banner, boostDestination);
    if (action.externalUrl) {
      Linking.openURL(action.externalUrl).catch(() => {});
      return;
    }
    if (action.internalRoute) {
      router.push(action.internalRoute as any);
    }
  };

  const webViewportStyle = Platform.OS === 'web' ? ({ touchAction: 'pan-y' } as any) : null;

  return (
    <View style={styles.container}>
      <View
        style={[styles.viewport, { width: bannerWidth }, webViewportStyle]}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.track,
            { gap: slideGap, transform: [{ translateX }] },
          ]}
        >
          {loopItems.map((item) => (
            <HomeBannerSlide
              key={item.key}
              banner={item.banner}
              realIndex={item.realIndex}
              total={banners.length}
              width={bannerWidth}
              accentColor={accent.DEFAULT}
              onPress={handleBannerPress}
            />
          ))}
        </Animated.View>
      </View>

      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((b, i) => (
            <AppPressable
              key={`dot-${b.id}-${i}`}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => handleDotPress(i)}
              accessibilityLabel={`Afficher la bannière ${b.title}`}
            >
              <View
                style={[
                  styles.dot,
                  i === activeIndex
                    ? { backgroundColor: accent.DEFAULT, width: 18 }
                    : { backgroundColor: colors.border.DEFAULT, width: 6 },
                ]}
              />
            </AppPressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: spacing[2], marginBottom: spacing[1], alignItems: 'center' },
  viewport: { overflow: 'hidden', borderRadius: radii['2xl'] },
  track: { flexDirection: 'row', alignItems: 'center' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 6 },
  dot: { height: 5, borderRadius: radii.full },
});

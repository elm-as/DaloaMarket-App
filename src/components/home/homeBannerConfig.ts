import { PromoBanner } from '@daloa/types';

export const BANNER_HEIGHT = 188;
export const AUTO_PLAY_MS = 3000;

export const DEFAULT_MOBILE_BANNERS: PromoBanner[] = [
  {
    id: 'default-express',
    title: 'Coursier Express Daloa',
    subtitle: 'Colis, plis & repas livrés en 30 min entre quartiers dès 500 F',
    image_url:
      'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=900&q=80',
    badge_text: 'EXPRESS · DÈS 500 F',
    badge_color: '#EA580C',
    sponsor_name: 'DaloaDelivery',
    link_type: 'express',
    link_target: null,
    is_active: true,
    priority: 10,
    views_count: 0,
    clicks_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-boost',
    title: 'Vendez 3x plus vite à Daloa',
    subtitle: 'Placez vos articles en tête d’accueil ou passez Vendeur Pro vérifié',
    image_url:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
    badge_text: 'VISIBILITÉ N°1',
    badge_color: '#D97706',
    sponsor_name: 'DaloaMarket Pro',
    link_type: 'none',
    link_target: '/pro/packs',
    is_active: true,
    priority: 5,
    views_count: 0,
    clicks_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Exécute un glissement horizontal doux sur Web (Expo Web) sans saut brutal ni
 * conflit avec le scroll-snap du navigateur. Retourne une fonction d'annulation.
 */
export function animateWebScrollLeft(params: {
  scrollView: any;
  targetX: number;
  durationMs: number;
  onSettled: () => void;
}): (() => void) | null {
  const { scrollView, targetX, durationMs, onSettled } = params;
  const node = scrollView?.getScrollableNode?.() as HTMLElement | undefined;
  if (!node || typeof window === 'undefined' || typeof node.scrollLeft !== 'number') {
    return null;
  }

  const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth);
  const clampedTarget = Math.max(0, Math.min(targetX, maxScroll));
  const startLeft = node.scrollLeft;
  const distance = clampedTarget - startLeft;
  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (Math.abs(distance) < 2 || prefersReduced) {
    node.scrollLeft = clampedTarget;
    onSettled();
    return () => {};
  }

  const prevSnap = node.style.scrollSnapType;
  const prevBehavior = node.style.scrollBehavior;
  node.style.scrollSnapType = 'none';
  node.style.scrollBehavior = 'auto';

  let rafId = 0;
  let cancelled = false;
  const startedAt = performance.now();

  const step = (now: number) => {
    if (cancelled) return;
    const progress = Math.min(1, (now - startedAt) / durationMs);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    node.scrollLeft = startLeft + distance * eased;

    if (progress < 1) {
      rafId = window.requestAnimationFrame(step);
      return;
    }

    node.scrollLeft = clampedTarget;
    rafId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      node.style.scrollSnapType = prevSnap;
      node.style.scrollBehavior = prevBehavior;
      onSettled();
    });
  };

  rafId = window.requestAnimationFrame(step);
  return () => {
    cancelled = true;
    if (rafId) window.cancelAnimationFrame(rafId);
    node.style.scrollSnapType = prevSnap;
    node.style.scrollBehavior = prevBehavior;
  };
}

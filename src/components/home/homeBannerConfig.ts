import { PromoBanner } from '@daloa/types';

export const BANNER_HEIGHT = 196;
export const AUTO_PLAY_MS = 9000;
export const AUTO_GLIDE_MS = 2400;
export const MANUAL_GLIDE_MS = 650;
export const SWIPE_SETTLE_MS = 380;
export const INTERACTION_COOLDOWN_MS = 5500;

export interface LoopBannerItem {
  key: string;
  banner: PromoBanner;
  realIndex: number;
}

export interface BannerTargetAction {
  externalUrl?: string;
  internalRoute?: string;
}

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
 * Construit la liste cyclique [cloneFin, ...bannières, cloneDébut] afin que les
 * transitions d'une extrémité à l'autre continuent dans le même sens sans saut.
 */
export function buildLoopBannerItems(banners: PromoBanner[]): LoopBannerItem[] {
  if (banners.length <= 1) {
    return banners.map((banner, realIndex) => ({
      key: `single-${banner.id}`,
      banner,
      realIndex,
    }));
  }

  const first = banners[0];
  const last = banners[banners.length - 1];

  return [
    { key: `clone-head-${last.id}`, banner: last, realIndex: banners.length - 1 },
    ...banners.map((banner, realIndex) => ({
      key: `slide-${banner.id}-${realIndex}`,
      banner,
      realIndex,
    })),
    { key: `clone-tail-${first.id}`, banner: first, realIndex: 0 },
  ];
}

/**
 * Résout l'emplacement visuel à animer et l'emplacement réel de repos après
 * glissement (utile lors du passage continu dernière -> première bannière).
 */
export function resolveSlideSlot(params: {
  count: number;
  fromIndex: number;
  targetIndex: number;
  direction?: 'forward' | 'backward' | 'direct';
}): { visualSlot: number; settledSlot: number } {
  const { count, fromIndex, targetIndex, direction = 'direct' } = params;
  if (count <= 1) return { visualSlot: 0, settledSlot: 0 };

  if (direction === 'forward' && fromIndex === count - 1 && targetIndex === 0) {
    return { visualSlot: count + 1, settledSlot: 1 };
  }

  if (direction === 'backward' && fromIndex === 0 && targetIndex === count - 1) {
    return { visualSlot: 0, settledSlot: count };
  }

  return { visualSlot: targetIndex + 1, settledSlot: targetIndex + 1 };
}

/**
 * Calcule le slot cible après relâchement d'un geste horizontal en tenant compte
 * de la position de départ, du déplacement et de la vélocité.
 */
export function resolveSwipeReleaseTarget(params: {
  startX: number;
  currentX: number;
  velocityX: number;
  slideStep: number;
  count: number;
}): { visualSlot: number; settledSlot: number; realIndex: number } {
  const { startX, currentX, velocityX, slideStep, count } = params;
  if (count <= 1 || slideStep <= 0) {
    return { visualSlot: 0, settledSlot: 0, realIndex: 0 };
  }

  const baseSlot = Math.max(1, Math.min(count, Math.round(-startX / slideStep)));
  const dx = currentX - startX;
  const threshold = slideStep * 0.18;

  let visualSlot = Math.max(0, Math.min(count + 1, Math.round(-currentX / slideStep)));
  if (dx < -threshold || velocityX < -0.35) {
    visualSlot = Math.min(count + 1, baseSlot + 1);
  } else if (dx > threshold || velocityX > 0.35) {
    visualSlot = Math.max(0, baseSlot - 1);
  }

  if (visualSlot === 0) {
    return { visualSlot: 0, settledSlot: count, realIndex: count - 1 };
  }
  if (visualSlot === count + 1) {
    return { visualSlot: count + 1, settledSlot: 1, realIndex: 0 };
  }
  return { visualSlot, settledSlot: visualSlot, realIndex: visualSlot - 1 };
}

/**
 * Résout la destination interne ou externe lors du clic sur une bannière.
 */
export function resolveBannerAction(
  banner: PromoBanner,
  boostDestination: string,
): BannerTargetAction {
  switch (banner.link_type) {
    case 'express':
      return { internalRoute: '/express' };
    case 'listing':
      return banner.link_target ? { internalRoute: `/listing/${banner.link_target}` } : {};
    case 'seller':
      return banner.link_target ? { internalRoute: `/seller/${banner.link_target}` } : {};
    case 'external':
      return banner.link_target ? { externalUrl: banner.link_target } : {};
    default:
      if (banner.link_target === '/pro/packs') {
        return { internalRoute: boostDestination };
      }
      return banner.link_target ? { internalRoute: banner.link_target } : {};
  }
}

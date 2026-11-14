import React, { useState, useEffect } from 'react';
import { View, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import {
  colors,
  AppText,
  AppPressable,
  showAlert,
} from '@daloa/ui';
import { deliveryRadarStyles as styles } from './deliveryRadarCard.styles';
import {
  Navigation,
  PhoneCall,
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react-native';
import {
  deliveryTrackingService,
  calculateTrackingFreshness,
  computeDriverEta,
} from '@daloa/api';
import { Coordinates, RunTrackingFreshness } from '@daloa/types';

interface DeliveryRadarCardProps {
  assignmentId: string;
  driver: {
    id: string;
    name: string;
    phone?: string | null;
    photo_url?: string | null;
    vehicle_type?: string | null;
    rating?: number | null;
  };
  buyerCoords?: Coordinates | null;
  deliveryAddress: string;
  initialDriverCoords?: Coordinates | null;
  initialUpdatedAt?: string | null;
}

const FRESHNESS_CONFIG: Record<
  RunTrackingFreshness,
  { label: string; dotColor: string; bgBadge: string; textBadge: string }
> = {
  live: {
    label: 'Signal direct',
    dotColor: colors.status.success,
    bgBadge: colors.status.successLight,
    textBadge: colors.status.successDark,
  },
  stale: {
    label: 'Signal faible',
    dotColor: colors.status.warning,
    bgBadge: colors.status.warningLight,
    textBadge: colors.status.warningDark,
  },
  disconnected: {
    label: 'Hors ligne',
    dotColor: colors.text.muted,
    bgBadge: colors.bg.subtle,
    textBadge: colors.text.muted,
  },
};

export function DeliveryRadarCard({
  assignmentId,
  driver,
  buyerCoords,
  deliveryAddress,
  initialDriverCoords,
  initialUpdatedAt,
}: DeliveryRadarCardProps) {
  const [driverCoords, setDriverCoords] = useState<Coordinates | null>(
    initialDriverCoords || null
  );
  const [lastUpdateMs, setLastUpdateMs] = useState<number>(() => {
    if (!initialUpdatedAt) return 0;
    const parsed = new Date(initialUpdatedAt).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [freshness, setFreshness] = useState<RunTrackingFreshness>('disconnected');

  useEffect(() => {
    if (lastUpdateMs === 0) {
      setFreshness('disconnected');
      return;
    }
    setFreshness(calculateTrackingFreshness(lastUpdateMs));

    const interval = setInterval(() => {
      setFreshness(calculateTrackingFreshness(lastUpdateMs));
    }, 5000);

    return () => clearInterval(interval);
  }, [lastUpdateMs]);

  useEffect(() => {
    if (!assignmentId) return;

    const unsubscribe = deliveryTrackingService.subscribeToRunLocation(
      assignmentId,
      (event) => {
        setDriverCoords({ lat: event.lat, lng: event.lng });
        setLastUpdateMs(event.timestamp);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [assignmentId]);

  const handleCallDriver = () => {
    if (!driver.phone) {
      showAlert('Numéro indisponible', 'Le livreur n’a pas renseigné de numéro de téléphone.');
      return;
    }
    Linking.openURL(`tel:${driver.phone.replace(/\s+/g, '')}`).catch(() => {
      showAlert('Erreur', 'Impossible de lancer l’appel.');
    });
  };

  const handleOpenExternalMap = () => {
    if (driverCoords) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${driverCoords.lat},${driverCoords.lng}`;
      const label = encodeURIComponent(`Livreur DaloaMarket (${driver.name})`);
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          const fallback = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
          Linking.openURL(fallback);
        });
        return;
      }
    }
    const encoded = encodeURIComponent(`${deliveryAddress}, Daloa`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  // Calcul dynamique de la distance et de l'ETA si coordonnées disponibles
  const defaultDestination = buyerCoords || { lat: 6.8773, lng: -6.4502 };
  const trackingMetrics = driverCoords
    ? computeDriverEta(driverCoords, defaultDestination)
    : null;

  const currentBadge = FRESHNESS_CONFIG[freshness];

  return (
    <View style={styles.cardContainer}>
      {/* En-tête : titre & badge fraîcheur */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Radio size={16} color={colors.primary.DEFAULT} />
          <AppText variant="label" color={colors.text.DEFAULT}>
            Radar de livraison
          </AppText>
        </View>

        <View style={[styles.freshnessBadge, { backgroundColor: currentBadge.bgBadge }]}>
          <View style={[styles.pulseDot, { backgroundColor: currentBadge.dotColor }]} />
          <AppText variant="caption" color={currentBadge.textBadge} style={styles.freshnessText}>
            {currentBadge.label}
          </AppText>
        </View>
      </View>

      {/* Profil du livreur & bouton appel */}
      <View style={styles.driverSection}>
        <View style={styles.driverAvatar}>
          {driver.photo_url ? (
            <Image source={{ uri: driver.photo_url }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <AppText variant="bodyStrong" color={colors.primary.DEFAULT}>
              {driver.name.charAt(0).toUpperCase()}
            </AppText>
          )}
        </View>

        <View style={styles.driverInfo}>
          <AppText variant="bodyStrong" color={colors.text.DEFAULT} numberOfLines={1}>
            {driver.name}
          </AppText>
          <AppText variant="caption" color={colors.text.muted}>
            Livreur DaloaDelivery · {driver.vehicle_type || 'Moto'}
          </AppText>
        </View>

        {Boolean(driver.phone) && (
          <AppPressable onPress={handleCallDriver} style={styles.callButton}>
            <PhoneCall size={16} color={colors.status.success} />
          </AppPressable>
        )}
      </View>

      {/* Métriques clés en police tabulaire */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Navigation size={14} color={colors.text.muted} />
          <AppText variant="caption" color={colors.text.muted}>
            Distance
          </AppText>
          <AppText variant="bodyStrong" color={colors.text.DEFAULT} style={styles.tabularNumber}>
            {trackingMetrics ? `${trackingMetrics.distanceKm} km` : 'Calcul...'}
          </AppText>
        </View>

        <View style={styles.metricCard}>
          <Clock size={14} color={colors.text.muted} />
          <AppText variant="caption" color={colors.text.muted}>
            Arrivée estimée
          </AppText>
          <AppText variant="bodyStrong" color={colors.primary.DEFAULT} style={styles.tabularNumber}>
            {trackingMetrics ? `~${trackingMetrics.etaMinutes} min` : 'En route'}
          </AppText>
        </View>
      </View>

      {/* Bouton dépliant Option C */}
      <AppPressable
        onPress={() => setIsExpanded((prev) => !prev)}
        style={styles.expandToggle}
      >
        <AppText variant="bodyStrong" color={colors.primary.DEFAULT}>
          {isExpanded ? 'Masquer les coordonnées' : 'Voir la carte du trajet (1 tap)'}
        </AppText>
        {isExpanded ? (
          <ChevronUp size={16} color={colors.primary.DEFAULT} />
        ) : (
          <ChevronDown size={16} color={colors.primary.DEFAULT} />
        )}
      </AppPressable>

      {/* Vue dépliée de la carte & itinéraire externe */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.destinationBox}>
            <MapPin size={16} color={colors.primary.DEFAULT} style={styles.pinIcon} />
            <View style={styles.destinationTextGroup}>
              <AppText variant="caption" color={colors.text.muted}>
                Adresse de livraison :
              </AppText>
              <AppText variant="body" color={colors.text.DEFAULT} numberOfLines={2}>
                {deliveryAddress}
              </AppText>
            </View>
          </View>

          <AppPressable
            onPress={handleOpenExternalMap}
            style={styles.openMapButton}
          >
            <ExternalLink size={16} color={colors.text.inverse} />
            <AppText variant="bodyStrong" color={colors.text.inverse}>
              Ouvrir le guidage Google Maps
            </AppText>
          </AppPressable>

          <AppText variant="caption" color={colors.text.subtle} style={styles.radarHint}>
            Signal GPS actualisé toutes les 15 secondes pendant la course active.
          </AppText>
        </View>
      )}
    </View>
  );
}

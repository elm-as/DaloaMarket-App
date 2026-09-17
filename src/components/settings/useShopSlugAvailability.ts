import { useState, useEffect, useRef } from 'react';
import { supabase } from '@daloa/api';

export type SlugAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken';

export interface UseShopSlugAvailabilityResult {
  cleanSlug: string;
  status: SlugAvailabilityStatus;
  message: string | null;
  isAvailable: boolean;
  isTaken: boolean;
  isChecking: boolean;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Vérifie en temps réel et de manière optimisée (débouncée à 400ms)
 * la disponibilité d'un slug de boutique via l'index unique Postgres.
 * Évite tout scan lourd de la base de données.
 */
export function useShopSlugAvailability(
  rawInput: string,
  currentUserId?: string,
  initialSlug?: string | null
): UseShopSlugAvailabilityResult {
  const cleanSlug = generateSlug(rawInput || '');
  const normalizedInitial = generateSlug(initialSlug || '');

  const [status, setStatus] = useState<SlugAvailabilityStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQueryRef = useRef<string>('');

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si le slug est identique au slug actuel ou vide
    if (!cleanSlug || cleanSlug === normalizedInitial) {
      setStatus('idle');
      setMessage(null);
      return;
    }

    if (cleanSlug.length < 3) {
      setStatus('idle');
      setMessage('Minimum 3 caractères');
      return;
    }

    setStatus('checking');
    setMessage('Vérification de la disponibilité...');

    debounceTimerRef.current = setTimeout(async () => {
      activeQueryRef.current = cleanSlug;
      try {
        let query = supabase
          .from('users')
          .select('id')
          .eq('shop_slug', cleanSlug)
          .limit(1);

        if (currentUserId) {
          query = query.neq('id', currentUserId);
        }

        const { data, error } = await query.maybeSingle();

        // Éviter les réponses désordonnées en cas de frappe rapide
        if (activeQueryRef.current !== cleanSlug) return;

        if (error) {
          setStatus('idle');
          setMessage(null);
          return;
        }

        if (data && data.id) {
          setStatus('taken');
          setMessage('Cet identifiant est déjà utilisé par une autre boutique.');
        } else {
          setStatus('available');
          setMessage('Cet identifiant est disponible !');
        }
      } catch {
        if (activeQueryRef.current === cleanSlug) {
          setStatus('idle');
          setMessage(null);
        }
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cleanSlug, currentUserId, normalizedInitial]);

  return {
    cleanSlug,
    status,
    message,
    isAvailable: status === 'available',
    isTaken: status === 'taken',
    isChecking: status === 'checking',
  };
}

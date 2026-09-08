import { createClient } from '@supabase/supabase-js';
import { Database } from '@daloa/types';
import { ENV_CONFIG } from '@daloa/config';
import { SecureStorageAdapter } from '@daloa/utils';

/**
 * Wrapper de fetch avec timeout (15s) pour éviter les requêtes suspendues
 * indéfiniment lors de la reprise de l'application en arrière-plan sur mobile.
 */
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (init?.signal) {
    init.signal.addEventListener('abort', () => controller.abort());
  }

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timer);
  });
};

export const supabase = createClient<any>(
  ENV_CONFIG.SUPABASE_URL,
  ENV_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: SecureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  }
);

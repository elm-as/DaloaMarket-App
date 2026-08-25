import { createClient } from '@supabase/supabase-js';
import { Database } from '@daloa/types';
import { ENV_CONFIG } from '@daloa/config';
import { SecureStorageAdapter } from '@daloa/utils';

export const supabase = createClient<Database>(
  ENV_CONFIG.SUPABASE_URL,
  ENV_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: SecureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);


import { createClient } from '@supabase/supabase-js';

// Thông tin kết nối từ Project của bạn
export const SUPABASE_URL = 'https://savcmyugqmwviplclvec.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_HYCXYQJycjZDoBI0S2ESrw_233oabVJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Keep false to prevent url clutter
    },
    global: {
        headers: {
            'x-client-info': 'mamnon-ai-app',
        },
        // Increase fetch timeout if possible (custom fetch)
        fetch: (url, options) => {
            return fetch(url, { ...options, signal: options?.signal });
        }
    },
});

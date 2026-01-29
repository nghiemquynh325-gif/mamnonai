
import { createClient } from '@supabase/supabase-js';

// Thông tin kết nối từ Project của bạn
const SUPABASE_URL = 'https://savcmyugqmwviplclvec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HYCXYQJycjZDoBI0S2ESrw_233oabVJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

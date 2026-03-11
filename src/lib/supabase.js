import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'https://xxx.supabase.co') {
    console.warn('[Supabase] Chưa cấu hình VITE_SUPABASE_URL trong file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These values are now read from your .env.local file
// VITE_SUPABASE_URL=https://nsgnnoxdtpchjlefnsad.supabase.co
// VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined in your .env.local file");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

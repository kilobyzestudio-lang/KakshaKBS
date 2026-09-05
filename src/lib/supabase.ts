import { createClient } from '@supabase/supabase-js';

// Supabase Environment Credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uzmhxxmbblboavwbuyqg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bWh4eG1iYmxib2F2d2J1eXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1OTYzNzYsImV4cCI6MjEwNDE3MjM3Nn0.v3pQcCZKKBssLsjTeKt86_7VJoaekooG1VJCpwp3voY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tybmpcvwjugzoyworgfx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym1wY3Z3anVnem95d29yZ2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTg2NDgsImV4cCI6MjA3MjM5NDY0OH0.rb3NYKP6JNXfvD1XeVBBouUeX28VUB83ltKGI-yjdUY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
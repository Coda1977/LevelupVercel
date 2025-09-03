/**
 * Central configuration file for LevelUp
 * Single source of truth for all environment variables and settings
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // Supabase configuration
  supabase: {
    url: process.env.VITE_SUPABASE_URL || 'https://tybmpcvwjugzoyworgfx.supabase.co',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    projectRef: 'tybmpcvwjugzoyworgfx',
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    ttsModel: '1',
    ttsVoice: 'alloy',
  },
  
  // Admin configuration
  admin: {
    email: 'tinymanagerai@gmail.com',
  },
  
  // App URLs
  urls: {
    production: 'https://levelup-vercel.vercel.app',
    development: 'http://localhost:3000',
  },
  
  // Feature flags
  features: {
    emailAuth: true,
    googleAuth: true,
    audioNarration: true,
    aiChat: true,
  },
};

export default config;
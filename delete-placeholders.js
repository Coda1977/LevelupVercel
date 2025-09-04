#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://tybmpcvwjugzoyworgfx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym1wY3Z3anVnem95d29yZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxODY0OCwiZXhwIjoyMDcyMzk0NjQ4fQ.fg0est6LqOr738F30ChP3WSNUljlvEoVCLd3Z_Rw-pc',
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function deletePlaceholders() {
  console.log('🗑️  Deleting placeholder categories...\n');
  
  const placeholderSlugs = ['leadership', 'communication', 'productivity', 'team-building'];
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .in('slug', placeholderSlugs);
  
  if (error) {
    console.error('Error deleting categories:', error);
  } else {
    console.log('✅ Placeholder categories deleted!');
  }
  
  // Check what remains
  const { data: remaining } = await supabase
    .from('categories')
    .select('*');
    
  console.log(`\n📊 Remaining categories: ${remaining?.length || 0}`);
  if (remaining && remaining.length > 0) {
    remaining.forEach(cat => {
      console.log(`  - ${cat.title} (${cat.slug})`);
    });
  }
}

deletePlaceholders().catch(console.error);
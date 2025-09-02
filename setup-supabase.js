#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script sets up the database schema and authentication for the LevelUp app
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase configuration
const SUPABASE_URL = 'https://dkynzjflftdagvzqghkm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreW56amZsZnRkYWd2enFnaGttIiwicm9sZSI6InNlcnZpY2Vfc3JvbGUiLCJpYXQiOjE3MzU4MjkzMjksImV4cCI6MjA1MTQwNTMyOX0.J7NUFbX0qEKJAO6J-_s47jLWLW7PYnAr3OPfTqoVKgA';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'setup-database.sql'), 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: sqlContent 
    }).single();
    
    if (error) {
      // If RPC doesn't exist, try direct approach
      console.log('Note: Direct SQL execution via RPC not available. Please run the SQL manually in Supabase Dashboard.');
      console.log('SQL file location: setup-database.sql');
      return false;
    }
    
    console.log('✅ Database schema created successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}

async function insertSampleData() {
  console.log('Inserting sample data...');
  
  try {
    // Insert sample categories
    const categories = [
      { slug: 'leadership', title: 'Leadership', description: 'Develop your leadership skills', sort_order: 1 },
      { slug: 'communication', title: 'Communication', description: 'Master effective communication', sort_order: 2 },
      { slug: 'productivity', title: 'Productivity', description: 'Boost your productivity', sort_order: 3 },
      { slug: 'team-building', title: 'Team Building', description: 'Build stronger teams', sort_order: 4 }
    ];
    
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .insert(categories)
      .select();
    
    if (categoryError) {
      console.log('Categories might already exist or error:', categoryError.message);
    } else {
      console.log('✅ Sample categories inserted!');
    }
    
    // Insert sample chapters
    const chapters = [
      {
        slug: 'intro-to-leadership',
        title: 'Introduction to Leadership',
        preview: 'Learn the fundamentals of effective leadership',
        content: 'Leadership is about inspiring and guiding others toward a common goal...',
        duration: '15 min',
        category_id: 1,
        chapter_number: 1,
        content_type: 'lesson'
      },
      {
        slug: 'effective-communication',
        title: 'Effective Communication Strategies',
        preview: 'Master the art of clear and impactful communication',
        content: 'Communication is the cornerstone of successful leadership...',
        duration: '20 min',
        category_id: 2,
        chapter_number: 1,
        content_type: 'lesson'
      }
    ];
    
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .insert(chapters)
      .select();
    
    if (chapterError) {
      console.log('Chapters might already exist or error:', chapterError.message);
    } else {
      console.log('✅ Sample chapters inserted!');
    }
    
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}

async function main() {
  console.log('🚀 Starting Supabase setup for LevelUp...\n');
  
  // Setup database
  const dbSetup = await setupDatabase();
  
  if (!dbSetup) {
    console.log('\n⚠️  Database setup requires manual intervention.');
    console.log('Please follow these steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/dkynzjflftdagvzqghkm/sql/new');
    console.log('2. Copy the contents of setup-database.sql');
    console.log('3. Paste and run in the SQL editor');
    console.log('4. Enable Email authentication in Authentication > Providers');
    return;
  }
  
  // Insert sample data
  await insertSampleData();
  
  console.log('\n✅ Supabase setup complete!');
  console.log('\nNext steps:');
  console.log('1. Enable Email authentication at:');
  console.log('   https://supabase.com/dashboard/project/dkynzjflftdagvzqghkm/auth/providers');
  console.log('2. Configure email templates if needed');
  console.log('3. The app is ready to use!');
}

main().catch(console.error);
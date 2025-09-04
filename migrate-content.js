#!/usr/bin/env node

/**
 * Content Migration Script
 * Migrates all categories and chapters from original Neon database to new Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Original Neon database connection
const neonPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qIpoXt23nkHS@ep-delicate-star-adxw0x7u.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

// New Supabase database connection
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://tybmpcvwjugzoyworgfx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym1wY3Z3anVnem95d29yZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxODY0OCwiZXhwIjoyMDcyMzk0NjQ4fQ.fg0est6LqOr738F30ChP3WSNUljlvEoVCLd3Z_Rw-pc',
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function migrateContent() {
  console.log('🚀 Starting content migration from Neon to Supabase\n');
  
  try {
    // Step 1: Connect to original database and fetch categories
    console.log('📂 Fetching categories from original database...');
    const categoriesResult = await neonPool.query(`
      SELECT * FROM categories 
      ORDER BY sort_order, id
    `);
    
    const originalCategories = categoriesResult.rows;
    console.log(`   Found ${originalCategories.length} categories`);
    
    // Step 2: Fetch chapters
    console.log('📚 Fetching chapters from original database...');
    const chaptersResult = await neonPool.query(`
      SELECT * FROM chapters 
      ORDER BY category_id, chapter_number, id
    `);
    
    const originalChapters = chaptersResult.rows;
    console.log(`   Found ${originalChapters.length} chapters`);
    
    // Step 3: Display what we found
    console.log('\n📋 Content Summary:');
    originalCategories.forEach(cat => {
      const chapterCount = originalChapters.filter(ch => ch.category_id === cat.id).length;
      console.log(`   📁 ${cat.title} (${cat.slug}) - ${chapterCount} chapters`);
    });
    
    // Step 4: Migrate categories to Supabase
    console.log('\n⬆️  Migrating categories to Supabase...');
    const categoryMapping = new Map(); // old_id -> new_id
    
    for (const cat of originalCategories) {
      const categoryData = {
        slug: cat.slug,
        title: cat.title,
        description: cat.description,
        icon_type: cat.icon_type,
        sort_order: cat.sort_order
      };
      
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
      
      if (error) {
        console.error(`   ❌ Error inserting category "${cat.title}":`, error.message);
        continue;
      }
      
      categoryMapping.set(cat.id, newCategory.id);
      console.log(`   ✅ ${cat.title} -> ID: ${newCategory.id}`);
    }
    
    // Step 5: Migrate chapters to Supabase
    console.log('\n📖 Migrating chapters to Supabase...');
    let migratedCount = 0;
    
    for (const chapter of originalChapters) {
      const newCategoryId = categoryMapping.get(chapter.category_id);
      
      if (!newCategoryId) {
        console.log(`   ⚠️  Skipping chapter "${chapter.title}" - category not found`);
        continue;
      }
      
      const chapterData = {
        slug: chapter.slug,
        title: chapter.title,
        preview: chapter.preview,
        content: chapter.content,
        duration: chapter.duration,
        category_id: newCategoryId,
        chapter_number: chapter.chapter_number,
        youtube_url: chapter.youtube_url,
        spotify_url: chapter.spotify_url,
        try_this_week: chapter.try_this_week,
        content_type: chapter.content_type || 'lesson',
        author: chapter.author,
        reading_time: chapter.reading_time,
        key_takeaways: chapter.key_takeaways,
        audio_url: chapter.audio_url
      };
      
      const { data: newChapter, error } = await supabase
        .from('chapters')
        .insert(chapterData)
        .select()
        .single();
      
      if (error) {
        console.error(`   ❌ Error inserting chapter "${chapter.title}":`, error.message);
        continue;
      }
      
      migratedCount++;
      console.log(`   ✅ "${chapter.title}" -> ID: ${newChapter.id}`);
    }
    
    // Step 6: Verify migration
    console.log('\n🔍 Verifying migration...');
    const { data: newCategories } = await supabase.from('categories').select('*');
    const { data: newChapters } = await supabase.from('chapters').select('*');
    
    console.log(`\n✅ Migration Complete!`);
    console.log(`   📁 Categories migrated: ${newCategories?.length || 0}/${originalCategories.length}`);
    console.log(`   📚 Chapters migrated: ${newChapters?.length || 0}/${originalChapters.length}`);
    
    // Step 7: Show final content summary
    if (newCategories && newCategories.length > 0) {
      console.log('\n📊 Final Content Structure:');
      for (const cat of newCategories) {
        const chapterCount = newChapters?.filter(ch => ch.category_id === cat.id).length || 0;
        console.log(`   📁 ${cat.title} - ${chapterCount} chapters`);
        
        const chapters = newChapters?.filter(ch => ch.category_id === cat.id) || [];
        chapters.forEach(ch => {
          console.log(`      📖 ${ch.chapter_number}. ${ch.title}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await neonPool.end();
    console.log('\n🏁 Migration script completed.');
  }
}

migrateContent().catch(console.error);
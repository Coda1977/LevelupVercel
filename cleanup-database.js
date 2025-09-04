#!/usr/bin/env node

/**
 * Database Cleanup Script - Remove placeholder data and find real content
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://tybmpcvwjugzoyworgfx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym1wY3Z3anVnem95d29yZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxODY0OCwiZXhwIjoyMDcyMzk0NjQ4fQ.fg0est6LqOr738F30ChP3WSNUljlvEoVCLd3Z_Rw-pc',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  console.log('🧹 Database Cleanup - Finding and removing placeholder data\n');
  
  try {
    // First, let's see what's currently in the database
    console.log('📋 Current database content:');
    
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    if (catError) {
      console.error('Error fetching categories:', catError);
      return;
    }
    
    console.log(`\n📁 Categories (${categories?.length || 0}):`);
    categories?.forEach(cat => {
      console.log(`  - ${cat.title} (${cat.slug}) - Order: ${cat.sort_order}`);
    });
    
    const { data: chapters, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .order('category_id', { ascending: true })
      .order('chapter_number', { ascending: true });
    
    if (chapterError) {
      console.error('Error fetching chapters:', chapterError);
      return;
    }
    
    console.log(`\n📚 Chapters (${chapters?.length || 0}):`);
    chapters?.forEach(ch => {
      console.log(`  - "${ch.title}" (${ch.slug}) - Cat: ${ch.category_id}, #${ch.chapter_number}`);
      console.log(`    Content: ${ch.content ? ch.content.substring(0, 100) + '...' : 'No content'}`);
    });
    
    // Identify placeholder content (the samples from setup scripts)
    const placeholderSlugs = [
      'intro-to-leadership',
      'effective-communication'
    ];
    
    const placeholderCategorySlugs = [
      'leadership',
      'communication', 
      'productivity',
      'team-building'
    ];
    
    // Check if these are the placeholder chapters
    const placeholderChapters = chapters?.filter(ch => 
      placeholderSlugs.includes(ch.slug) || 
      ch.content?.includes('Leadership is about inspiring') ||
      ch.content?.includes('Communication is the cornerstone')
    );
    
    if (placeholderChapters && placeholderChapters.length > 0) {
      console.log(`\n🗑️  Found ${placeholderChapters.length} placeholder chapters to delete:`);
      placeholderChapters.forEach(ch => {
        console.log(`  - "${ch.title}" (${ch.slug})`);
      });
      
      // Delete placeholder chapters
      const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .in('id', placeholderChapters.map(ch => ch.id));
      
      if (deleteError) {
        console.error('Error deleting placeholder chapters:', deleteError);
      } else {
        console.log('✅ Placeholder chapters deleted');
      }
    }
    
    // Check if categories are placeholders too
    const placeholderCategories = categories?.filter(cat => 
      placeholderCategorySlugs.includes(cat.slug) &&
      ['Develop your leadership skills', 'Master effective communication', 'Boost your productivity', 'Build stronger teams'].includes(cat.description)
    );
    
    if (placeholderCategories && placeholderCategories.length > 0) {
      console.log(`\n🗑️  Found ${placeholderCategories.length} placeholder categories:`);
      placeholderCategories.forEach(cat => {
        console.log(`  - "${cat.title}" (${cat.slug}) - ${cat.description}`);
      });
      
      console.log('\n❓ Do you want to delete these placeholder categories? (They seem to be from setup scripts)');
      console.log('   If you have real categories, they should remain.');
    }
    
    // Show remaining content after cleanup
    const { data: remainingChapters } = await supabase
      .from('chapters')
      .select('*')
      .order('category_id', { ascending: true })
      .order('chapter_number', { ascending: true });
    
    console.log(`\n📊 After cleanup - Remaining chapters: ${remainingChapters?.length || 0}`);
    if (remainingChapters && remainingChapters.length > 0) {
      console.log('🎉 Found your real content:');
      remainingChapters.forEach(ch => {
        console.log(`  - "${ch.title}" (${ch.slug})`);
        console.log(`    Preview: ${ch.preview || 'No preview'}`);
        console.log(`    Content length: ${ch.content?.length || 0} characters`);
      });
    } else {
      console.log('⚠️  No chapters found after cleanup. Your content might need to be restored or created.');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

main().catch(console.error);
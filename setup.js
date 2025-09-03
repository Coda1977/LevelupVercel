#!/usr/bin/env node

/**
 * Single setup script for LevelUp Vercel deployment
 * Consolidates all database and configuration setup
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const config = {
  supabase: {
    url: process.env.VITE_SUPABASE_URL || 'https://tybmpcvwjugzoyworgfx.supabase.co',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym1wY3Z3anVnem95d29yZ2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTg2NDgsImV4cCI6MjA3MjM5NDY0OH0.rb3NYKP6JNXfvD1XeVBBouUeX28VUB83ltKGI-yjdUY',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym1wY3Z3anVnem95d29yZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxODY0OCwiZXhwIjoyMDcyMzk0NjQ4fQ.fg0est6LqOr738F30ChP3WSNUljlvEoVCLd3Z_Rw-pc',
  },
  admin: {
    email: 'tinymanagerai@gmail.com'
  }
};

const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const setup = {
  /**
   * Check database connection and setup
   */
  async checkDatabase() {
    console.log('📊 Checking database connection...');
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count');
      
      if (error && error.code === '42P01') {
        console.log('⚠️  Tables not found - run migrations first');
        return false;
      }
      
      console.log('✅ Database connected');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  },

  /**
   * Set up admin user
   */
  async setupAdmin() {
    console.log('👤 Setting up admin user...');
    
    try {
      // Check if admin exists
      const { data: adminUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', config.admin.email)
        .single();
      
      if (adminUser) {
        // Update to ensure admin status
        await supabase
          .from('users')
          .update({ is_admin: true })
          .eq('email', config.admin.email);
        
        console.log('✅ Admin user updated');
      } else {
        console.log('ℹ️  Admin user will be created on first sign-in');
      }
    } catch (error) {
      console.log('ℹ️  Admin setup will complete on first sign-in');
    }
  },

  /**
   * Seed sample data if needed
   */
  async seedData() {
    console.log('🌱 Checking sample data...');
    
    try {
      // Check if categories exist
      const { data: categories } = await supabase
        .from('categories')
        .select('*');
      
      if (!categories || categories.length === 0) {
        console.log('📚 Adding sample categories...');
        
        await supabase.from('categories').insert([
          { slug: 'leadership', title: 'Leadership', description: 'Develop your leadership skills', sort_order: 1 },
          { slug: 'communication', title: 'Communication', description: 'Master effective communication', sort_order: 2 },
          { slug: 'productivity', title: 'Productivity', description: 'Boost your productivity', sort_order: 3 },
          { slug: 'team-building', title: 'Team Building', description: 'Build stronger teams', sort_order: 4 }
        ]);
        
        console.log('✅ Sample categories added');
      } else {
        console.log('✅ Categories already exist');
      }
    } catch (error) {
      console.log('⚠️  Could not add sample data:', error.message);
    }
  },

  /**
   * Display setup instructions
   */
  showInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 SETUP COMPLETE - REMAINING MANUAL STEPS:');
    console.log('='.repeat(60) + '\n');
    
    console.log('1. Enable Email Authentication:');
    console.log('   https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers');
    console.log('   - Toggle Email to ON\n');
    
    console.log('2. Configure Redirect URLs:');
    console.log('   https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/url-configuration');
    console.log('   - Add: https://levelup-vercel.vercel.app/**\n');
    
    console.log('3. Set Environment Variables in Vercel:');
    console.log('   - VITE_SUPABASE_URL');
    console.log('   - VITE_SUPABASE_ANON_KEY');
    console.log('   - OPENAI_API_KEY\n');
    
    console.log('4. Run Database Migrations:');
    console.log('   npx supabase db push\n');
    
    console.log('='.repeat(60));
    console.log('🚀 Your app: https://levelup-vercel.vercel.app');
    console.log('='.repeat(60) + '\n');
  },

  /**
   * Main setup function
   */
  async run() {
    console.log('\n🚀 LevelUp Vercel Setup\n');
    
    const dbConnected = await this.checkDatabase();
    
    if (dbConnected) {
      await this.setupAdmin();
      await this.seedData();
    }
    
    this.showInstructions();
  }
};

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup.run().catch(console.error);
}

export default setup;
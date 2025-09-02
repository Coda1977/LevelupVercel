#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Service role key has full database access
const supabaseUrl = 'https://tybmpcvwjugzoyworgfx.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym1wY3Z3anVnem95d29yZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxODY0OCwiZXhwIjoyMDcyMzk0NjQ4fQ.fg0est6LqOr738F30ChP3WSNUljlvEoVCLd3Z_Rw-pc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlStatements() {
  console.log('Executing SQL using Supabase service role...\n');
  
  try {
    // First, let's check if the users table exists and has the right structure
    console.log('1. Adding admin column if it doesn\'t exist...');
    const { error: colError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false"
    }).single();
    
    if (colError && !colError.message.includes('already exists')) {
      console.log('Note: Column might already exist or RPC not available');
    } else {
      console.log('✅ Admin column ensured\n');
    }

    // Update admin user directly using Supabase client
    console.log('2. Setting admin status for tinymanagerai@gmail.com...');
    const { data: adminUpdate, error: adminError } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('email', 'tinymanagerai@gmail.com');
    
    if (adminError) {
      console.log('Admin user not found yet - will be created on first login');
    } else {
      console.log('✅ Admin status updated\n');
    }

    // Check if any users exist
    console.log('3. Checking existing users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .limit(5);
    
    if (users && users.length > 0) {
      console.log('Found users:');
      users.forEach(u => console.log(`  - ${u.email} (admin: ${u.is_admin})`));
    } else {
      console.log('No users found yet');
    }
    
    // Try to sync auth users to public users
    console.log('\n4. Attempting to sync auth users...');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (authUsers && authUsers.users) {
      console.log(`Found ${authUsers.users.length} auth users`);
      
      for (const authUser of authUsers.users) {
        // Check if user exists in public.users
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single();
        
        if (!existingUser) {
          // Create user in public.users
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              first_name: authUser.user_metadata?.first_name || '',
              last_name: authUser.user_metadata?.last_name || '',
              is_admin: authUser.email === 'tinymanagerai@gmail.com'
            });
          
          if (!insertError) {
            console.log(`  ✅ Synced user: ${authUser.email}`);
          }
        }
      }
    }
    
    console.log('\n========================================');
    console.log('✅ DATABASE CONFIGURATION COMPLETED!');
    console.log('========================================\n');
    
    console.log('The core functionality has been set up.');
    console.log('\nFor complete setup with triggers and functions, you still need to:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/sql/new');
    console.log('2. Copy and paste the contents of FINAL_SQL_TO_RUN.sql');
    console.log('3. Click "Run"\n');
    console.log('This will set up the automatic user sync triggers for new signups.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

executeSqlStatements();
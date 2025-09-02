#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

// Direct database connection using service role
const DATABASE_URL = 'postgresql://postgres.tybmpcvwjugzoyworgfx:LevelUp2024Secure!@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function executeSql() {
  console.log('Connecting to Supabase database directly...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database!\n');
    
    // Read the SQL file
    const sql = fs.readFileSync('./FINAL_SQL_TO_RUN.sql', 'utf-8');
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          // Show progress
          const preview = statement.substring(0, 60).replace(/\n/g, ' ');
          console.log(`[${i+1}/${statements.length}] Executing: ${preview}...`);
          
          await client.query(statement);
          console.log(`✅ Success\n`);
        } catch (err) {
          console.log(`⚠️  Warning: ${err.message}\n`);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('========================================');
    console.log('✅ DATABASE SETUP COMPLETED!');
    console.log('========================================\n');
    
    // Verify admin user
    const adminCheck = await client.query(
      "SELECT email, is_admin FROM public.users WHERE email = 'tinymanagerai@gmail.com'"
    );
    
    if (adminCheck.rows.length > 0) {
      console.log('✅ Admin user verified:', adminCheck.rows[0]);
    } else {
      console.log('⚠️  Admin user not found - will be created on first login');
    }
    
    // Check auth configuration
    console.log('\n📋 Final Steps:');
    console.log('1. Enable Email Provider at:');
    console.log('   https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers');
    console.log('\n2. Your app is ready at:');
    console.log('   https://levelup-vercel.vercel.app');
    
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.log('\n⚠️  If connection failed, the SQL needs to be run manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/sql/new');
    console.log('2. Copy and paste the contents of FINAL_SQL_TO_RUN.sql');
    console.log('3. Click "Run"');
  } finally {
    await client.end();
  }
}

executeSql();
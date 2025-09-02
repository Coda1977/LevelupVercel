#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://dkynzjflftdagvzqghkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreW56amZsZnRkYWd2enFnaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MjkzMjksImV4cCI6MjA1MTQwNTMyOX0.o-K_sZomqME38N_-hJpQs-9B7cxCRGpJ-pgyNVYrxK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Read SQL file
const sql = fs.readFileSync('./setup-database.sql', 'utf8');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Running ${statements.length} SQL statements...`);

async function runSQL() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    console.log(`\nStatement ${i + 1}/${statements.length}:`);
    console.log(stmt.substring(0, 50) + '...');
    
    try {
      // Try to run via Supabase's query endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: stmt })
      });
      
      if (!response.ok) {
        console.log('Cannot execute directly via API');
      } else {
        console.log('✅ Success');
      }
    } catch (error) {
      console.log('Note: Direct SQL execution not available');
    }
  }
}

runSQL().catch(console.error);
#!/usr/bin/env node

import fetch from 'node-fetch';

const SUPABASE_ACCESS_TOKEN = 'sbp_7383804180ccf0ef0260970058ea68a2ac364299';
const PROJECT_REF = 'tybmpcvwjugzoyworgfx';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;

async function updateAuthConfig() {
  console.log('Configuring Supabase authentication...');
  
  try {
    // Update auth configuration
    const authConfig = {
      site_url: 'https://levelup-vercel.vercel.app',
      redirect_urls: [
        'https://levelup-vercel.vercel.app/**',
        'https://levelup-vercel-*.vercel.app/**',
        'http://localhost:3000/**'
      ],
      external_email_enabled: true,
      external_google_enabled: false, // Will be enabled manually with OAuth credentials
      mailer_autoconfirm: true, // Auto-confirm for testing (disable in production)
      sms_autoconfirm: false
    };

    const response = await fetch(`${API_URL}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authConfig)
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('Note: Some settings may need to be configured manually in the dashboard');
      console.log('Response:', error);
    } else {
      console.log('✅ Auth configuration updated!');
    }

    // Instructions for manual steps
    console.log('\n📋 Manual Steps Required:\n');
    console.log('1. Enable Email Provider:');
    console.log('   https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers');
    console.log('   - Toggle Email to ON');
    console.log('   - Optionally disable email confirmation for testing\n');
    
    console.log('2. Configure Redirect URLs:');
    console.log('   https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/url-configuration');
    console.log('   - Add: https://levelup-vercel.vercel.app/**');
    console.log('   - Add: https://levelup-vercel-*.vercel.app/**\n');
    
    console.log('3. Run SQL fixes:');
    console.log('   https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/sql/new');
    console.log('   - Copy and run the contents of supabase/migrations/20250902000005_auth_setup.sql\n');
    
    console.log('4. (Optional) Enable Google Auth:');
    console.log('   - Get OAuth credentials from Google Cloud Console');
    console.log('   - Enable Google provider in Supabase\n');

  } catch (error) {
    console.error('Error updating auth config:', error);
  }
}

updateAuthConfig();
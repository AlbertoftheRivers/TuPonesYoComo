/**
 * Build script for Cloudflare Pages.
 * Builds the Expo web app (single codebase in src/).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting web build for Cloudflare Pages...');

// Check if required environment variables are set
const requiredVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_BASE_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Warning: Missing environment variables:');
  missingVars.forEach(varName => console.warn(`   - ${varName}`));
  console.warn('   Make sure these are configured in Cloudflare Pages Environment Variables');
  console.warn('   and marked as "Available during build"');
} else {
  console.log('✅ All required environment variables are set');
}

// Log which variables are set (without showing values)
console.log('\n📋 Environment variables status:');
requiredVars.forEach(varName => {
  const isSet = !!process.env[varName];
  const value = process.env[varName] || '';
  const preview = value.length > 0 ? `${value.substring(0, 20)}...` : 'not set';
  console.log(`   ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? preview : 'not set'}`);
});

// Run the Expo export command
console.log('\n🚀 Running Expo export...');
try {
  execSync('npx expo export --platform web', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure NODE_ENV is set
      NODE_ENV: process.env.NODE_ENV || 'production',
    }
  });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}




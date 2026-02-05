// Quick test to verify Expo setup
console.log('Testing Expo setup...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

try {
  const expo = require('expo');
  console.log('✓ Expo is installed');
} catch (e) {
  console.log('✗ Expo not found:', e.message);
}

try {
  const React = require('react');
  console.log('✓ React is installed');
} catch (e) {
  console.log('✗ React not found:', e.message);
}

console.log('\nTo start Expo, run: npx expo start --clear');



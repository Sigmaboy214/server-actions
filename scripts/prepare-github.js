#!/usr/bin/env node

/**
 * Prepare repository for GitHub installation
 * This script builds the library and ensures it's ready for `pnpm i github:user/repo`
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing library for GitHub installation...\n');

// 1. Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('pnpm run clean', { stdio: 'inherit' });
} catch (error) {
  // Ignore if clean fails
}

// 2. Type check
console.log('\n🔍 Type checking...');
execSync('pnpm run typecheck', { stdio: 'inherit' });

// 3. Build the library
console.log('\n🏗️  Building library...');
execSync('pnpm run build', { stdio: 'inherit' });

// 4. Verify build outputs
console.log('\n✅ Verifying build outputs...');
const distPath = path.join(process.cwd(), 'dist');
const requiredFiles = [
  'index.js',      // CommonJS
  'index.mjs',     // ESM
  'index.d.ts',    // Types for CommonJS
  'index.d.mts',   // Types for ESM
];

requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required build file: ${file}`);
  }
  const stats = fs.statSync(filePath);
  console.log(`   ✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
});

// 5. Verify package.json
console.log('\n📦 Verifying package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredFields = ['main', 'module', 'types', 'exports', 'files'];
requiredFields.forEach(field => {
  if (!packageJson[field]) {
    throw new Error(`Missing required package.json field: ${field}`);
  }
  console.log(`   ✓ ${field}`);
});

console.log('\n🎉 Library is ready for GitHub installation!');
console.log('\n📋 Next steps:');
console.log('   1. Commit and push to GitHub');
console.log('   2. Install in your projects with:');
console.log('      pnpm add github:your-username/server-actions');
console.log('\n💡 The built files are included in the repository for GitHub installations.');
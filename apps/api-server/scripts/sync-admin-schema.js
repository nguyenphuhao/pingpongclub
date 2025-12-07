#!/usr/bin/env node

/**
 * Sync Prisma schema from dokifree-be to dokifree-admin
 * 
 * Usage: node scripts/sync-admin-schema.js
 */

const fs = require('fs');
const path = require('path');

const BE_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const ADMIN_SCHEMA_PATH = path.join(__dirname, '../../dokifree-admin/prisma/schema.prisma');

try {
  // Read schema from dokifree-be
  const schemaContent = fs.readFileSync(BE_SCHEMA_PATH, 'utf8');
  
  // Add header comment to admin schema
  const adminSchemaContent = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema
// 
// ⚠️ IMPORTANT: This schema is copied from dokifree-be
// DO NOT modify this file directly - changes should be made in dokifree-be/prisma/schema.prisma
// Then run: node scripts/sync-admin-schema.js (from dokifree-be directory)

${schemaContent}`;
  
  // Write to dokifree-admin
  fs.writeFileSync(ADMIN_SCHEMA_PATH, adminSchemaContent, 'utf8');
  
  console.log('✅ Schema synced successfully from dokifree-be to dokifree-admin');
  console.log(`   Source: ${BE_SCHEMA_PATH}`);
  console.log(`   Target: ${ADMIN_SCHEMA_PATH}`);
} catch (error) {
  console.error('❌ Error syncing schema:', error.message);
  process.exit(1);
}


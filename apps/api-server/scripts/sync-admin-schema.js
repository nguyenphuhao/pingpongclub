#!/usr/bin/env node

/**
 * Sync Prisma schema from pingclub-be to pingclub-admin
 * 
 * Usage: node scripts/sync-admin-schema.js
 */

const fs = require('fs');
const path = require('path');

const BE_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const ADMIN_SCHEMA_PATH = path.join(__dirname, '../../pingclub-admin/prisma/schema.prisma');

try {
  // Read schema from pingclub-be
  const schemaContent = fs.readFileSync(BE_SCHEMA_PATH, 'utf8');
  
  // Add header comment to admin schema
  const adminSchemaContent = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema
// 
// ⚠️ IMPORTANT: This schema is copied from pingclub-be
// DO NOT modify this file directly - changes should be made in pingclub-be/prisma/schema.prisma
// Then run: node scripts/sync-admin-schema.js (from pingclub-be directory)

${schemaContent}`;
  
  // Write to pingclub-admin
  fs.writeFileSync(ADMIN_SCHEMA_PATH, adminSchemaContent, 'utf8');
  
  console.log('✅ Schema synced successfully from pingclub-be to pingclub-admin');
  console.log(`   Source: ${BE_SCHEMA_PATH}`);
  console.log(`   Target: ${ADMIN_SCHEMA_PATH}`);
} catch (error) {
  console.error('❌ Error syncing schema:', error.message);
  process.exit(1);
}


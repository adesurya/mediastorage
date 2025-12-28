#!/usr/bin/env node
// manual-cleanup.js
// Run this script manually to cleanup uploads directory
// Usage: node manual-cleanup.js

const path = require('path');
const { cleanupUploads, cleanupOldFiles } = require('./utils/fileCleanup');

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  MANUAL FILE CLEANUP                                    ║');
  console.log('║  Deletes files older than 2 days in public/uploads      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Run cleanup
    const result = await cleanupUploads();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CLEANUP COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Files deleted: ${result.filesDeleted}`);
    console.log(`Errors: ${result.errors}`);
    console.log('');

    if (result.filesDeleted === 0) {
      console.log('✅ No old files found. Everything is clean!');
    } else {
      console.log(`✅ Successfully cleaned ${result.filesDeleted} old files.`);
    }

    if (result.errors > 0) {
      console.log(`⚠️  ${result.errors} errors occurred during cleanup.`);
      console.log('   Check logs above for details.');
    }

    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ CLEANUP FAILED');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');
    process.exit(1);
  }
}

// Run cleanup
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
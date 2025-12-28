// utils/fileCleanup.js
const fs = require('fs').promises;
const path = require('path');

/**
 * Recursively delete files older than specified days in a directory
 * @param {string} dirPath - Directory path to clean
 * @param {number} retentionDays - Number of days to keep files (default: 2)
 * @returns {Promise<{filesDeleted: number, errors: number}>}
 */
async function cleanupOldFiles(dirPath, retentionDays = 2) {
  let filesDeleted = 0;
  let errors = 0;
  const now = Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  async function processDirectory(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively process subdirectories
          await processDirectory(fullPath);
          
          // Try to remove empty directories
          try {
            const remainingFiles = await fs.readdir(fullPath);
            if (remainingFiles.length === 0) {
              await fs.rmdir(fullPath);
              console.log(`  📂 Removed empty directory: ${fullPath}`);
            }
          } catch (err) {
            // Directory not empty or other error, skip
          }
        } else if (entry.isFile()) {
          // Check file age
          try {
            const stats = await fs.stat(fullPath);
            const fileAge = now - stats.mtimeMs; // Time since last modification

            if (fileAge > retentionMs) {
              await fs.unlink(fullPath);
              filesDeleted++;
              console.log(`  🗑️ Deleted: ${fullPath} (${Math.floor(fileAge / (24 * 60 * 60 * 1000))} days old)`);
            }
          } catch (err) {
            console.error(`  ❌ Error processing file ${fullPath}:`, err.message);
            errors++;
          }
        }
      }
    } catch (err) {
      console.error(`  ❌ Error reading directory ${currentPath}:`, err.message);
      errors++;
    }
  }

  try {
    await processDirectory(dirPath);
  } catch (err) {
    console.error(`❌ Fatal error in cleanup:`, err.message);
    errors++;
  }

  return { filesDeleted, errors };
}

/**
 * Cleanup uploads directory with 2-day retention
 * Cross-platform compatible (Linux & Windows)
 */
async function cleanupUploads() {
  const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
  
  console.log('🧹 Starting file cleanup in uploads directory...');
  console.log(`📁 Path: ${uploadsPath}`);
  console.log(`⏰ Retention: 2 days`);
  console.log('');

  try {
    // Check if uploads directory exists
    await fs.access(uploadsPath);
    
    const result = await cleanupOldFiles(uploadsPath, 2);
    
    console.log('');
    console.log('📊 Cleanup Summary:');
    console.log(`  ✅ Files deleted: ${result.filesDeleted}`);
    console.log(`  ❌ Errors: ${result.errors}`);
    console.log('');
    
    return result;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('⚠️ Uploads directory does not exist, skipping cleanup');
      return { filesDeleted: 0, errors: 0 };
    }
    throw err;
  }
}

module.exports = {
  cleanupOldFiles,
  cleanupUploads
};
#!/usr/bin/env node

/**
 * Script to backup all API keys before deletion
 * This creates a JSON backup file with all existing API key data
 * 
 * Usage: node scripts/backup-api-keys.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the SandboxApiKey model
const SandboxApiKey = require('../src/models/SandboxApiKey').default;

async function backupApiKeys() {
  try {
    console.log('🚀 Starting API key backup process...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or DATABASE_URL environment variable is required');
    }
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    
    // Get all API keys
    const apiKeys = await SandboxApiKey.find({}).lean();
    console.log(`📊 Found ${apiKeys.length} API keys to backup`);
    
    if (apiKeys.length === 0) {
      console.log('✅ No API keys found to backup');
      return;
    }
    
    // Create backup data
    const backupData = {
      timestamp: new Date().toISOString(),
      totalKeys: apiKeys.length,
      environment: process.env.NODE_ENV || 'development',
      keys: apiKeys.map(key => ({
        _id: key._id,
        userId: key.userId,
        apiKey: key.apiKey,
        // Note: We don't backup secret keys for security reasons
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        usageCount: key.usageCount,
        rateLimit: key.rateLimit,
        webhookUrl: key.webhookUrl,
        environment: key.environment,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt
      }))
    };
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `api-keys-backup-${timestamp}.json`);
    
    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created successfully: ${backupFile}`);
    console.log(`📊 Backed up ${apiKeys.length} API keys`);
    console.log(`📝 Backup includes: API keys, user IDs, settings, and metadata`);
    console.log(`🔒 Secret keys are NOT included in backup for security reasons`);
    
    // Show summary
    console.log('\n📋 Backup Summary:');
    console.log(`   Total Keys: ${apiKeys.length}`);
    console.log(`   Active Keys: ${apiKeys.filter(k => k.isActive).length}`);
    console.log(`   Inactive Keys: ${apiKeys.filter(k => !k.isActive).length}`);
    console.log(`   Total Usage: ${apiKeys.reduce((sum, k) => sum + (k.usageCount || 0), 0)} requests`);
    
    // Show unique users
    const uniqueUsers = [...new Set(apiKeys.map(k => k.userId))];
    console.log(`   Unique Users: ${uniqueUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error backing up API keys:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Handle script execution
if (require.main === module) {
  backupApiKeys()
    .then(() => {
      console.log('\n🏁 Backup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Backup failed:', error.message);
      process.exit(1);
    });
}

module.exports = backupApiKeys;

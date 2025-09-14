#!/usr/bin/env node

/**
 * Script to delete all existing API keys from the database
 * This is needed when migrating to the new single permanent API key system
 * 
 * Usage: node scripts/delete-all-api-keys.js
 * 
 * WARNING: This will permanently delete ALL API keys from the database!
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the SandboxApiKey model
const SandboxApiKey = require('../src/models/SandboxApiKey').default;

async function deleteAllApiKeys() {
  try {
    console.log('🚀 Starting API key deletion process...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or DATABASE_URL environment variable is required');
    }
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    
    // Get count of existing API keys
    const totalKeys = await SandboxApiKey.countDocuments();
    console.log(`📊 Found ${totalKeys} API keys in the database`);
    
    if (totalKeys === 0) {
      console.log('✅ No API keys found. Database is already clean!');
      return;
    }
    
    // Show some examples of keys that will be deleted
    const sampleKeys = await SandboxApiKey.find({}).limit(5).select('apiKey userId createdAt');
    console.log('\n📋 Sample keys that will be deleted:');
    sampleKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key.apiKey} (User: ${key.userId}) - Created: ${key.createdAt.toISOString()}`);
    });
    
    if (totalKeys > 5) {
      console.log(`   ... and ${totalKeys - 5} more keys`);
    }
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete ALL API keys!');
    console.log('⚠️  Users will need to generate new API keys after this operation.');
    
    // In a production environment, you might want to add a confirmation prompt
    // For now, we'll proceed with the deletion
    
    console.log('\n🗑️  Deleting all API keys...');
    
    // Delete all API keys
    const result = await SandboxApiKey.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} API keys`);
    
    // Verify deletion
    const remainingKeys = await SandboxApiKey.countDocuments();
    console.log(`🔍 Remaining API keys: ${remainingKeys}`);
    
    if (remainingKeys === 0) {
      console.log('🎉 All API keys have been successfully deleted!');
      console.log('✨ Database is now ready for the new single permanent API key system');
    } else {
      console.log('❌ Some keys may still remain. Please check the database manually.');
    }
    
  } catch (error) {
    console.error('❌ Error deleting API keys:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Handle script execution
if (require.main === module) {
  deleteAllApiKeys()
    .then(() => {
      console.log('\n🏁 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = deleteAllApiKeys;

#!/usr/bin/env node

/**
 * Interactive script to delete all existing API keys from the database
 * This version includes confirmation prompts for safety
 * 
 * Usage: node scripts/delete-all-api-keys-interactive.js
 * 
 * WARNING: This will permanently delete ALL API keys from the database!
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import the SandboxApiKey model
const SandboxApiKey = require('../src/models/SandboxApiKey').default;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

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
    
    // First confirmation
    console.log('\n⚠️  WARNING: This will permanently delete ALL API keys!');
    console.log('⚠️  Users will need to generate new API keys after this operation.');
    
    const firstConfirm = await askQuestion('\n❓ Are you sure you want to delete all API keys? (yes/no): ');
    
    if (firstConfirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user');
      return;
    }
    
    // Second confirmation with typing requirement
    console.log('\n⚠️  FINAL WARNING: This action cannot be undone!');
    const secondConfirm = await askQuestion('❓ Type "DELETE ALL API KEYS" to confirm: ');
    
    if (secondConfirm !== 'DELETE ALL API KEYS') {
      console.log('❌ Operation cancelled - confirmation text did not match');
      return;
    }
    
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
      console.log('\n📝 Next steps:');
      console.log('   1. Users will get new API keys when they first access the API key management');
      console.log('   2. The new keys will use the "tk_" prefix (TransactLab Keys)');
      console.log('   3. Each user will have only one permanent API key');
    } else {
      console.log('❌ Some keys may still remain. Please check the database manually.');
    }
    
  } catch (error) {
    console.error('❌ Error deleting API keys:', error);
    process.exit(1);
  } finally {
    // Close database connection and readline interface
    await mongoose.disconnect();
    rl.close();
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

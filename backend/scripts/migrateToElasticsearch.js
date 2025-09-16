const mongoose = require('mongoose');
const { initializeElasticsearch, getElasticsearchClient } = require('../config/elasticsearch');
const { createAllIndices } = require('../config/elasticsearchMappings');
const UserService = require('../services/UserService');
const ProducerPriceService = require('../services/ProducerPriceService');
const CropsLivestockService = require('../services/CropsLivestockService');

// Import MongoDB models
const User = require('../models/User');
const ProducerPrice = require('../models/ProducerPrice');
const CropsLivestock = require('../models/CropsLivestock');

class DataMigrationService {
  constructor() {
    this.userService = new UserService();
    this.producerPriceService = new ProducerPriceService();
    this.cropsLivestockService = new CropsLivestockService();
  }

  // Initialize migration
  async initialize() {
    try {
      console.log('🚀 Starting MongoDB to Elasticsearch migration...');
      
      // Initialize Elasticsearch
      await initializeElasticsearch();
      
      // Create all indices
      await createAllIndices();
      
      console.log('✅ Migration initialization completed');
      return true;
    } catch (error) {
      console.error('❌ Migration initialization failed:', error.message);
      return false;
    }
  }

  // Migrate users
  async migrateUsers() {
    try {
      console.log('📊 Migrating users...');
      
      const users = await User.find({}).lean();
      console.log(`Found ${users.length} users to migrate`);
      
      let migrated = 0;
      let errors = 0;
      
      for (const user of users) {
        try {
          // Convert MongoDB _id to string for Elasticsearch
          const userData = {
            ...user,
            _id: user._id.toString()
          };
          
          await this.userService.create(userData);
          migrated++;
          
          if (migrated % 100 === 0) {
            console.log(`Migrated ${migrated}/${users.length} users`);
          }
        } catch (error) {
          console.error(`Error migrating user ${user._id}:`, error.message);
          errors++;
        }
      }
      
      console.log(`✅ Users migration completed: ${migrated} migrated, ${errors} errors`);
      return { migrated, errors };
    } catch (error) {
      console.error('❌ Users migration failed:', error.message);
      throw error;
    }
  }

  // Migrate producer prices
  async migrateProducerPrices() {
    try {
      console.log('📊 Migrating producer prices...');
      
      const producerPrices = await ProducerPrice.find({}).lean();
      console.log(`Found ${producerPrices.length} producer prices to migrate`);
      
      let migrated = 0;
      let errors = 0;
      
      for (const price of producerPrices) {
        try {
          // Convert MongoDB _id to string for Elasticsearch
          const priceData = {
            ...price,
            _id: price._id.toString()
          };
          
          await this.producerPriceService.create(priceData);
          migrated++;
          
          if (migrated % 1000 === 0) {
            console.log(`Migrated ${migrated}/${producerPrices.length} producer prices`);
          }
        } catch (error) {
          console.error(`Error migrating producer price ${price._id}:`, error.message);
          errors++;
        }
      }
      
      console.log(`✅ Producer prices migration completed: ${migrated} migrated, ${errors} errors`);
      return { migrated, errors };
    } catch (error) {
      console.error('❌ Producer prices migration failed:', error.message);
      throw error;
    }
  }

  // Migrate crops and livestock data
  async migrateCropsLivestock() {
    try {
      console.log('📊 Migrating crops and livestock data...');
      
      const cropsLivestock = await CropsLivestock.find({}).lean();
      console.log(`Found ${cropsLivestock.length} crops/livestock records to migrate`);
      
      let migrated = 0;
      let errors = 0;
      
      for (const record of cropsLivestock) {
        try {
          // Convert MongoDB _id to string for Elasticsearch
          const recordData = {
            ...record,
            _id: record._id.toString()
          };
          
          await this.cropsLivestockService.create(recordData);
          migrated++;
          
          if (migrated % 1000 === 0) {
            console.log(`Migrated ${migrated}/${cropsLivestock.length} crops/livestock records`);
          }
        } catch (error) {
          console.error(`Error migrating crops/livestock record ${record._id}:`, error.message);
          errors++;
        }
      }
      
      console.log(`✅ Crops and livestock migration completed: ${migrated} migrated, ${errors} errors`);
      return { migrated, errors };
    } catch (error) {
      console.error('❌ Crops and livestock migration failed:', error.message);
      throw error;
    }
  }

  // Run complete migration
  async runMigration() {
    try {
      console.log('🚀 Starting complete data migration...');
      
      // Initialize migration
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Migration initialization failed');
      }
      
      // Migrate all data
      const results = {
        users: await this.migrateUsers(),
        producerPrices: await this.migrateProducerPrices(),
        cropsLivestock: await this.migrateCropsLivestock()
      };
      
      // Summary
      const totalMigrated = Object.values(results).reduce((sum, result) => sum + result.migrated, 0);
      const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors, 0);
      
      console.log('\n📊 Migration Summary:');
      console.log(`Total records migrated: ${totalMigrated}`);
      console.log(`Total errors: ${totalErrors}`);
      console.log('✅ Migration completed successfully!');
      
      return results;
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  // Verify migration
  async verifyMigration() {
    try {
      console.log('🔍 Verifying migration...');
      
      const client = getElasticsearchClient();
      if (!client) {
        throw new Error('Elasticsearch client not available');
      }
      
      // Get counts from Elasticsearch
      const [usersCount, producerPricesCount, cropsLivestockCount] = await Promise.all([
        this.userService.count(),
        this.producerPriceService.count(),
        this.cropsLivestockService.count()
      ]);
      
      // Get counts from MongoDB
      const [mongoUsersCount, mongoProducerPricesCount, mongoCropsLivestockCount] = await Promise.all([
        User.countDocuments(),
        ProducerPrice.countDocuments(),
        CropsLivestock.countDocuments()
      ]);
      
      console.log('\n📊 Migration Verification:');
      console.log(`Users: MongoDB=${mongoUsersCount}, Elasticsearch=${usersCount}`);
      console.log(`Producer Prices: MongoDB=${mongoProducerPricesCount}, Elasticsearch=${producerPricesCount}`);
      console.log(`Crops/Livestock: MongoDB=${mongoCropsLivestockCount}, Elasticsearch=${cropsLivestockCount}`);
      
      const isComplete = 
        usersCount === mongoUsersCount &&
        producerPricesCount === mongoProducerPricesCount &&
        cropsLivestockCount === mongoCropsLivestockCount;
      
      if (isComplete) {
        console.log('✅ Migration verification passed!');
      } else {
        console.log('⚠️  Migration verification failed - counts do not match');
      }
      
      return {
        isComplete,
        counts: {
          users: { mongo: mongoUsersCount, elasticsearch: usersCount },
          producerPrices: { mongo: mongoProducerPricesCount, elasticsearch: producerPricesCount },
          cropsLivestock: { mongo: mongoCropsLivestockCount, elasticsearch: cropsLivestockCount }
        }
      };
    } catch (error) {
      console.error('❌ Migration verification failed:', error.message);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const migrationService = new DataMigrationService();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrationService.runMigration()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Migration failed:', error);
          process.exit(1);
        });
      break;
      
    case 'verify':
      migrationService.verifyMigration()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Verification failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage: node migration.js [migrate|verify]');
      process.exit(1);
  }
}

module.exports = DataMigrationService;


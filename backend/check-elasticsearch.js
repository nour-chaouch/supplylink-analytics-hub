#!/usr/bin/env node

/**
 * Elasticsearch Status Checker
 * Checks if Elasticsearch is running and accessible
 */

const http = require('http');

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

console.log('🔍 Checking Elasticsearch status...\n');
console.log(`📍 URL: ${ELASTICSEARCH_URL}\n`);

function checkElasticsearch() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(ELASTICSEARCH_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        if (res.statusCode === 200) {
          try {
            const info = JSON.parse(data);
            console.log('✅ Elasticsearch is RUNNING!\n');
            console.log(`   Cluster Name: ${info.cluster_name}`);
            console.log(`   Version: ${info.version?.number || 'Unknown'}`);
            console.log(`   Node Name: ${info.name || 'Unknown'}`);
            console.log(`   Response Time: ${responseTime}ms\n`);
            
            // Check cluster health
            checkClusterHealth(ELASTICSEARCH_URL).then(() => {
              resolve(true);
            }).catch(() => {
              resolve(true); // Still running even if health check fails
            });
          } catch (err) {
            console.log('✅ Elasticsearch is responding (non-JSON response)');
            resolve(true);
          }
        } else {
          console.log(`⚠️  Elasticsearch responded with status code: ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Elasticsearch is NOT running\n');
        console.log('💡 To start Elasticsearch:\n');
        console.log('   Option 1: Docker');
        console.log('     docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 \\');
        console.log('       -e "discovery.type=single-node" \\');
        console.log('       -e "xpack.security.enabled=false" \\');
        console.log('       docker.elastic.co/elasticsearch/elasticsearch:8.11.0\n');
        console.log('   Option 2: Windows Service');
        console.log('     Start-Service elasticsearch\n');
        console.log('   Option 3: Manual');
        console.log('     cd C:\\elasticsearch\\elasticsearch-8.11.0\\bin');
        console.log('     .\\elasticsearch.bat\n');
        console.log('   See ELASTICSEARCH_SETUP.md for detailed instructions\n');
      } else {
        console.log(`❌ Error connecting to Elasticsearch: ${err.message}\n`);
      }
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Connection timeout - Elasticsearch may not be running\n');
      resolve(false);
    });
  });
}

function checkClusterHealth(url) {
  return new Promise((resolve, reject) => {
    const healthUrl = url.replace(/\/$/, '') + '/_cluster/health';
    
    const req = http.get(healthUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const health = JSON.parse(data);
            console.log('📊 Cluster Health:');
            console.log(`   Status: ${health.status.toUpperCase()}`);
            console.log(`   Nodes: ${health.number_of_nodes}`);
            console.log(`   Active Shards: ${health.active_shards}`);
            console.log(`   Primary Shards: ${health.active_primary_shards}\n`);
            resolve(health);
          } catch (err) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => {
      resolve(null);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

checkElasticsearch().then((isRunning) => {
  if (isRunning) {
    console.log('✅ All checks passed! Elasticsearch is ready to use.\n');
    process.exit(0);
  } else {
    console.log('❌ Elasticsearch is not accessible. Please start it and try again.\n');
    process.exit(1);
  }
});


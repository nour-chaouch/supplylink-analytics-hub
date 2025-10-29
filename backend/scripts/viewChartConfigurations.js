/**
 * Script pour visualiser les configurations de graphiques dans Elasticsearch
 * Usage: node scripts/viewChartConfigurations.js [chartId]
 */

const { getElasticsearchClient } = require('../config/elasticsearch');

async function viewChartConfigurations(chartId = null) {
  try {
    const client = getElasticsearchClient();
    
    if (!client) {
      console.error('❌ Elasticsearch client not initialized');
      process.exit(1);
    }

    const indexName = 'chart_configurations';

    // Vérifier que l'index existe
    const exists = await client.indices.exists({ index: indexName });
    
    if (!exists) {
      console.log('❌ L\'index "chart_configurations" n\'existe pas encore.');
      console.log('💡 Créez un graphique depuis le frontend pour créer l\'index.');
      process.exit(0);
    }

    // Obtenir des informations sur l'index
    const indexStats = await client.indices.stats({ index: indexName });
    const docCount = indexStats.indices[indexName].total.docs.count;
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`📊 INDEX: ${indexName}`);
    console.log(`📄 Nombre de documents: ${docCount}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (chartId) {
      // Afficher un graphique spécifique par ID
      console.log(`🔍 Recherche du graphique avec l'ID: ${chartId}\n`);
      
      try {
        const response = await client.get({
          index: indexName,
          id: chartId
        });

        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 DOCUMENT TROUVÉ');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`ID Elasticsearch: ${response._id}`);
        console.log(`Index: ${response._index}`);
        console.log(`Type: ${response._type || '_doc'}`);
        console.log(`Version: ${response._version}\n`);
        
        console.log('📦 DONNÉES:');
        console.log(JSON.stringify(response._source, null, 2));
        
      } catch (error) {
        if (error.statusCode === 404) {
          console.log(`❌ Graphique avec l'ID "${chartId}" non trouvé.`);
        } else {
          console.error(`❌ Erreur lors de la recherche:`, error.message);
        }
      }
    } else {
      // Afficher tous les graphiques
      console.log('📋 LISTE DE TOUS LES GRAPHIQUES\n');
      
      const response = await client.search({
        index: indexName,
        body: {
          query: { match_all: {} },
          sort: [{ 'metadata.createdAt': { order: 'desc' } }],
          size: 100
        }
      });

      const charts = response.hits.hits;
      
      if (charts.length === 0) {
        console.log('⚠️  Aucun graphique trouvé dans l\'index.\n');
        return;
      }

      console.log(`✅ ${charts.length} graphique(s) trouvé(s):\n`);

      charts.forEach((chart, index) => {
        const data = chart._source;
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 GRAPHIQUE #${index + 1}`);
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`ID Elasticsearch: ${chart._id}`);
        console.log(`Score: ${chart._score}`);
        console.log(`\n📝 INFORMATIONS:`);
        console.log(`   • Nom: ${data.name || 'N/A'}`);
        console.log(`   • Type: ${data.type || 'N/A'}`);
        console.log(`   • Index de données: ${data.indexName || 'N/A'}`);
        console.log(`   • Description: ${data.description || 'Aucune'}`);
        
        console.log(`\n🔧 CONFIGURATION DES DONNÉES:`);
        if (data.dataConfig) {
          console.log(`   • Axe X: ${data.dataConfig.xAxis?.field || 'N/A'} (${data.dataConfig.xAxis?.label || 'N/A'})`);
          console.log(`   • Axe Y: ${data.dataConfig.yAxis?.field || 'N/A'} (${data.dataConfig.yAxis?.label || 'N/A'})`);
          console.log(`   • Agrégation: ${data.dataConfig.yAxis?.aggregation || 'N/A'}`);
        }

        console.log(`\n🔍 FILTRES APPLIQUÉS:`);
        if (data.filters && Object.keys(data.filters).length > 0) {
          Object.entries(data.filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              console.log(`   • ${key}: [${value.slice(0, 5).join(', ')}${value.length > 5 ? `, ... (${value.length} total)` : ''}]`);
            } else if (typeof value === 'object' && value.min !== undefined) {
              console.log(`   • ${key}: ${value.min} - ${value.max}`);
            } else {
              console.log(`   • ${key}: ${value}`);
            }
          });
        } else {
          console.log(`   Aucun filtre`);
        }

        console.log(`\n👤 MÉTADONNÉES:`);
        if (data.metadata) {
          console.log(`   • Créé par: ${data.metadata.createdBy || 'N/A'}`);
          console.log(`   • Créé le: ${data.metadata.createdAt || 'N/A'}`);
          console.log(`   • Modifié le: ${data.metadata.updatedAt || 'N/A'}`);
          console.log(`   • Public: ${data.metadata.isPublic ? 'Oui' : 'Non'}`);
          if (data.metadata.tags && data.metadata.tags.length > 0) {
            console.log(`   • Tags: ${data.metadata.tags.join(', ')}`);
          }
        }

        console.log(`\n💡 Pour voir le document complet, utilisez:`);
        console.log(`   node scripts/viewChartConfigurations.js ${chart._id}\n`);
      });
    }

    // Afficher aussi des statistiques sur l'index
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📈 STATISTIQUES DE L\'INDEX');
    console.log('═══════════════════════════════════════════════════════════');
    
    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName].mappings.properties;
    
    console.log(`\n📋 Champs disponibles dans l'index:`);
    Object.keys(properties).forEach(field => {
      const fieldType = properties[field].type || 'object';
      console.log(`   • ${field}: ${fieldType}`);
    });

    console.log('\n💡 Commandes utiles:');
    console.log('   • Voir tous les graphiques: node scripts/viewChartConfigurations.js');
    console.log('   • Voir un graphique spécifique: node scripts/viewChartConfigurations.js <chartId>');
    console.log('   • Via curl: curl -X GET "http://localhost:9200/chart_configurations/_search?pretty"');
    console.log('   • Via curl (document spécifique): curl -X GET "http://localhost:9200/chart_configurations/_doc/<chartId>?pretty"');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.meta) {
      console.error('Détails:', JSON.stringify(error.meta.body, null, 2));
    }
    process.exit(1);
  }
}

// Exécuter le script
const chartId = process.argv[2] || null;
viewChartConfigurations(chartId)
  .then(() => {
    console.log('\n✅ Terminé!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });


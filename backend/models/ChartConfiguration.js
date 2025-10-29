const { getElasticsearchClient } = require('../config/elasticsearch');
const ElasticsearchService = require('../services/ElasticsearchService');

class ChartConfiguration {
  constructor() {
    this.indexName = 'chart_configurations';
    this._service = null;
  }

  // Obtenir le service (lazy initialization)
  getService() {
    // Si le service n'existe pas ou si le client n'est pas disponible, le recréer
    const client = getElasticsearchClient();
    if (!client) {
      throw new Error('Elasticsearch client not initialized. Please ensure Elasticsearch is running and connected.');
    }

    if (!this._service || !this._service.client) {
      this._service = new ElasticsearchService(this.indexName);
      // Vérifier que le service a bien le client
      if (!this._service.client) {
        throw new Error('Failed to initialize ElasticsearchService. Client not available.');
      }
    }

    return this._service;
  }

  // Obtenir le client Elasticsearch directement si nécessaire
  getClient() {
    return getElasticsearchClient();
  }

  // Créer une nouvelle configuration de graphique
  async create(userId, config) {
    try {
      // Validation basique
      if (!config.name || !config.type || !config.indexName) {
        throw new Error('Missing required fields: name, type, indexName');
      }

      // Obtenir le service (lazy initialization)
      const service = this.getService();

      const document = {
        name: config.name,
        type: config.type,
        indexName: config.indexName,
        description: config.description || '',
        
        // Configuration des données (axes, séries, etc.)
        dataConfig: config.dataConfig || {},
        
        // Filtres à appliquer
        filters: config.filters || {},
        
        // Configuration de visualisation
        visualization: config.visualization || {},
        
        // Métadonnées
        metadata: {
          createdBy: String(userId), // S'assurer que c'est une string pour Elasticsearch
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: config.tags || [],
          isPublic: config.isPublic || false,
          description: config.description || ''
        },
        
        // Version de la configuration (pour compatibilité future)
        version: '1.0'
      };

      console.log('[ChartConfiguration.create] Document to save:', JSON.stringify(document, null, 2));
      const result = await service.create(document);
      console.log('[ChartConfiguration.create] Document saved successfully:', result._id);
      return result;
    } catch (error) {
      console.error('Error creating chart configuration:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  // Mettre à jour une configuration
  async update(id, userId, updates) {
    try {
      const service = this.getService();
      const config = await this.findById(id);
      
      if (!config) {
        throw new Error('Configuration not found');
      }
      
      // Vérifier les permissions
      if (config.metadata.createdBy !== userId) {
        throw new Error('Unauthorized: You can only update your own configurations');
      }

      const updatedConfig = {
        ...config,
        ...updates,
        metadata: {
          ...config.metadata,
          updatedAt: new Date().toISOString(),
          ...(updates.tags !== undefined && { tags: updates.tags }),
          ...(updates.isPublic !== undefined && { isPublic: updates.isPublic })
        }
      };

      // Supprimer les champs système
      delete updatedConfig._id;
      delete updatedConfig._index;

      return await service.update(id, updatedConfig);
    } catch (error) {
      console.error('Error updating chart configuration:', error.message);
      throw error;
    }
  }

  // Récupérer une configuration par ID
  async findById(id) {
    try {
      const service = this.getService();
      const result = await service.findById(id);
      
      if (!result) {
        return null;
      }

      // Formater la réponse
      return {
        id: result._id,
        ...result
      };
    } catch (error) {
      console.error('Error finding chart configuration:', error.message);
      return null;
    }
  }

  // Récupérer toutes les configurations d'un utilisateur
  async findByUser(userId, includePublic = false) {
    try {
      const service = this.getService();
      
      console.log('[ChartConfiguration.findByUser] Searching for userId:', userId, 'includePublic:', includePublic);
      
      // Construire la requête selon si on inclut les publics ou non
      let query;
      
      if (includePublic) {
        // Inclure les graphiques de l'utilisateur OU les graphiques publics
        query = {
          query: {
            bool: {
              should: [
                { term: { 'metadata.createdBy': String(userId) } },
                { 
                  bool: {
                    must: [
                      { term: { 'metadata.isPublic': true } }
                    ]
                  }
                }
              ],
              minimum_should_match: 1
            }
          },
          sort: [{ 'metadata.createdAt': { order: 'desc' } }],
          size: 100
        };
      } else {
        // Uniquement les graphiques de l'utilisateur
        query = {
          query: {
            bool: {
              must: [
                { term: { 'metadata.createdBy': String(userId) } }
              ]
            }
          },
          sort: [{ 'metadata.createdAt': { order: 'desc' } }],
          size: 100
        };
      }

      console.log('[ChartConfiguration.findByUser] Query:', JSON.stringify(query, null, 2));

      const results = await service.find(query);
      
      console.log('[ChartConfiguration.findByUser] Found', results.length, 'results');
      if (results.length > 0) {
        console.log('[ChartConfiguration.findByUser] First result ID:', results[0]._id);
      }
      
      return results.map(result => ({
        id: result._id,
        ...result
      }));
    } catch (error) {
      console.error('Error finding user configurations:', error.message);
      console.error('Error stack:', error.stack);
      return [];
    }
  }

  // Rechercher des configurations publiques
  async findPublic(searchTerm = '', tags = [], limit = 20) {
    try {
      const service = this.getService();
      const mustQueries = [
        { term: { 'metadata.isPublic': true } }
      ];

      if (searchTerm) {
        mustQueries.push({
          multi_match: {
            query: searchTerm,
            fields: ['name^3', 'description', 'metadata.description'],
            fuzziness: 'AUTO',
            type: 'best_fields'
          }
        });
      }

      if (tags.length > 0) {
        mustQueries.push({
          terms: { 'metadata.tags': tags }
        });
      }

      const results = await this.service.find({
        query: {
          bool: {
            must: mustQueries
          }
        },
        sort: [{ 'metadata.createdAt': { order: 'desc' } }],
        size: limit
      });

      return results.map(result => ({
        id: result._id,
        ...result
      }));
    } catch (error) {
      console.error('Error finding public configurations:', error.message);
      return [];
    }
  }

  // Supprimer une configuration
  async delete(id, userId) {
    try {
      const service = this.getService();
      console.log('[ChartConfiguration.delete] Deleting chart ID:', id, 'by user:', userId);
      
      const config = await this.findById(id);
      console.log('[ChartConfiguration.delete] Found config:', config ? 'Yes' : 'No');
      
      if (!config) {
        throw new Error('Configuration not found');
      }
      
      // Comparer avec String() pour garantir la cohérence avec la création
      const configCreatedBy = String(config.metadata.createdBy);
      const userRequestId = String(userId);
      
      console.log('[ChartConfiguration.delete] CreatedBy:', configCreatedBy, 'User ID:', userRequestId, 'Match:', configCreatedBy === userRequestId);
      
      if (configCreatedBy !== userRequestId) {
        throw new Error('Unauthorized: You can only delete your own configurations');
      }

      const result = await service.delete(id);
      console.log('[ChartConfiguration.delete] Deletion successful');
      return result;
    } catch (error) {
      console.error('[ChartConfiguration.delete] Error:', error.message);
      console.error('[ChartConfiguration.delete] Stack:', error.stack);
      throw error;
    }
  }

  // Dupliquer une configuration
  async duplicate(id, userId, newName) {
    try {
      const original = await this.findById(id);
      
      if (!original) {
        throw new Error('Configuration not found');
      }
      
      // Vérifier si la configuration est publique ou appartient à l'utilisateur
      if (!original.metadata.isPublic && original.metadata.createdBy !== userId) {
        throw new Error('Unauthorized: Cannot duplicate this configuration');
      }

      // Créer une nouvelle configuration avec les mêmes paramètres
      const duplicateConfig = {
        name: newName || `${original.name} (Copy)`,
        type: original.type,
        indexName: original.indexName,
        description: original.description,
        dataConfig: original.dataConfig,
        filters: original.filters,
        visualization: original.visualization,
        tags: [...(original.metadata.tags || [])],
        isPublic: false // Les copies ne sont pas publiques par défaut
      };

      return await this.create(userId, duplicateConfig);
    } catch (error) {
      console.error('Error duplicating chart configuration:', error.message);
      throw error;
    }
  }
}

module.exports = new ChartConfiguration();


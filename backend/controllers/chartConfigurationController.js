const ChartConfiguration = require('../models/ChartConfiguration');
const { getElasticsearchClient } = require('../config/elasticsearch');
const ElasticsearchService = require('../services/ElasticsearchService');

// Helper: Valider et obtenir les champs disponibles d'un index
async function getIndexFields(indexName) {
  try {
    const client = getElasticsearchClient();
    if (!client) {
      throw new Error('Elasticsearch client not initialized');
    }

    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      throw new Error(`Index '${indexName}' not found`);
    }

    const mapping = await client.indices.getMapping({ index: indexName });
    const properties = mapping[indexName]?.mappings?.properties || {};

    const fields = Object.keys(properties).map(fieldName => {
      const field = properties[fieldName];
      const fieldType = field.type;
      
      // Détecter si le champ a un sous-champ keyword
      let keywordField = null;
      if (field.fields && field.fields.keyword) {
        keywordField = `${fieldName}.keyword`;
      }

      return {
        name: fieldName,
        type: fieldType,
        keywordField: keywordField,
        // Déterminer les usages possibles
        canBeAxis: fieldType === 'keyword' || fieldType === 'text' || fieldType === 'date' || fieldType === 'integer',
        canBeMetric: fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double',
        canBeFilter: true,
        canBeSeries: fieldType === 'keyword' || fieldType === 'text',
        canBeTimeField: fieldType === 'date',
        aggregatable: fieldType !== 'text' || keywordField !== null
      };
    });

    return fields;
  } catch (error) {
    console.error('Error getting index fields:', error.message);
    throw error;
  }
}

// Helper: Formater les données selon le type de graphique
function formatChartData(config, aggregations) {
  const formatted = {
    labels: [],
    datasets: [],
    metadata: {
      totalDocuments: aggregations.total_count?.value || 0,
      chartType: config.type
    }
  };

  try {
    switch (config.type) {
      case 'bar':
      case 'line':
      case 'area':
        formatBarLineAreaChart(config, aggregations, formatted);
        break;
      
      case 'pie':
      case 'doughnut':
        formatPieChart(config, aggregations, formatted);
        break;
      
      case 'scatter':
        formatScatterChart(config, aggregations, formatted);
        break;
      
      case 'table':
        formatTableChart(config, aggregations, formatted);
        break;
      
      default:
        throw new Error(`Unsupported chart type: ${config.type}`);
    }

    return formatted;
  } catch (error) {
    console.error('Error formatting chart data:', error.message);
    throw error;
  }
}

// Formater les données pour bar/line/area charts
function formatBarLineAreaChart(config, aggregations, formatted) {
  const dataConfig = config.dataConfig || {};
  const xAxisField = dataConfig.xAxis?.field;
  const yAxisField = dataConfig.yAxis?.field;
  const seriesConfig = dataConfig.series || [];

  if (seriesConfig.length > 0) {
    // Multi-séries graphique
    const allLabels = new Set();
    
    seriesConfig.forEach((series, index) => {
      const seriesAgg = aggregations[`series_${index}`];
      if (!seriesAgg) return;

      const buckets = seriesAgg.x_axis?.buckets || [];
      buckets.forEach(bucket => allLabels.add(bucket.key));
    });

    formatted.labels = Array.from(allLabels).sort();

    seriesConfig.forEach((series, index) => {
      const seriesAgg = aggregations[`series_${index}`];
      const buckets = seriesAgg?.x_axis?.buckets || [];
      
      const data = formatted.labels.map(label => {
        const bucket = buckets.find(b => String(b.key) === String(label));
        if (bucket && bucket.y_axis) {
          return bucket.y_axis.value || bucket.y_axis.values?.[0] || bucket.doc_count || 0;
        }
        return 0;
      });

      formatted.datasets.push({
        label: series.label || `Series ${index + 1}`,
        data: data,
        backgroundColor: series.color || getDefaultColor(index),
        borderColor: series.color || getDefaultColor(index),
        ...(config.type === 'area' && { fill: true })
      });
    });
  } else {
    // Single série
    const mainAgg = aggregations.main || aggregations.x_axis;
    const buckets = mainAgg?.buckets || [];

    formatted.labels = buckets.map(bucket => String(bucket.key));

    if (buckets.length > 0) {
      const firstBucket = buckets[0];
      let data;

      if (firstBucket.y_axis) {
        data = buckets.map(bucket => 
          bucket.y_axis.value || bucket.y_axis.values?.[0] || bucket.doc_count || 0
        );
      } else {
        data = buckets.map(bucket => bucket.doc_count || 0);
      }

      formatted.datasets = [{
        label: dataConfig.yAxis?.label || yAxisField || 'Value',
        data: data,
        backgroundColor: getDefaultColor(0),
        borderColor: getDefaultColor(0)
      }];
    }
  }
}

// Formater les données pour pie/doughnut charts
function formatPieChart(config, aggregations, formatted) {
  const mainAgg = aggregations.main || aggregations.group_by || aggregations.x_axis;
  const buckets = mainAgg?.buckets || [];

  formatted.labels = buckets.map(bucket => String(bucket.key));
  
  if (buckets.length > 0) {
    const firstBucket = buckets[0];
    let data;

    if (firstBucket.value || firstBucket.y_axis) {
      data = buckets.map(bucket => 
        bucket.value || bucket.y_axis?.value || bucket.doc_count || 0
      );
    } else {
      data = buckets.map(bucket => bucket.doc_count || 0);
    }

    formatted.datasets = [{
      data: data,
      backgroundColor: buckets.map((_, index) => getDefaultColor(index))
    }];
  }
}

// Formater les données pour scatter charts
function formatScatterChart(config, aggregations, formatted) {
  const buckets = aggregations.scatter_points?.buckets || [];
  const dataConfig = config.dataConfig || {};
  
  if (buckets.length === 0) {
    formatted.datasets = [{
      label: 'Points',
      data: []
    }];
    return;
  }

  // Extraire les points X et Y
  const points = [];
  
  buckets.forEach(bucket => {
    // Si on a top_hits, utiliser les documents individuels
    if (bucket.top_docs && bucket.top_docs.hits && bucket.top_docs.hits.hits.length > 0) {
      bucket.top_docs.hits.hits.forEach(hit => {
        const source = hit._source;
        const xValue = source[dataConfig.xAxis?.field] || bucket.x_value?.value;
        const yValue = source[dataConfig.yAxis?.field] || bucket.y_value?.value;
        
        if (xValue != null && yValue != null) {
          points.push({
            x: typeof xValue === 'number' ? xValue : parseFloat(xValue) || 0,
            y: typeof yValue === 'number' ? yValue : parseFloat(yValue) || 0
          });
        }
      });
    } else {
      // Sinon, utiliser les valeurs moyennes
      const xValue = bucket.x_value?.value || (bucket.key_as_string ? parseFloat(bucket.key_as_string) : bucket.key);
      const yValue = bucket.y_value?.value || bucket.doc_count;
      
      if (xValue != null && yValue != null) {
        points.push({
          x: typeof xValue === 'number' ? xValue : parseFloat(xValue) || 0,
          y: typeof yValue === 'number' ? yValue : parseFloat(yValue) || 0
        });
      }
    }
  });
  
  formatted.datasets = [{
    label: dataConfig.yAxis?.label || 'Y Value',
    data: points,
    backgroundColor: getDefaultColor(0),
    pointRadius: 4,
    pointHoverRadius: 6
  }];
  
  // Pour scatter, on n'utilise pas labels de la même façon
  formatted.metadata.scatterMode = true;
}

// Formater les données pour table charts
function formatTableChart(config, aggregations, formatted) {
  const mainAgg = aggregations.main || aggregations.table_data;
  const buckets = mainAgg?.buckets || [];

  formatted.labels = buckets.map(bucket => String(bucket.key));
  
  // Pour les tables, on retourne les données brutes
  formatted.tableData = buckets.map(bucket => ({
    key: bucket.key,
    count: bucket.doc_count,
    ...(bucket.additional_fields || {})
  }));
}

// Helper: Obtenir une couleur par défaut
function getDefaultColor(index) {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
  ];
  return colors[index % colors.length];
}

// Construire les aggregations Elasticsearch à partir de la configuration
function buildElasticsearchAggregations(config, indexFields) {
  const aggregations = {};
  const dataConfig = config.dataConfig || {};
  const xAxisField = dataConfig.xAxis?.field;
  const yAxisField = dataConfig.yAxis?.field;
  const yAxisAggregation = dataConfig.yAxis?.aggregation || 'sum';
  const seriesConfig = dataConfig.series || [];

  // Choisir le bon champ (keyword si disponible)
  function getAggregatableField(fieldName) {
    const fieldInfo = indexFields.find(f => f.name === fieldName);
    if (!fieldInfo) return fieldName;
    
    // Utiliser .keyword si disponible pour les champs text
    if (fieldInfo.type === 'text' && fieldInfo.keywordField) {
      return fieldInfo.keywordField;
    }
    return fieldName;
  }

  // Obtenir le type de champ
  function getFieldType(fieldName) {
    const fieldInfo = indexFields.find(f => f.name === fieldName || f.keywordField === fieldName);
    return fieldInfo?.type || 'keyword';
  }

  // Cas spécial pour scatter plot : les deux axes doivent être numériques
  if (config.type === 'scatter' && xAxisField && yAxisField) {
    const xFieldInfo = indexFields.find(f => f.name === xAxisField);
    const yFieldInfo = indexFields.find(f => f.name === yAxisField);
    
    // Vérifier que les deux champs sont numériques
    const xIsNumeric = xFieldInfo && (xFieldInfo.type === 'integer' || xFieldInfo.type === 'long' || 
                                       xFieldInfo.type === 'float' || xFieldInfo.type === 'double');
    const yIsNumeric = yFieldInfo && (yFieldInfo.type === 'integer' || yFieldInfo.type === 'long' || 
                                       yFieldInfo.type === 'float' || yFieldInfo.type === 'double');
    
    if (!xIsNumeric || !yIsNumeric) {
      throw new Error('Scatter plots require both X and Y axes to be numeric fields');
    }

    // Pour scatter, on utilise une aggregation terms sur un champ de groupement (si disponible)
    // ou on récupère les documents individuels avec un script
    // Solution: utiliser une aggregation terms avec sub-aggregations pour les valeurs X et Y moyennes
    // Mais mieux: utiliser top_hits pour récupérer les documents individuels
    
    // Option 1: Utiliser terms sur un champ de groupement (comme area ou year) avec stats sur X et Y
    // Si aucun champ de groupement, on utilise un histogram ou on récupère directement les documents
    const groupField = dataConfig.groupBy?.field || 'area'; // Par défaut, grouper par area
    const groupFieldInfo = indexFields.find(f => f.name === groupField);
    
    if (groupFieldInfo) {
      const groupFieldName = getAggregatableField(groupField);
      aggregations.scatter_points = {
        terms: {
          field: groupFieldName,
          size: dataConfig.xAxis?.limit || 100
        },
        aggs: {
          x_value: {
            avg: { field: xAxisField }
          },
          y_value: {
            avg: { field: yAxisField }
          },
          // Récupérer un échantillon de documents pour plus de précision
          top_docs: {
            top_hits: {
              size: 1,
              _source: {
                includes: [xAxisField, yAxisField, groupField]
              }
            }
          }
        }
      };
    } else {
      // Si pas de champ de groupement disponible, utiliser un histogram sur X avec stats sur Y
      aggregations.scatter_points = {
        histogram: {
          field: xAxisField,
          interval: dataConfig.xAxis?.interval || 100,
          min_doc_count: 1
        },
        aggs: {
          y_value: {
            avg: { field: yAxisField }
          }
        }
      };
    }
    
    return aggregations;
  }

  // Si plusieurs séries
  if (seriesConfig.length > 0 && xAxisField) {
    seriesConfig.forEach((series, index) => {
      const filterConditions = [];

      // Appliquer les filtres de la série
      Object.entries(series.filter || {}).forEach(([field, value]) => {
        const fieldName = getAggregatableField(field);
        if (Array.isArray(value)) {
          filterConditions.push({
            terms: { [fieldName]: value }
          });
        } else {
          filterConditions.push({
            term: { [fieldName]: value }
          });
        }
      });

      // Appliquer les filtres globaux de la config
      Object.entries(config.filters || {}).forEach(([field, value]) => {
        const fieldName = getAggregatableField(field);
        if (Array.isArray(value)) {
          filterConditions.push({
            terms: { [fieldName]: value }
          });
        } else if (typeof value === 'object' && value.min !== undefined) {
          filterConditions.push({
            range: {
              [fieldName]: {
                gte: value.min,
                lte: value.max
              }
            }
          });
        } else {
          filterConditions.push({
            term: { [fieldName]: value }
          });
        }
      });

      const xField = getAggregatableField(xAxisField);
      const yField = getAggregatableField(yAxisField);

      aggregations[`series_${index}`] = {
        filter: {
          bool: {
            must: filterConditions
          }
        },
        aggs: {
          x_axis: {
            terms: {
              field: xField,
              size: dataConfig.xAxis?.limit || 100,
              order: { _count: 'desc' }
            },
            aggs: yAxisField ? {
              y_axis: {
                [yAxisAggregation]: {
                  field: yField
                }
              }
            } : {}
          }
        }
      };
    });
  } else if (xAxisField && yAxisField) {
    // Single série avec métrique
    const xField = getAggregatableField(xAxisField);
    const yField = getAggregatableField(yAxisField);

    aggregations.main = {
      terms: {
        field: xField,
        size: dataConfig.xAxis?.limit || 100,
        order: { _count: 'desc' }
      },
      aggs: {
        y_axis: {
          [yAxisAggregation]: {
            field: yField
          }
        }
      }
    };
  } else if (xAxisField) {
    // Pas de métrique, juste compter les documents
    const xField = getAggregatableField(xAxisField);
    
    aggregations.main = {
      terms: {
        field: xField,
        size: dataConfig.xAxis?.limit || 100,
        order: { _count: 'desc' }
      }
    };
  }

  // Le count total sera fait via une query séparée (voir generateChartData)
  // On ne peut pas utiliser _id dans value_count car fielddata est désactivé sur _id

  return aggregations;
}

// Construire la query Elasticsearch avec filtres
function buildElasticsearchQuery(config, indexFields) {
  const mustQueries = [];

  // Helper pour obtenir le bon champ
  function getAggregatableField(fieldName) {
    const fieldInfo = indexFields.find(f => f.name === fieldName);
    if (!fieldInfo) return fieldName;
    
    if (fieldInfo.type === 'text' && fieldInfo.keywordField) {
      return fieldInfo.keywordField;
    }
    return fieldName;
  }

  // Appliquer les filtres de la configuration
  Object.entries(config.filters || {}).forEach(([field, value]) => {
    const fieldName = getAggregatableField(field);
    
    if (Array.isArray(value)) {
      mustQueries.push({
        terms: { [fieldName]: value }
      });
    } else if (typeof value === 'object' && value.min !== undefined) {
      mustQueries.push({
        range: {
          [fieldName]: {
            gte: value.min,
            lte: value.max
          }
        }
      });
    } else if (value !== null && value !== undefined && value !== '') {
      mustQueries.push({
        term: { [fieldName]: value }
      });
    }
  });

  return mustQueries.length > 0 ? {
    bool: {
      must: mustQueries
    }
  } : { match_all: {} };
}

// ==================== CONTROLLERS ====================

// Créer une configuration de graphique
const createChartConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    const config = req.body;

    // Validation basique
    if (!config.name || !config.type || !config.indexName) {
      console.log('[Chart Create] Validation failed - missing fields:', {
        name: !!config.name,
        type: !!config.type,
        indexName: !!config.indexName
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, indexName'
      });
    }

    console.log('[Chart Create] Validating index:', config.indexName);
    
    // Vérifier que l'index existe
    let fields;
    try {
      fields = await getIndexFields(config.indexName);
      console.log('[Chart Create] Index exists, fields count:', fields.length);
    } catch (indexError) {
      console.error('[Chart Create] Index validation error:', indexError.message);
      return res.status(400).json({
        success: false,
        message: `Index '${config.indexName}' not found or not accessible: ${indexError.message}`
      });
    }
    
    // Valider la configuration des données
    const dataConfig = config.dataConfig || {};
    
    // Pour scatter, on peut avoir juste xAxis sans yAxis dans certains cas
    if (config.type !== 'scatter') {
      if (!dataConfig.xAxis?.field) {
        console.log('[Chart Create] Validation failed - missing xAxis field');
        return res.status(400).json({
          success: false,
          message: 'Missing required field: dataConfig.xAxis.field'
        });
      }
    }
    
    if (dataConfig.xAxis?.field) {
      const xField = fields.find(f => f.name === dataConfig.xAxis.field);
      if (!xField) {
        console.log('[Chart Create] Validation failed - xAxis field not found:', dataConfig.xAxis.field);
        return res.status(400).json({
          success: false,
          message: `Field '${dataConfig.xAxis.field}' not found in index '${config.indexName}'`
        });
      }
      if (!xField.canBeAxis) {
        console.log('[Chart Create] Validation failed - xAxis field cannot be axis:', dataConfig.xAxis.field);
        return res.status(400).json({
          success: false,
          message: `Field '${dataConfig.xAxis.field}' cannot be used as an axis`
        });
      }
    }

    // Valider yAxis seulement si ce n'est pas un pie/doughnut/scatter
    if (config.type !== 'pie' && config.type !== 'doughnut' && config.type !== 'scatter') {
      if (!dataConfig.yAxis?.field) {
        console.log('[Chart Create] Validation failed - missing yAxis field');
        return res.status(400).json({
          success: false,
          message: 'Missing required field: dataConfig.yAxis.field'
        });
      }
      
      const yField = fields.find(f => f.name === dataConfig.yAxis.field);
      if (!yField) {
        console.log('[Chart Create] Validation failed - yAxis field not found:', dataConfig.yAxis.field);
        return res.status(400).json({
          success: false,
          message: `Field '${dataConfig.yAxis.field}' not found in index '${config.indexName}'`
        });
      }
      if (!yField.canBeMetric) {
        console.log('[Chart Create] Validation failed - yAxis field cannot be metric:', dataConfig.yAxis.field);
        return res.status(400).json({
          success: false,
          message: `Field '${dataConfig.yAxis.field}' cannot be used as a metric`
        });
      }
    } else if (dataConfig.yAxis?.field) {
      // Pour scatter, valider si yAxis est fourni
      if (config.type === 'scatter') {
        const yField = fields.find(f => f.name === dataConfig.yAxis.field);
        if (yField && !yField.canBeMetric) {
          console.log('[Chart Create] Validation failed - yAxis field cannot be metric for scatter:', dataConfig.yAxis.field);
          return res.status(400).json({
            success: false,
            message: `Field '${dataConfig.yAxis.field}' cannot be used as a metric for scatter plots`
          });
        }
      }
    }
    
    // Valider le format des filtres année si présent
    if (config.filters?.year) {
      const yearFilter = config.filters.year;
      if (typeof yearFilter === 'object' && yearFilter.min !== undefined) {
        // C'est une plage d'années
        if (typeof yearFilter.min !== 'number' || typeof yearFilter.max !== 'number') {
          console.log('[Chart Create] Validation failed - invalid year range:', yearFilter);
          return res.status(400).json({
            success: false,
            message: 'Year filter range must have numeric min and max values'
          });
        }
        if (yearFilter.min > yearFilter.max) {
          console.log('[Chart Create] Validation failed - year min > max:', yearFilter);
          return res.status(400).json({
            success: false,
            message: 'Year filter: min must be less than or equal to max'
          });
        }
      }
    }
    
    console.log('[Chart Create] All validations passed');

    console.log('[Chart Create] Creating chart for user:', userId);
    console.log('[Chart Create] Config:', JSON.stringify(config, null, 2));
    
    const created = await ChartConfiguration.create(userId, config);

    console.log('[Chart Create] Chart created successfully with ID:', created._id);

    // Formater la réponse avec l'ID au bon format
    const formattedResponse = {
      id: created._id || created.id,
      ...created,
      _id: created._id || created.id
    };

    res.status(201).json({
      success: true,
      data: formattedResponse
    });
  } catch (error) {
    console.error('Error creating chart configuration:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer toutes les configurations de l'utilisateur
const getMyConfigurations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includePublic = 'false' } = req.query;

    console.log('[Chart List] Fetching charts for user:', userId);

    const configs = await ChartConfiguration.findByUser(
      userId,
      includePublic === 'true'
    );

    console.log('[Chart List] Found', configs.length, 'charts for user:', userId);

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error getting user configurations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer une configuration par ID
const getConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await ChartConfiguration.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Vérifier les permissions (public ou propriétaire)
    const userId = req.user?.id;
    if (!config.metadata.isPublic && config.metadata.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour une configuration
const updateConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Si la configuration change, valider les champs
    if (updates.indexName || updates.dataConfig) {
      const indexName = updates.indexName || (await ChartConfiguration.findById(id))?.indexName;
      if (indexName) {
        const fields = await getIndexFields(indexName);
        
        const dataConfig = updates.dataConfig || (await ChartConfiguration.findById(id))?.dataConfig || {};
        
        if (dataConfig.xAxis?.field) {
          const xField = fields.find(f => f.name === dataConfig.xAxis.field);
          if (!xField || !xField.canBeAxis) {
            return res.status(400).json({
              success: false,
              message: `Invalid field for X-axis: ${dataConfig.xAxis.field}`
            });
          }
        }

        if (dataConfig.yAxis?.field) {
          const yField = fields.find(f => f.name === dataConfig.yAxis.field);
          if (!yField || !yField.canBeMetric) {
            return res.status(400).json({
              success: false,
              message: `Invalid field for Y-axis: ${dataConfig.yAxis.field}`
            });
          }
        }
      }
    }

    const updated = await ChartConfiguration.update(id, userId, updates);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Supprimer une configuration
const deleteConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('[deleteConfiguration] Request to delete chart ID:', id, 'by user:', userId);

    await ChartConfiguration.delete(id, userId);

    console.log('[deleteConfiguration] Chart deleted successfully');

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('[deleteConfiguration] Error deleting configuration:', error);
    console.error('[deleteConfiguration] Error message:', error.message);
    console.error('[deleteConfiguration] Error stack:', error.stack);
    
    const statusCode = error.message.includes('Unauthorized') ? 403 : 
                      error.message.includes('not found') ? 404 : 500;
    
    console.log('[deleteConfiguration] Returning status:', statusCode);
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Rechercher des configurations publiques
const searchPublicConfigurations = async (req, res) => {
  try {
    const { q: searchTerm = '', tags = '', limit = 20 } = req.query;
    
    const tagArray = tags ? tags.split(',').filter(t => t.trim()) : [];

    const configs = await ChartConfiguration.findPublic(searchTerm, tagArray, parseInt(limit));

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error searching public configurations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Générer les données du graphique à partir d'une configuration
const generateChartData = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await ChartConfiguration.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Vérifier les permissions
    const userId = req.user?.id;
    if (!config.metadata.isPublic && config.metadata.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Obtenir les champs de l'index
    const indexFields = await getIndexFields(config.indexName);

    // Construire la query Elasticsearch avec les filtres
    const query = buildElasticsearchQuery(config, indexFields);
    
    // Log pour debug (peut être retiré en production)
    if (Object.keys(config.filters || {}).length > 0) {
      console.log(`[Chart ${id}] Applying filters:`, JSON.stringify(config.filters));
      console.log(`[Chart ${id}] Query:`, JSON.stringify(query));
    }

    // Construire les aggregations
    const aggregations = buildElasticsearchAggregations(config, indexFields);

    // Exécuter la requête avec les filtres appliqués
    const esService = new ElasticsearchService(config.indexName);
    const response = await esService.aggregate(aggregations, query);

    // Ajouter le count total via une query séparée (car on ne peut pas utiliser _id dans value_count)
    const client = getElasticsearchClient();
    try {
      const countResponse = await client.count({
        index: config.indexName,
        body: { query }
      });
      
      response.total_count = { value: countResponse.count };
    } catch (countError) {
      console.warn('Error getting total count, using estimated value:', countError.message);
      // Utiliser une estimation basée sur les buckets si disponibles
      const firstAgg = Object.values(aggregations)[0];
      if (firstAgg && firstAgg.buckets) {
        const totalFromBuckets = firstAgg.buckets.reduce((sum, bucket) => sum + bucket.doc_count, 0);
        response.total_count = { value: totalFromBuckets };
      } else {
        response.total_count = { value: 0 };
      }
    }

    // Formater les données selon le type de graphique
    const chartData = formatChartData(config, response);

    res.json({
      success: true,
      data: {
        config,
        chartData,
        rawAggregations: response,
        indexFields: indexFields.map(f => ({
          name: f.name,
          type: f.type,
          canBeAxis: f.canBeAxis,
          canBeMetric: f.canBeMetric,
          canBeFilter: f.canBeFilter,
          canBeSeries: f.canBeSeries,
          canBeTimeField: f.canBeTimeField
        }))
      }
    });
  } catch (error) {
    console.error('Error generating chart data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir les champs disponibles pour un index (pour le builder de graphique)
const getIndexFieldsForBuilder = async (req, res) => {
  try {
    const { indexName } = req.params;

    const fields = await getIndexFields(indexName);

    res.json({
      success: true,
      data: {
        indexName,
        fields: fields.map(f => ({
          name: f.name,
          type: f.type,
          keywordField: f.keywordField,
          canBeAxis: f.canBeAxis,
          canBeMetric: f.canBeMetric,
          canBeFilter: f.canBeFilter,
          canBeSeries: f.canBeSeries,
          canBeTimeField: f.canBeTimeField,
          aggregatable: f.aggregatable
        }))
      }
    });
  } catch (error) {
    console.error('Error getting index fields:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Dupliquer une configuration
const duplicateConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    const duplicated = await ChartConfiguration.duplicate(id, userId, name);

    res.json({
      success: true,
      data: duplicated,
      message: 'Configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating configuration:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createChartConfiguration,
  getMyConfigurations,
  getConfigurationById,
  updateConfiguration,
  deleteConfiguration,
  searchPublicConfigurations,
  generateChartData,
  getIndexFieldsForBuilder,
  duplicateConfiguration
};


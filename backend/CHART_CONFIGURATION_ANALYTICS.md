# Chart Configuration Analytics - Guide Complet

## Vue d'ensemble

Ce document explique comment fonctionne le système de configuration de graphiques (Chart Configuration) et d'analytics, comment les configurations sont générées, utilisées et sauvegardées.

---

## 📊 PARTIE 1: Architecture Actuelle - Endpoint Analytics

### Endpoint d'Analytics Dynamique

**Route:** `GET /api/agricultural/indices/:indexName/analytics`

**Fichier:** `routes/agriculturalDataRoutes.js` (lignes 683-829)

Cet endpoint génère des données d'analytics à partir des aggregations Elasticsearch en temps réel.

#### Paramètres de Requête

```javascript
{
  field?: string,          // Champ à analyser
  groupBy?: string,        // Champ pour grouper les données
  timeField?: string,       // Champ date pour séries temporelles
  timeRange?: string,       // Période: '1y', '1M', etc.
  limit?: number           // Nombre de résultats (défaut: 10)
}
```

#### Types d'Aggregations Elasticsearch Utilisées

1. **Stats Aggregation** (pour champs numériques)
   - Calcule: min, max, avg, sum, count
   
2. **Terms Aggregation** (pour valeurs top)
   - Récupère les valeurs les plus fréquentes
   
3. **Date Histogram Aggregation** (pour séries temporelles)
   - Agrège les données par intervalle de temps

#### Exemple d'Utilisation

```javascript
// Frontend - Récupération des données analytics
const fetchAnalytics = async (indexName, options = {}) => {
  const params = new URLSearchParams({
    field: options.field || '',           // Ex: 'value', 'year'
    groupBy: options.groupBy || '',       // Ex: 'area', 'item'
    timeField: options.timeField || '',   // Ex: 'year', 'createdAt'
    timeRange: options.timeRange || '1y', // '1y', '1M', 'all'
    limit: options.limit || 10
  });
  
  const response = await fetch(
    `/api/agricultural/indices/${indexName}/analytics?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.data;
};

// Utilisation
const analyticsData = await fetchAnalytics('producer_prices', {
  field: 'value',
  groupBy: 'area',
  timeField: 'year',
  timeRange: '1y',
  limit: 20
});

// Retourne:
// {
//   indexName: 'producer_prices',
//   totalDocuments: 15000,
//   fieldStats: {
//     min: 10.5,
//     max: 5000.0,
//     avg: 250.75,
//     sum: 3761250.0,
//     count: 15000
//   },
//   topValues: [
//     { value: 'Tunisia', count: 500 },
//     { value: 'Morocco', count: 450 },
//     ...
//   ],
//   groupBy: [
//     { value: 'Tunisia', count: 500 },
//     { value: 'Morocco', count: 450 },
//     ...
//   ],
//   timeSeries: [
//     { date: '2020-01-01', count: 100 },
//     { date: '2020-02-01', count: 120 },
//     ...
//   ],
//   availableFields: [
//     { name: 'area', type: 'text', searchable: true },
//     { name: 'value', type: 'float', searchable: false },
//     ...
//   ]
// }
```

---

## 🎨 PARTIE 2: Configuration de Graphiques

### Structure d'une Configuration de Graphique

Une configuration de graphique définit:
- Le type de graphique (bar, line, pie, etc.)
- Les champs de données à utiliser
- Les filtres à appliquer
- Les paramètres de visualisation

```javascript
// Structure proposée pour une configuration de graphique
const chartConfig = {
  id: 'chart_001',                    // ID unique
  name: 'Production par Pays',         // Nom du graphique
  type: 'bar',                         // Type: 'bar', 'line', 'pie', 'area', 'scatter'
  indexName: 'producer_prices',        // Index Elasticsearch
  
  // Configuration des axes et données
  data: {
    xAxis: {                           // Axe X
      field: 'area',                   // Champ à utiliser
      label: 'Pays',                   // Libellé à afficher
      type: 'keyword'                  // Type de champ
    },
    yAxis: {                           // Axe Y
      field: 'value',                  // Champ à utiliser
      label: 'Production (tonnes)',   // Libellé à afficher
      aggregation: 'sum'              // Agregation: 'sum', 'avg', 'count', 'max', 'min'
    },
    series: [                          // Séries multiples (optionnel)
      {
        field: 'item',
        label: 'Blé',
        filter: { item: 'Wheat' }
      },
      {
        field: 'item',
        label: 'Maïs',
        filter: { item: 'Maize' }
      }
    ]
  },
  
  // Filtres globaux
  filters: {
    year: { min: 2020, max: 2023 },
    area: ['Tunisia', 'Morocco'],
    item: ['Wheat', 'Maize']
  },
  
  // Configuration de visualisation
  visualization: {
    colors: ['#3498db', '#e74c3c', '#2ecc71'], // Couleurs personnalisées
    showLegend: true,
    showGrid: true,
    stacked: false,                     // Pour bar charts empilés
    smooth: true                        // Pour line charts
  },
  
  // Métadonnées
  metadata: {
    createdBy: 'user_id',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['production', 'agriculture'],
    isPublic: false,
    description: 'Graphique montrant la production par pays'
  }
};
```

---

## 💾 PARTIE 3: Sauvegarde des Configurations

### Architecture de Stockage Proposée

Deux options principales:

#### Option 1: Stockage dans Elasticsearch (Recommandé)

Créer un index dédié `chart_configurations` pour stocker les configurations.

**Avantages:**
- Recherche et filtrage puissants
- Cohérent avec le reste du système
- Facilite le partage et la découverte

**Structure du Mapping:**

```javascript
// config/elasticsearchMappings.js
chart_configurations: {
  mappings: {
    properties: {
      name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      type: { type: 'keyword' },
      indexName: { type: 'keyword' },
      data: { type: 'object', enabled: false }, // Stocké tel quel
      filters: { type: 'object', enabled: false },
      visualization: { type: 'object', enabled: false },
      metadata: {
        properties: {
          createdBy: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          tags: { type: 'keyword' },
          isPublic: { type: 'boolean' },
          description: { type: 'text' }
        }
      }
    }
  }
}
```

#### Option 2: Stockage dans MongoDB

Utiliser le modèle User existant ou créer un nouveau modèle.

**Avantages:**
- Relations avec les utilisateurs facilitées
- Structure relationnelle si nécessaire

---

## 🔧 PARTIE 4: Implémentation Backend

### 1. Modèle pour Chart Configurations

**Fichier:** `models/ChartConfiguration.js` (à créer)

```javascript
const { getElasticsearchClient } = require('../config/elasticsearch');
const ElasticsearchService = require('../services/ElasticsearchService');

class ChartConfiguration {
  constructor() {
    this.indexName = 'chart_configurations';
    this.service = new ElasticsearchService(this.indexName);
  }

  // Créer une nouvelle configuration
  async create(userId, config) {
    const document = {
      ...config,
      metadata: {
        ...config.metadata,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return await this.service.create(document);
  }

  // Mettre à jour une configuration
  async update(id, userId, updates) {
    const config = await this.findById(id);
    
    // Vérifier les permissions
    if (config.metadata.createdBy !== userId) {
      throw new Error('Unauthorized: You can only update your own configurations');
    }

    const updatedConfig = {
      ...config,
      ...updates,
      metadata: {
        ...config.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return await this.service.update(id, updatedConfig);
  }

  // Récupérer une configuration par ID
  async findById(id) {
    return await this.service.findById(id);
  }

  // Récupérer toutes les configurations d'un utilisateur
  async findByUser(userId, includePublic = false) {
    const query = {
      query: {
        bool: {
          should: [
            { term: { 'metadata.createdBy': userId } }
          ]
        }
      }
    };

    if (includePublic) {
      query.query.bool.should.push({
        term: { 'metadata.isPublic': true }
      });
      query.query.bool.minimum_should_match = 1;
    }

    return await this.service.find(query);
  }

  // Rechercher des configurations publiques
  async findPublic(searchTerm = '', tags = []) {
    const mustQueries = [
      { term: { 'metadata.isPublic': true } }
    ];

    if (searchTerm) {
      mustQueries.push({
        multi_match: {
          query: searchTerm,
          fields: ['name', 'metadata.description'],
          fuzziness: 'AUTO'
        }
      });
    }

    if (tags.length > 0) {
      mustQueries.push({
        terms: { 'metadata.tags': tags }
      });
    }

    return await this.service.find({
      query: {
        bool: {
          must: mustQueries
        }
      },
      sort: [{ 'metadata.createdAt': { order: 'desc' } }]
    });
  }

  // Supprimer une configuration
  async delete(id, userId) {
    const config = await this.findById(id);
    
    if (config.metadata.createdBy !== userId) {
      throw new Error('Unauthorized: You can only delete your own configurations');
    }

    return await this.service.delete(id);
  }
}

module.exports = new ChartConfiguration();
```

### 2. Contrôleur pour Chart Configurations

**Fichier:** `controllers/chartConfigurationController.js` (à créer)

```javascript
const ChartConfiguration = require('../models/ChartConfiguration');

// Créer une configuration
const createChartConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    const config = req.body;

    // Validation basique
    if (!config.name || !config.type || !config.indexName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, indexName'
      });
    }

    const created = await ChartConfiguration.create(userId, config);

    res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
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

    const configs = await ChartConfiguration.findByUser(
      userId,
      includePublic === 'true'
    );

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
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

    const updated = await ChartConfiguration.update(id, userId, updates);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
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

    await ChartConfiguration.delete(id, userId);

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// Rechercher des configurations publiques
const searchPublicConfigurations = async (req, res) => {
  try {
    const { q: searchTerm = '', tags = '' } = req.query;
    
    const tagArray = tags ? tags.split(',') : [];

    const configs = await ChartConfiguration.findPublic(searchTerm, tagArray);

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
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

    // Construire la query Elasticsearch basée sur la configuration
    const ElasticsearchService = require('../services/ElasticsearchService');
    const esService = new ElasticsearchService(config.indexName);

    // Construire la query avec filtres
    const mustQueries = [];
    
    // Appliquer les filtres de la configuration
    Object.entries(config.filters || {}).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        mustQueries.push({
          terms: { [field]: value }
        });
      } else if (typeof value === 'object' && value.min !== undefined) {
        mustQueries.push({
          range: {
            [field]: {
              gte: value.min,
              lte: value.max
            }
          }
        });
      } else {
        mustQueries.push({
          term: { [field]: value }
        });
      }
    });

    // Construire les aggregations selon la configuration
    const aggregations = {};

    // Aggregation pour l'axe X (groupement)
    if (config.data.xAxis) {
      aggregations.x_axis = {
        terms: {
          field: config.data.xAxis.field,
          size: 100
        }
      };

      // Aggregation pour l'axe Y (métrique)
      if (config.data.yAxis) {
        aggregations.x_axis.aggs = {
          y_axis: {
            [config.data.yAxis.aggregation]: {
              field: config.data.yAxis.field
            }
          }
        };
      }
    }

    // Si plusieurs séries
    if (config.data.series && config.data.series.length > 0) {
      // Créer une aggregation par série
      config.data.series.forEach((series, index) => {
        aggregations[`series_${index}`] = {
          filter: {
            bool: {
              must: Object.entries(series.filter || {}).map(([field, value]) => ({
                term: { [field]: value }
              }))
            }
          },
          aggs: {
            x_axis: {
              terms: {
                field: config.data.xAxis.field,
                size: 100
              },
              aggs: {
                y_axis: {
                  [config.data.yAxis.aggregation]: {
                    field: config.data.yAxis.field
                  }
                }
              }
            }
          }
        };
      });
    }

    // Exécuter la requête
    const response = await esService.aggregate(aggregations);

    // Formater les données selon le type de graphique
    const chartData = formatChartData(config, response);

    res.json({
      success: true,
      data: {
        config,
        chartData,
        rawAggregations: response
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Fonction helper pour formater les données selon le type de graphique
function formatChartData(config, aggregations) {
  const formatted = {
    labels: [],
    datasets: []
  };

  if (config.type === 'bar' || config.type === 'line') {
    // Récupérer les buckets de l'aggregation x_axis
    const xAxisBuckets = aggregations.x_axis?.buckets || [];

    formatted.labels = xAxisBuckets.map(bucket => bucket.key);

    // Si une seule série
    if (!config.data.series || config.data.series.length === 0) {
      formatted.datasets = [{
        label: config.data.yAxis.label,
        data: xAxisBuckets.map(bucket => 
          bucket.y_axis?.value || bucket.doc_count || 0
        )
      }];
    } else {
      // Plusieurs séries
      config.data.series.forEach((series, index) => {
        const seriesAgg = aggregations[`series_${index}`];
        const buckets = seriesAgg?.x_axis?.buckets || [];

        formatted.datasets.push({
          label: series.label,
          data: formatted.labels.map(label => {
            const bucket = buckets.find(b => b.key === label);
            return bucket?.y_axis?.value || bucket?.doc_count || 0;
          })
        });
      });
    }
  } else if (config.type === 'pie' || config.type === 'doughnut') {
    const buckets = aggregations.x_axis?.buckets || [];
    
    formatted.labels = buckets.map(bucket => bucket.key);
    formatted.datasets = [{
      data: buckets.map(bucket => 
        bucket.y_axis?.value || bucket.doc_count || 0
      )
    }];
  }

  return formatted;
}

module.exports = {
  createChartConfiguration,
  getMyConfigurations,
  getConfigurationById,
  updateConfiguration,
  deleteConfiguration,
  searchPublicConfigurations,
  generateChartData
};
```

### 3. Routes pour Chart Configurations

**Fichier:** `routes/chartConfigurationRoutes.js` (à créer)

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createChartConfiguration,
  getMyConfigurations,
  getConfigurationById,
  updateConfiguration,
  deleteConfiguration,
  searchPublicConfigurations,
  generateChartData
} = require('../controllers/chartConfigurationController');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes CRUD
router.route('/')
  .post(createChartConfiguration)      // POST /api/charts
  .get(getMyConfigurations);            // GET /api/charts

router.route('/public')
  .get(searchPublicConfigurations);     // GET /api/charts/public?q=search&tags=tag1,tag2

router.route('/:id')
  .get(getConfigurationById)            // GET /api/charts/:id
  .put(updateConfiguration)             // PUT /api/charts/:id
  .delete(deleteConfiguration);         // DELETE /api/charts/:id

router.route('/:id/data')
  .get(generateChartData);              // GET /api/charts/:id/data

module.exports = router;
```

### 4. Mise à jour du serveur principal

**Fichier:** `server.js` (ajout)

```javascript
// Ajouter dans les routes
app.use('/api/charts', require('./routes/chartConfigurationRoutes'));
```

### 5. Ajout du mapping Elasticsearch

**Fichier:** `config/elasticsearchMappings.js` (ajout)

```javascript
// Ajouter dans indexMappings
chart_configurations: {
  mappings: {
    properties: {
      name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      type: { type: 'keyword' },
      indexName: { type: 'keyword' },
      data: { type: 'object', enabled: false },
      filters: { type: 'object', enabled: false },
      visualization: { type: 'object', enabled: false },
      metadata: {
        properties: {
          createdBy: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          tags: { type: 'keyword' },
          isPublic: { type: 'boolean' },
          description: { type: 'text' }
        }
      }
    }
  }
}

// Dans createAllIndices(), ajouter:
await createIndex('chart_configurations', indexMappings.chart_configurations);
```

---

## 🎯 PARTIE 5: Utilisation Frontend

### 1. Créer une Configuration de Graphique

```javascript
const createChart = async (chartConfig) => {
  const response = await fetch('/api/charts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(chartConfig)
  });

  const data = await response.json();
  return data.data;
};

// Exemple d'utilisation
const newChart = await createChart({
  name: 'Production par Pays - Blé',
  type: 'bar',
  indexName: 'producer_prices',
  data: {
    xAxis: { field: 'area', label: 'Pays' },
    yAxis: { field: 'value', label: 'Production (tonnes)', aggregation: 'sum' }
  },
  filters: {
    item: 'Wheat',
    year: { min: 2020, max: 2023 }
  },
  visualization: {
    colors: ['#3498db'],
    showLegend: true,
    showGrid: true
  },
  metadata: {
    tags: ['production', 'wheat'],
    isPublic: false,
    description: 'Production de blé par pays'
  }
});
```

### 2. Récupérer les Configurations

```javascript
// Mes configurations
const myCharts = await fetch('/api/charts', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Configuration spécifique
const chart = await fetch(`/api/charts/${chartId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Configurations publiques
const publicCharts = await fetch('/api/charts/public?tags=agriculture')
  .then(r => r.json());
```

### 3. Générer les Données du Graphique

```javascript
const getChartData = async (chartId) => {
  const response = await fetch(`/api/charts/${chartId}/data`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  // data.data.chartData contient les données formatées:
  // {
  //   labels: ['Tunisia', 'Morocco', ...],
  //   datasets: [
  //     { label: 'Production (tonnes)', data: [1000, 800, ...] }
  //   ]
  // }
  
  return data.data;
};

// Utilisation avec Chart.js par exemple
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const chartData = await getChartData(chartId);

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: chartData.config.type, // 'bar', 'line', etc.
  data: chartData.chartData,
  options: {
    ...chartData.config.visualization,
    responsive: true
  }
});
```

### 4. Mettre à Jour une Configuration

```javascript
const updateChart = async (chartId, updates) => {
  const response = await fetch(`/api/charts/${chartId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  return await response.json();
};

// Exemple: Ajouter un filtre
await updateChart(chartId, {
  filters: {
    ...existingFilters,
    year: { min: 2021, max: 2023 }
  }
});
```

---

## 📋 PARTIE 6: Types de Graphiques Supportés

### Types de Graphiques et Aggregations Correspondantes

1. **Bar Chart** (Graphique en barres)
   - Utilise: `terms` aggregation pour X, `sum/avg/count` pour Y
   - Support: Multi-séries (plusieurs barres par catégorie)
   - Option: `stacked: true` pour barres empilées

2. **Line Chart** (Graphique en courbes)
   - Utilise: `date_histogram` ou `terms` pour X, `sum/avg` pour Y
   - Support: Multi-lignes
   - Option: `smooth: true` pour courbes lissées

3. **Pie/Doughnut Chart** (Camembert)
   - Utilise: `terms` aggregation
   - Chaque bucket = une tranche

4. **Area Chart** (Graphique en aires)
   - Similaire au line chart avec remplissage

5. **Scatter Chart** (Nuage de points)
   - Utilise deux champs numériques pour X et Y
   - Chaque document = un point

---

## 🔄 PARTIE 7: Flux Complet

```
┌─────────────┐
│  FRONTEND   │
│             │
│ 1. User     │
│    crée     │
│    config   │
└──────┬──────┘
       │
       │ POST /api/charts
       │ { name, type, indexName, data, filters, ... }
       │
       ▼
┌─────────────┐
│   BACKEND   │
│             │
│ 2. Sauvegarde│
│    dans ES  │
│    index:   │
│    chart_   │
│    configs  │
└─────────────┘

       │
       │ GET /api/charts/:id/data
       │
       ▼
┌─────────────┐
│   BACKEND   │
│             │
│ 3. Lit la   │
│    config   │
│    depuis ES│
└──────┬──────┘
       │
       │ Construit query Elasticsearch
       │ avec filters et aggregations
       │
       ▼
┌─────────────┐
│ELASTICSEARCH│
│             │
│ 4. Exécute  │
│    query    │
│    avec     │
│    aggs     │
└──────┬──────┘
       │
       │ Retourne aggregations
       │
       ▼
┌─────────────┐
│   BACKEND   │
│             │
│ 5. Formate  │
│    données  │
│    selon    │
│    type     │
│    graphique│
└──────┬──────┘
       │
       │ GET /api/charts/:id/data
       │ Retourne { config, chartData }
       │
       ▼
┌─────────────┐
│  FRONTEND   │
│             │
│ 6. Affiche  │
│    graphique│
│    avec     │
│    Chart.js │
│    etc.     │
└─────────────┘
```

---

## ✨ Résumé

1. **Endpoint Analytics Actuel:**
   - `GET /api/agricultural/indices/:indexName/analytics`
   - Génère des données via aggregations Elasticsearch
   - Paramètres dynamiques (field, groupBy, timeField, etc.)

2. **Système de Configuration Proposé:**
   - Stockage dans Elasticsearch (index `chart_configurations`)
   - CRUD complet pour les configurations
   - Génération automatique des données depuis une config
   - Partage public/privé

3. **Avantages:**
   - Sauvegarde des configurations réutilisables
   - Partage entre utilisateurs (configurations publiques)
   - Génération automatique des données
   - Recherche et découverte des configurations

4. **Prochaines Étapes:**
   - Implémenter le modèle ChartConfiguration
   - Créer le contrôleur et les routes
   - Ajouter le mapping Elasticsearch
   - Intégrer avec le frontend


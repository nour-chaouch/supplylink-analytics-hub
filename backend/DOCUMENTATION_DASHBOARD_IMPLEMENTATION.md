# Documentation Complète : Création de Dashboards et Récupération des Données

## 📋 Vue d'ensemble

Ce document explique comment le système permet de créer des dashboards (configurations de graphiques) et de récupérer dynamiquement les données depuis Elasticsearch pour les afficher.

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│                                                              │
│  /charts           → Liste des graphiques                   │
│  /charts/create    → Création d'un graphique                │
│  /charts/:id       → Visualisation d'un graphique           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ API REST
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                   │
│                                                              │
│  routes/chartConfigurationRoutes.js                         │
│         │                                                    │
│         ├─→ POST /api/charts          (Création)            │
│         ├─→ GET /api/charts           (Liste)               │
│         ├─→ GET /api/charts/:id       (Détails)             │
│         └─→ GET /api/charts/:id/data  (Génération données)  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    CONTROLLER LAYER                         │
│                                                              │
│  controllers/chartConfigurationController.js                │
│         │                                                    │
│         ├─→ Validation des champs                           │
│         ├─→ Construction des aggregations                   │
│         ├─→ Formatage des données                           │
│         └─→ Gestion des erreurs                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                      MODEL LAYER                             │
│                                                              │
│  models/ChartConfiguration.js                                │
│         │                                                    │
│         ├─→ CRUD operations                                  │
│         ├─→ Lazy initialization                             │
│         └─→ Permissions management                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   SERVICE LAYER                             │
│                                                              │
│  services/ElasticsearchService.js                            │
│         │                                                    │
│         ├─→ Client Elasticsearch                             │
│         ├─→ Aggregations                                     │
│         └─→ Queries                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                 ELASTICSEARCH                                │
│                                                              │
│  Index: chart_configurations  (Configurations)              │
│  Index: producer_prices       (Données)                     │
│  Index: crops_livestock      (Données)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 PARTIE 1: CRÉATION D'UN DASHBOARD

### Étape 1: Interface Frontend (Formulaire de création)

**Fichier:** `frontend/src/pages/ChartCreate.tsx`

```typescript
// 1. L'utilisateur remplit le formulaire
const [formData, setFormData] = useState({
  name: 'Production par Pays',
  type: 'bar',
  indexName: 'producer_prices',
  dataConfig: {
    xAxis: { field: 'area', label: 'Pays' },
    yAxis: { field: 'value', label: 'Production', aggregation: 'sum' }
  },
  filters: {
    year: { min: 2020, max: 2023 }
  },
  visualization: {
    showLegend: true,
    showGrid: true
  }
});

// 2. Soumission du formulaire
const handleSubmit = async (e) => {
  const response = await chartsAPI.createChart(formData);
  // Redirection vers la page de visualisation
  navigate(`/charts/${response.data.id}`);
};
```

### Étape 2: Route Backend

**Fichier:** `routes/chartConfigurationRoutes.js`

```javascript
router.route('/')
  .post(createChartConfiguration);  // POST /api/charts
```

### Étape 3: Contrôleur - Validation et Traitement

**Fichier:** `controllers/chartConfigurationController.js` - Fonction `createChartConfiguration`

#### A. Validation des champs

```javascript
const createChartConfiguration = async (req, res) => {
  const userId = req.user.id;
  const config = req.body;

  // 1. Vérification des champs obligatoires
  if (!config.name || !config.type || !config.indexName) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, type, indexName'
    });
  }

  // 2. Récupération des champs disponibles de l'index
  const fields = await getIndexFields(config.indexName);
  // Retourne tous les champs avec leurs capacités :
  // { name, type, canBeAxis, canBeMetric, canBeFilter, etc. }

  // 3. Validation du champ X-Axis
  if (dataConfig.xAxis?.field) {
    const xField = fields.find(f => f.name === dataConfig.xAxis.field);
    if (!xField || !xField.canBeAxis) {
      return res.status(400).json({
        success: false,
        message: `Field '${xField}' cannot be used as an axis`
      });
    }
  }

  // 4. Validation du champ Y-Axis (métrique)
  if (dataConfig.yAxis?.field) {
    const yField = fields.find(f => f.name === dataConfig.yAxis.field);
    if (!yField || !yField.canBeMetric) {
      return res.status(400).json({
        success: false,
        message: `Field '${yField}' cannot be used as a metric`
      });
    }
  }

  // 5. Création de la configuration
  const created = await ChartConfiguration.create(userId, config);
  // ...
};
```

#### B. Fonction `getIndexFields()` - Récupération dynamique des champs

```javascript
async function getIndexFields(indexName) {
  // 1. Vérifier que le client Elasticsearch est disponible
  const client = getElasticsearchClient();
  if (!client) {
    throw new Error('Elasticsearch client not initialized');
  }

  // 2. Vérifier que l'index existe
  const exists = await client.indices.exists({ index: indexName });
  if (!exists) {
    throw new Error(`Index '${indexName}' not found`);
  }

  // 3. Récupérer le mapping de l'index
  const mapping = await client.indices.getMapping({ index: indexName });
  const properties = mapping[indexName]?.mappings?.properties || {};

  // 4. Analyser chaque champ et déterminer ses capacités
  const fields = Object.keys(properties).map(fieldName => {
    const field = properties[fieldName];
    const fieldType = field.type;
    
    // Détecter les sous-champs (ex: text avec keyword)
    let keywordField = null;
    if (field.fields && field.fields.keyword) {
      keywordField = `${fieldName}.keyword`;
    }

    return {
      name: fieldName,
      type: fieldType,
      keywordField: keywordField,
      
      // Déterminer les usages possibles selon le type
      canBeAxis: fieldType === 'keyword' || fieldType === 'text' || 
                 fieldType === 'date' || fieldType === 'integer',
      canBeMetric: fieldType === 'integer' || fieldType === 'long' || 
                   fieldType === 'float' || fieldType === 'double',
      canBeFilter: true,
      canBeSeries: fieldType === 'keyword' || fieldType === 'text',
      canBeTimeField: fieldType === 'date',
      aggregatable: fieldType !== 'text' || keywordField !== null
    };
  });

  return fields;
}
```

### Étape 4: Modèle - Sauvegarde dans Elasticsearch

**Fichier:** `models/ChartConfiguration.js` - Méthode `create()`

```javascript
async create(userId, config) {
  // 1. Validation
  if (!config.name || !config.type || !config.indexName) {
    throw new Error('Missing required fields');
  }

  // 2. Obtenir le service Elasticsearch (lazy initialization)
  const service = this.getService();  // Crée le service si nécessaire

  // 3. Construire le document à sauvegarder
  const document = {
    name: config.name,
    type: config.type,              // 'bar', 'line', 'pie', etc.
    indexName: config.indexName,    // 'producer_prices', etc.
    description: config.description || '',
    
    // Configuration des axes et séries
    dataConfig: config.dataConfig || {
      xAxis: { field: 'area', label: 'Pays' },
      yAxis: { field: 'value', aggregation: 'sum' },
      series: []  // Pour multi-séries
    },
    
    // Filtres à appliquer
    filters: config.filters || {
      year: { min: 2020, max: 2023 }
    },
    
    // Options de visualisation
    visualization: config.visualization || {
      showLegend: true,
      showGrid: true,
      stacked: false,
      smooth: false
    },
    
    // Métadonnées
    metadata: {
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: config.tags || [],
      isPublic: config.isPublic || false
    },
    
    version: '1.0'
  };

  // 4. Sauvegarder dans Elasticsearch (index: chart_configurations)
  const result = await service.create(document);
  // Retourne: { _id: '...', name: '...', type: '...', ... }
  
  return result;
}
```

#### Lazy Initialization - Pourquoi c'est important

```javascript
getService() {
  // 1. Vérifier que le client Elasticsearch est disponible
  const client = getElasticsearchClient();
  if (!client) {
    throw new Error('Elasticsearch client not initialized');
  }

  // 2. Créer le service seulement si nécessaire
  if (!this._service || !this._service.client) {
    this._service = new ElasticsearchService(this.indexName);
    // Le service récupère automatiquement le client
  }

  return this._service;
}
```

**Pourquoi ?** Le modèle est chargé au démarrage, mais Elasticsearch n'est initialisé qu'après. Avec lazy initialization, on crée le service uniquement quand on en a besoin, quand le client est déjà disponible.

### Étape 5: Service ElasticsearchService - Insertion

**Fichier:** `services/ElasticsearchService.js` - Méthode `create()`

```javascript
async create(document) {
  // 1. Vérifier que le client est disponible
  if (!this.client) {
    throw new Error('Elasticsearch client not initialized');
  }

  // 2. Insérer le document dans Elasticsearch
  const response = await this.client.index({
    index: this.indexName,  // 'chart_configurations'
    body: {
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    // Elasticsearch génère automatiquement un _id si non fourni
  });

  // 3. Retourner le document avec son ID
  return {
    _id: response._id,  // ID généré par Elasticsearch
    ...document,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

---

## 📊 PARTIE 2: RÉCUPÉRATION DES DONNÉES POUR AFFICHAGE

### Étape 1: Frontend - Demander les données du graphique

**Fichier:** `frontend/src/pages/ChartView.tsx`

```typescript
// Quand on affiche un graphique
useEffect(() => {
  if (id) {
    fetchChartData();
  }
}, [id]);

const fetchChartData = async () => {
  // Appel API
  const response = await chartsAPI.getChartData(id);
  
  // Réponse contient :
  // {
  //   success: true,
  //   data: {
  //     config: { ... configuration complète ... },
  //     chartData: {
  //       labels: ['Tunisia', 'Morocco', ...],
  //       datasets: [
  //         { label: 'Production', data: [1000, 800, ...] }
  //       ]
  //     }
  //   }
  // }
  
  setChartData(response.data.data.chartData);
  setChartConfig(response.data.data.config);
};
```

### Étape 2: Route Backend

**Fichier:** `routes/chartConfigurationRoutes.js`

```javascript
router.route('/:id/data')
  .get(generateChartData);  // GET /api/charts/:id/data
```

### Étape 3: Contrôleur - Génération des données

**Fichier:** `controllers/chartConfigurationController.js` - Fonction `generateChartData()`

```javascript
const generateChartData = async (req, res) => {
  const { id } = req.params;
  
  // 1. Récupérer la configuration sauvegardée
  const config = await ChartConfiguration.findById(id);
  
  // 2. Vérifier les permissions (public ou propriétaire)
  const userId = req.user?.id;
  if (!config.metadata.isPublic && config.metadata.createdBy !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // 3. Obtenir les champs disponibles de l'index
  const indexFields = await getIndexFields(config.indexName);

  // 4. Construire la query Elasticsearch avec les filtres
  const query = buildElasticsearchQuery(config, indexFields);
  // Retourne: { bool: { must: [ ... filtres ... ] } }

  // 5. Construire les aggregations Elasticsearch
  const aggregations = buildElasticsearchAggregations(config, indexFields);
  // Retourne: { main: { terms: { ... }, aggs: { y_axis: { sum: { ... } } } } }

  // 6. Exécuter la requête avec aggregations
  const esService = new ElasticsearchService(config.indexName);
  const response = await esService.aggregate(aggregations);

  // 7. Obtenir le count total (séparément, car on ne peut pas utiliser _id dans aggregations)
  const client = getElasticsearchClient();
  const countResponse = await client.count({
    index: config.indexName,
    body: { query }
  });
  response.total_count = { value: countResponse.count };

  // 8. Formater les données selon le type de graphique
  const chartData = formatChartData(config, response);

  // 9. Retourner les données formatées
  res.json({
    success: true,
    data: {
      config,
      chartData,
      rawAggregations: response
    }
  });
};
```

### Étape 4: Construction de la Query Elasticsearch

**Fichier:** `controllers/chartConfigurationController.js` - Fonction `buildElasticsearchQuery()`

```javascript
function buildElasticsearchQuery(config, indexFields) {
  const mustQueries = [];

  // Helper: Trouver le bon champ (utiliser .keyword si disponible)
  function getAggregatableField(fieldName) {
    const fieldInfo = indexFields.find(f => f.name === fieldName);
    if (!fieldInfo) return fieldName;
    
    // Pour les champs text, utiliser le sous-champ keyword pour les aggregations
    if (fieldInfo.type === 'text' && fieldInfo.keywordField) {
      return fieldInfo.keywordField;  // Ex: 'area.keyword'
    }
    return fieldName;
  }

  // Appliquer les filtres de la configuration
  Object.entries(config.filters || {}).forEach(([field, value]) => {
    const fieldName = getAggregatableField(field);
    
    if (Array.isArray(value)) {
      // Filtre par liste de valeurs: { area: ['Tunisia', 'Morocco'] }
      mustQueries.push({
        terms: { [fieldName]: value }
      });
    } else if (typeof value === 'object' && value.min !== undefined) {
      // Filtre par range: { year: { min: 2020, max: 2023 } }
      mustQueries.push({
        range: {
          [fieldName]: {
            gte: value.min,
            lte: value.max
          }
        }
      });
    } else if (value !== null && value !== undefined && value !== '') {
      // Filtre exact: { item: 'Wheat' }
      mustQueries.push({
        term: { [fieldName]: value }
      });
    }
  });

  // Si aucun filtre, retourner match_all
  return mustQueries.length > 0 
    ? { bool: { must: mustQueries } }
    : { match_all: {} };
}
```

### Étape 5: Construction des Aggregations Elasticsearch

**Fichier:** `controllers/chartConfigurationController.js` - Fonction `buildElasticsearchAggregations()`

```javascript
function buildElasticsearchAggregations(config, indexFields) {
  const aggregations = {};
  const dataConfig = config.dataConfig || {};
  const xAxisField = dataConfig.xAxis?.field;      // Ex: 'area'
  const yAxisField = dataConfig.yAxis?.field;      // Ex: 'value'
  const yAxisAggregation = dataConfig.yAxis?.aggregation || 'sum';  // 'sum', 'avg', etc.

  // Helper: Obtenir le bon champ pour aggregation
  function getAggregatableField(fieldName) {
    const fieldInfo = indexFields.find(f => f.name === fieldName);
    if (!fieldInfo) return fieldName;
    
    // Utiliser .keyword pour les champs text (requis pour aggregations)
    if (fieldInfo.type === 'text' && fieldInfo.keywordField) {
      return fieldInfo.keywordField;
    }
    return fieldName;
  }

  // CAS 1: Graphique avec plusieurs séries (ex: Blé vs Maïs)
  if (dataConfig.series && dataConfig.series.length > 0 && xAxisField) {
    dataConfig.series.forEach((series, index) => {
      const xField = getAggregatableField(xAxisField);  // 'area.keyword'
      const yField = getAggregatableField(yAxisField);   // 'value'

      // Créer une aggregation pour chaque série
      aggregations[`series_${index}`] = {
        filter: {
          bool: {
            must: [
              // Filtres de la série (ex: { item: 'Wheat' })
              ...Object.entries(series.filter || {}).map(([field, value]) => ({
                term: { [getAggregatableField(field)]: value }
              })),
              // Filtres globaux de la config
              ...Object.entries(config.filters || {}).map(([field, value]) => {
                const fieldName = getAggregatableField(field);
                if (Array.isArray(value)) {
                  return { terms: { [fieldName]: value } };
                } else if (typeof value === 'object' && value.min !== undefined) {
                  return {
                    range: { [fieldName]: { gte: value.min, lte: value.max } }
                  };
                } else {
                  return { term: { [fieldName]: value } };
                }
              })
            ]
          }
        },
        aggs: {
          x_axis: {
            // Grouper par axe X (ex: par pays)
            terms: {
              field: xField,
              size: dataConfig.xAxis?.limit || 100,
              order: { _count: 'desc' }
            },
            aggs: {
              y_axis: {
                // Agréger la métrique Y (ex: somme de la production)
                [yAxisAggregation]: {
                  field: yField
                }
              }
            }
          }
        }
      };
    });
  }
  
  // CAS 2: Graphique simple (une seule série)
  else if (xAxisField && yAxisField) {
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
          [yAxisAggregation]: {  // sum, avg, min, max, count
            field: yField
          }
        }
      }
    };
  }
  
  // CAS 3: Graphique sans métrique (juste compter les documents)
  else if (xAxisField) {
    const xField = getAggregatableField(xAxisField);
    
    aggregations.main = {
      terms: {
        field: xField,
        size: dataConfig.xAxis?.limit || 100,
        order: { _count: 'desc' }
      }
    };
  }

  return aggregations;
}
```

**Exemple d'aggregation générée pour un graphique en barres :**

```javascript
{
  main: {
    terms: {
      field: 'area.keyword',  // Grouper par pays
      size: 100,
      order: { _count: 'desc' }
    },
    aggs: {
      y_axis: {
        sum: {
          field: 'value'  // Somme de la production
        }
      }
    }
  }
}
```

### Étape 6: Exécution dans Elasticsearch

**Fichier:** `services/ElasticsearchService.js` - Méthode `aggregate()`

```javascript
async aggregate(aggregations) {
  // 1. Vérifier que le client est disponible
  if (!this.client) {
    throw new Error('Elasticsearch client not initialized');
  }

  // 2. Exécuter la requête avec aggregations
  const response = await this.client.search({
    index: this.indexName,  // Ex: 'producer_prices'
    body: {
      query: { match_all: {} },  // Ou la query avec filtres
      aggs: aggregations,         // Les aggregations construites
      size: 0                     // Ne pas retourner les documents, juste les aggs
    }
  });

  // 3. Retourner uniquement les aggregations
  return response.aggregations;
}
```

**Réponse Elasticsearch typique :**

```javascript
{
  main: {
    buckets: [
      {
        key: 'Tunisia',
        doc_count: 500,
        y_axis: { value: 125000.5 }  // Somme de la production
      },
      {
        key: 'Morocco',
        doc_count: 450,
        y_axis: { value: 98000.3 }
      },
      // ...
    ]
  }
}
```

### Étape 7: Formatage des Données pour Chart.js

**Fichier:** `controllers/chartConfigurationController.js` - Fonction `formatChartData()`

```javascript
function formatChartData(config, aggregations) {
  const formatted = {
    labels: [],
    datasets: [],
    metadata: {
      totalDocuments: aggregations.total_count?.value || 0,
      chartType: config.type
    }
  };

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
    
    // ...
  }

  return formatted;
}

// Exemple pour bar/line/area
function formatBarLineAreaChart(config, aggregations, formatted) {
  const mainAgg = aggregations.main || aggregations.x_axis;
  const buckets = mainAgg?.buckets || [];

  // Extraire les labels (axe X)
  formatted.labels = buckets.map(bucket => String(bucket.key));
  // Résultat: ['Tunisia', 'Morocco', 'Algeria']

  // Extraire les données (axe Y)
  if (buckets.length > 0) {
    const firstBucket = buckets[0];
    let data;

    if (firstBucket.y_axis) {
      // Si on a une métrique Y
      data = buckets.map(bucket => 
        bucket.y_axis.value || bucket.y_axis.values?.[0] || bucket.doc_count || 0
      );
    } else {
      // Sinon, utiliser le count de documents
      data = buckets.map(bucket => bucket.doc_count || 0);
    }

    formatted.datasets = [{
      label: config.dataConfig.yAxis?.label || config.dataConfig.yAxis?.field || 'Value',
      data: data,  // [125000.5, 98000.3, ...]
      backgroundColor: '#3498db',
      borderColor: '#3498db'
    }];
  }
}
```

**Résultat formaté pour Chart.js :**

```javascript
{
  labels: ['Tunisia', 'Morocco', 'Algeria'],
  datasets: [
    {
      label: 'Production (tonnes)',
      data: [125000.5, 98000.3, 75000.2],
      backgroundColor: '#3498db',
      borderColor: '#3498db'
    }
  ],
  metadata: {
    totalDocuments: 5000,
    chartType: 'bar'
  }
}
```

### Étape 8: Affichage Frontend avec Recharts

**Fichier:** `frontend/src/pages/ChartView.tsx`

```typescript
// 1. Recevoir les données formatées
const chartData = response.data.data.chartData;
// {
//   labels: ['Tunisia', 'Morocco', ...],
//   datasets: [{ label: 'Production', data: [1000, 800, ...] }]
// }

// 2. Transformer pour Recharts
const rechartsData = chartData.labels.map((label, idx) => ({
  name: label,
  ...chartData.datasets.reduce((acc, dataset) => {
    acc[dataset.label] = dataset.data[idx];
    return acc;
  }, {})
}));
// Résultat: [
//   { name: 'Tunisia', 'Production (tonnes)': 125000.5 },
//   { name: 'Morocco', 'Production (tonnes)': 98000.3 },
//   ...
// ]

// 3. Rendre le graphique
<BarChart data={rechartsData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="Production (tonnes)" fill="#3498db" />
</BarChart>
```

---

## 🔄 FLUX COMPLET : EXEMPLE CONCRET

### Scénario : Créer un graphique "Production de Blé par Pays en 2023"

#### 1. Frontend - L'utilisateur remplit le formulaire

```javascript
// Données envoyées au backend
POST /api/charts
{
  name: "Production Blé par Pays 2023",
  type: "bar",
  indexName: "producer_prices",
  dataConfig: {
    xAxis: { field: "area", label: "Pays" },
    yAxis: { field: "value", label: "Production", aggregation: "sum" }
  },
  filters: {
    item: "Wheat",
    year: 2023
  }
}
```

#### 2. Backend - Validation

```javascript
// ✅ Index existe: producer_prices
// ✅ Champ 'area' peut être utilisé comme axe (type: text avec keyword)
// ✅ Champ 'value' peut être utilisé comme métrique (type: float)
// ✅ Filtres valides
```

#### 3. Backend - Construction de la Query

```javascript
// Query générée:
{
  bool: {
    must: [
      { term: { "item.keyword": "Wheat" } },
      { term: { "year": 2023 } }
    ]
  }
}
```

#### 4. Backend - Construction des Aggregations

```javascript
// Aggregations générées:
{
  main: {
    terms: {
      field: "area.keyword",  // Grouper par pays
      size: 100,
      order: { _count: "desc" }
    },
    aggs: {
      y_axis: {
        sum: {
          field: "value"  // Somme de la production
        }
      }
    }
  }
}
```

#### 5. Elasticsearch - Exécution

```javascript
// Requête envoyée à Elasticsearch:
POST /producer_prices/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "item.keyword": "Wheat" } },
        { "term": { "year": 2023 } }
      ]
    }
  },
  "aggs": {
    "main": {
      "terms": { "field": "area.keyword", "size": 100 },
      "aggs": {
        "y_axis": { "sum": { "field": "value" } }
      }
    }
  },
  "size": 0
}
```

#### 6. Elasticsearch - Réponse

```javascript
{
  "aggregations": {
    "main": {
      "buckets": [
        {
          "key": "Tunisia",
          "doc_count": 150,
          "y_axis": { "value": 125000.5 }
        },
        {
          "key": "Morocco",
          "doc_count": 120,
          "y_axis": { "value": 98000.3 }
        },
        {
          "key": "Algeria",
          "doc_count": 110,
          "y_axis": { "value": 75000.2 }
        }
      ]
    }
  }
}
```

#### 7. Backend - Formatage

```javascript
// Données formatées:
{
  labels: ["Tunisia", "Morocco", "Algeria"],
  datasets: [
    {
      label: "Production (tonnes)",
      data: [125000.5, 98000.3, 75000.2],
      backgroundColor: "#3498db"
    }
  ]
}
```

#### 8. Frontend - Affichage

Le graphique s'affiche avec Chart.js/Recharts utilisant les données formatées.

---

## 🔍 POINTS CLÉS DE L'IMPLÉMENTATION

### 1. Détection automatique des champs utilisables

- Le système analyse le mapping Elasticsearch de l'index
- Détermine automatiquement quels champs peuvent être axes, métriques, filtres, etc.
- Utilise automatiquement le sous-champ `.keyword` pour les champs `text`

### 2. Gestion des types de champs

```javascript
// Text field → utilise .keyword pour aggregations
area (text) → area.keyword (pour aggregations)

// Keyword field → utilisable directement
item (keyword) → item (direct)

// Numeric fields → utilisables comme métriques
value (float) → utilisable directement pour sum, avg, etc.
```

### 3. Filtres dynamiques

- **Liste de valeurs** : `{ area: ['Tunisia', 'Morocco'] }` → `terms` query
- **Range** : `{ year: { min: 2020, max: 2023 } }` → `range` query
- **Valeur exacte** : `{ item: 'Wheat' }` → `term` query

### 4. Multi-séries

Pour créer plusieurs séries (ex: Blé vs Maïs), le système :
- Crée une aggregation séparée pour chaque série
- Applique les filtres spécifiques à chaque série
- Combine les résultats pour afficher plusieurs barres/courbes

### 5. Lazy Initialization

Le modèle ChartConfiguration ne crée le service ElasticsearchService que quand nécessaire, après que Elasticsearch soit initialisé.

---

## 📦 STRUCTURE DES DONNÉES

### Configuration sauvegardée dans Elasticsearch

```json
{
  "_id": "yu6sL5oBGTd247Kk3z-I",
  "name": "Production Blé par Pays 2023",
  "type": "bar",
  "indexName": "producer_prices",
  "description": "Graphique montrant la production de blé par pays",
  "dataConfig": {
    "xAxis": {
      "field": "area",
      "label": "Pays",
      "limit": 50
    },
    "yAxis": {
      "field": "value",
      "label": "Production (tonnes)",
      "aggregation": "sum"
    },
    "series": []
  },
  "filters": {
    "item": "Wheat",
    "year": 2023
  },
  "visualization": {
    "showLegend": true,
    "showGrid": true,
    "stacked": false,
    "smooth": false
  },
  "metadata": {
    "createdBy": "user123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "tags": ["production", "wheat"],
    "isPublic": false
  },
  "version": "1.0"
}
```

### Données formatées pour le graphique

```json
{
  "labels": ["Tunisia", "Morocco", "Algeria"],
  "datasets": [
    {
      "label": "Production (tonnes)",
      "data": [125000.5, 98000.3, 75000.2],
      "backgroundColor": "#3498db",
      "borderColor": "#3498db"
    }
  ],
  "metadata": {
    "totalDocuments": 5000,
    "chartType": "bar"
  }
}
```

---

## 🎯 RÉCAPITULATIF

1. **Création** : Frontend → Backend → Validation → Sauvegarde dans Elasticsearch
2. **Récupération** : Frontend demande → Backend lit config → Construit query/aggs → Elasticsearch → Formatage → Frontend
3. **Dynamisme** : Les champs sont détectés automatiquement, les aggregations sont construites dynamiquement selon la configuration
4. **Flexibilité** : Support de plusieurs types de graphiques, multi-séries, filtres complexes

Le système est entièrement **dynamique** : pas besoin de coder les requêtes en dur, tout est généré à partir de la configuration choisie par l'utilisateur !


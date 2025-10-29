# Flux d'Upload de Fichiers et Récupération des Données

## Vue d'ensemble

Ce document explique comment les fichiers sont uploadés du frontend vers le backend, traités et stockés dans Elasticsearch, puis récupérés pour l'affichage dans le frontend.

---

## 📤 PARTIE 1: Upload Frontend → Backend

### Configuration Multer (Middleware de gestion de fichiers)

**Fichier:** `routes/elasticsearchAdminRoutes.js` (lignes 406-428)

Le système utilise **Multer** pour gérer les uploads de fichiers :

```javascript
const upload = multer({ 
  storage: multer.memoryStorage(),  // Stocke le fichier en mémoire (buffer)
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 // Par défaut 20GB
  },
  fileFilter: (req, file, cb) => {
    // Types de fichiers acceptés:
    // - application/json (JSON)
    // - text/csv (CSV)
    // - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (.xlsx)
    // - application/vnd.ms-excel (.xls)
  }
});
```

**Points importants:**
- `memoryStorage()` : Le fichier est chargé directement en mémoire comme un buffer
- Taille max configurable via `MAX_FILE_SIZE_MB` (défaut: 20GB)
- Filtrage des types MIME pour garantir la sécurité

### Endpoints d'Upload Disponibles

Le système offre plusieurs endpoints pour différents cas d'usage :

#### 1. **Upload standard** (petits/moyens fichiers)
**Route:** `POST /api/admin/elasticsearch/indices/:indexName/import`

**Utilisation depuis le frontend:**
```javascript
const formData = new FormData();
formData.append('file', file); // fichier sélectionné
formData.append('bulkSize', 1000); // taille du batch (optionnel)

const response = await fetch(`/api/admin/elasticsearch/indices/${indexName}/import`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}` // Token admin requis
  },
  body: formData
});
```

#### 2. **Upload avec progression en temps réel** (fichiers moyens/grands)
**Route:** `POST /api/admin/elasticsearch/indices/:indexName/import-with-progress`

**Utilisation depuis le frontend (Server-Sent Events):**
```javascript
const formData = new FormData();
formData.append('file', file);

const eventSource = new EventSource(`/api/admin/elasticsearch/indices/${indexName}/import-with-progress?token=${token}`);
// OU utiliser fetch avec ReadableStream pour les SSE

// Les événements reçus:
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Types d'événements:
  // - type: 'start' → début de l'import
  // - type: 'progress' → progression (processed, imported, errors, progress)
  // - type: 'complete' → fin de l'import
  // - type: 'error' → erreur
};
```

#### 3. **Upload fichiers très volumineux** (>1GB)
**Route:** `POST /api/admin/elasticsearch/indices/:indexName/import-large-file`

Utilise le traitement en streaming pour les fichiers très volumineux avec Server-Sent Events (SSE) pour la progression.

---

## 🔄 PARTIE 2: Traitement et Stockage dans Elasticsearch

### Étape 1: Parsing du Fichier

**Fichier:** `routes/elasticsearchAdminRoutes.js` (lignes 134-233)

La fonction `parseFileData(file)` traite différents formats :

```javascript
const parseFileData = async (file) => {
  const { originalname, mimetype, buffer } = file;
  
  // Détection de la taille du fichier
  const fileSizeMB = buffer.length / (1024 * 1024);
  
  // Traitement selon le type MIME:
  
  // 1. JSON (application/json)
  if (mimetype === 'application/json') {
    if (fileSizeMB > 100) {
      // Traitement optimisé pour gros fichiers
      return await parseLargeJsonFile(buffer);
    }
    // Traitement standard
    const content = buffer.toString('utf8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [data];
  }
  
  // 2. CSV (text/csv)
  if (mimetype === 'text/csv') {
    // Utilise csv-parser pour convertir CSV → JSON
    // Retourne un tableau d'objets
  }
  
  // 3. Excel (.xlsx, .xls)
  if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    // Utilise XLSX pour convertir Excel → JSON
    // Retourne un tableau d'objets
  }
};
```

### Étape 2: Conversion et Nettoyage des Données

**Fichier:** `routes/elasticsearchAdminRoutes.js` (lignes 596-626 et 2569-2620)

Chaque document est nettoyé et converti :

```javascript
// Pour chaque document dans le batch:
batch.forEach((doc, index) => {
  // 1. Filtrage des champs MongoDB
  const filteredDoc = { ...doc };
  const skipFields = ['_id', '__v', 'createdAt', 'updatedAt'];
  skipFields.forEach(field => {
    delete filteredDoc[field];
  });
  
  // 2. Conversion des types selon le mapping Elasticsearch
  const convertedDoc = convertFieldTypes(filteredDoc, indexName);
  
  // 3. Ajout des timestamps si manquants
  if (!convertedDoc.createdAt) {
    convertedDoc.createdAt = new Date().toISOString();
  }
  if (!convertedDoc.updatedAt) {
    convertedDoc.updatedAt = new Date().toISOString();
  }
  
  // 4. Génération d'un ID unique
  const documentId = `${batchTimestamp}_${i + index}`;
  
  // 5. Préparation pour bulk insert
  body.push({
    index: {
      _index: indexName,
      _id: documentId
    }
  });
  body.push(convertedDoc);
});
```

### Étape 3: Insertion Bulk dans Elasticsearch

**Fichier:** `routes/elasticsearchAdminRoutes.js` (lignes 628-638)

Les documents sont insérés par batches dans Elasticsearch :

```javascript
// Insertion bulk (plus efficace que plusieurs insertions individuelles)
const response = await client.bulk({ body });

// body contient:
// [
//   { index: { _index: 'indexName', _id: 'doc1' } },
//   { field1: 'value1', field2: 'value2', ... },
//   { index: { _index: 'indexName', _id: 'doc2' } },
//   { field1: 'value1', field2: 'value2', ... },
//   ...
// ]

// Comptage des succès et erreurs
response.items.forEach(item => {
  if (item.index && item.index.error) {
    errors++;
  } else {
    imported++;
  }
});
```

**Avantages du bulk insert:**
- Traitement par batches (1000-5000 documents selon la taille)
- Plus performant que les insertions individuelles
- Gestion d'erreurs par document (un échec n'arrête pas tout)

---

## 📥 PARTIE 3: Récupération des Données depuis Elasticsearch

### Option 1: Récupération via l'API Admin (avec pagination et recherche)

**Route:** `GET /api/admin/elasticsearch/indices/:indexName/documents`

**Fichier:** `routes/elasticsearchAdminRoutes.js` (lignes 2836-3336)

**Utilisation depuis le frontend:**
```javascript
// Récupération avec pagination et recherche
const response = await fetch(
  `/api/admin/elasticsearch/indices/${indexName}/documents?` +
  `page=1&size=10&search=terme&sortField=_id&sortOrder=desc`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
// Retourne:
// {
//   success: true,
//   data: {
//     documents: [
//       { _id: '...', _source: { ... }, _score: ... },
//       ...
//     ],
//     total: 1000,
//     page: 1,
//     size: 10,
//     totalPages: 100
//   }
// }
```

**Paramètres de requête disponibles:**
- `page` : Numéro de page (défaut: 1)
- `size` : Taille de la page (défaut: 10)
- `search` : Terme de recherche textuelle
- `sortField` : Champ de tri (défaut: '_id')
- `sortOrder` : Ordre de tri ('asc' ou 'desc')
- `fields` : Champs à récupérer (séparés par virgules, '*' pour tous)
- `filter.fieldName` : Filtres dynamiques (ex: `filter.year=2020`)

### Option 2: Recherche dans un Index Spécifique

**Route:** `GET /api/agricultural/indices/:indexName/search`

**Fichier:** `routes/agriculturalDataRoutes.js` (lignes 332-594)

**Utilisation depuis le frontend:**
```javascript
const response = await fetch(
  `/api/agricultural/indices/${indexName}/search?` +
  `q=terme&page=1&limit=50&year=2020&area=Tunisia`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
// Retourne:
// {
//   success: true,
//   data: [...], // Documents avec _id, _score, _highlights
//   pagination: {
//     page: 1,
//     limit: 50,
//     total: 500,
//     pages: 10
//   }
// }
```

**Fonctionnalités:**
- Recherche textuelle intelligente sur plusieurs champs
- Filtres dynamiques (tout paramètre de query devient un filtre)
- Mise en évidence (highlighting) des termes trouvés
- Tri par pertinence (_score) ou par date

### Option 3: Utilisation du Service ElasticsearchService

**Fichier:** `services/ElasticsearchService.js`

**Utilisation dans le backend:**
```javascript
const ElasticsearchService = require('./services/ElasticsearchService');

const esService = new ElasticsearchService('indexName');

// Méthodes disponibles:

// 1. Recherche simple
const documents = await esService.find({
  query: { match_all: {} },
  sort: [{ createdAt: { order: 'desc' } }],
  from: 0,
  size: 50
});

// 2. Recherche par ID
const doc = await esService.findById('documentId');

// 3. Recherche textuelle avec filtres
const results = await esService.search(
  'terme de recherche',
  ['field1', 'field2'], // champs à chercher
  { year: 2020, area: 'Tunisia' } // filtres
);

// 4. Agrégations
const aggs = await esService.aggregate({
  by_year: {
    terms: { field: 'year' }
  }
});
```

---

## 🔍 Détails Techniques

### Mapping Elasticsearch

**Fichier:** `config/elasticsearchMappings.js`

Les mappings définissent la structure des données dans Elasticsearch :

```javascript
// Exemple de mapping pour producer_prices
producer_prices: {
  mappings: {
    properties: {
      area: { 
        type: 'text',
        fields: { 
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' }
        }
      },
      year: { type: 'integer' },
      value: { type: 'float' },
      // ...
    }
  }
}
```

**Types de champs:**
- `text` : Recherche full-text
- `keyword` : Recherche exacte
- `integer/float` : Nombres
- `date` : Dates
- `completion` : Autocomplétion

### Conversion des Types

**Fichier:** `routes/elasticsearchAdminRoutes.js` (lignes 78-132)

La fonction `convertFieldTypes()` assure que les types correspondent au mapping :

```javascript
const convertFieldTypes = (doc, indexName) => {
  // Récupère le mapping de l'index
  const mapping = indexMappings[indexName]?.mappings?.properties;
  
  // Convertit chaque champ selon son type attendu
  for (const [key, value] of Object.entries(doc)) {
    const fieldMapping = mapping?.[key];
    if (fieldMapping?.type === 'integer') {
      doc[key] = parseInt(value);
    } else if (fieldMapping?.type === 'float') {
      doc[key] = parseFloat(value);
    }
    // ... autres conversions
  }
};
```

---

## 📊 Schéma du Flux Complet

```
┌─────────────┐
│  FRONTEND   │
│             │
│ 1. Upload   │
│    fichier  │
└──────┬──────┘
       │
       │ POST /api/admin/elasticsearch/indices/:indexName/import
       │ (avec FormData contenant le fichier)
       │
       ▼
┌─────────────┐
│   BACKEND   │
│             │
│ 2. Multer   │ ← Reçoit le fichier
│    Memory   │   Stocke en buffer
│    Storage  │
└──────┬──────┘
       │
       │ parseFileData(file)
       ▼
┌─────────────┐
│   PARSING   │
│             │
│ - JSON      │ ← Détermine le format
│ - CSV       │   Parse → Tableau d'objets
│ - Excel     │
└──────┬──────┘
       │
       │ convertFieldTypes() + nettoyage
       ▼
┌─────────────┐
│  CONVERSION │
│             │
│ - Filtrage  │ ← Nettoie les données
│ - Conversion│   Convertit les types
│ - Ajout IDs │   Ajoute timestamps
└──────┬──────┘
       │
       │ client.bulk({ body })
       ▼
┌─────────────┐
│ELASTICSEARCH│
│             │
│ Bulk Insert │ ← Stocke les documents
│ par batches │   Dans l'index
└─────────────┘

       │
       │ GET /api/admin/elasticsearch/indices/:indexName/documents
       │
       ▼
┌─────────────┐
│  FRONTEND   │
│             │
│ 3. Display  │ ← Affiche les données
│    données  │   Avec pagination
└─────────────┘
```

---

## 🔐 Sécurité et Authentification

Tous les endpoints d'upload nécessitent:
- **Authentification** (`protect` middleware)
- **Droits Admin** (`adminOnly` middleware)

Les routes de récupération :
- `/api/admin/elasticsearch/...` → Requiert admin
- `/api/agricultural/...` → Peut être publique selon la configuration

---

## 📝 Exemple Complet d'Intégration Frontend

```javascript
// ============================================
// UPLOAD DE FICHIER
// ============================================
async function uploadFile(file, indexName, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bulkSize', 1000);
  
  // Option 1: Upload simple (petits fichiers)
  const response = await fetch(
    `/api/admin/elasticsearch/indices/${indexName}/import`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );
  
  const result = await response.json();
  return result;
  
  // Option 2: Upload avec progression (fichiers moyens/grands)
  // Utiliser EventSource ou ReadableStream pour SSE
}

// ============================================
// RÉCUPÉRATION DES DONNÉES
// ============================================
async function fetchDocuments(indexName, page = 1, size = 10, searchTerm = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    search: searchTerm,
    sortField: '_id',
    sortOrder: 'desc'
  });
  
  const response = await fetch(
    `/api/admin/elasticsearch/indices/${indexName}/documents?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    return {
      documents: data.data.documents,
      total: data.data.total,
      page: data.data.page,
      totalPages: data.data.totalPages
    };
  }
  
  throw new Error(data.message);
}

// ============================================
// RECHERCHE AVANCÉE
// ============================================
async function searchDocuments(indexName, query, filters = {}) {
  const params = new URLSearchParams({
    q: query,
    page: '1',
    limit: '50',
    ...filters // ex: { year: '2020', area: 'Tunisia' }
  });
  
  const response = await fetch(
    `/api/agricultural/indices/${indexName}/search?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data;
}
```

---

## 🎯 Résumé

1. **Upload Frontend → Backend:**
   - Multer reçoit le fichier et le stocke en mémoire (buffer)
   - Plusieurs endpoints selon la taille du fichier

2. **Traitement et Stockage:**
   - Parsing selon le format (JSON/CSV/Excel)
   - Nettoyage et conversion des types
   - Insertion bulk par batches dans Elasticsearch

3. **Récupération pour Affichage:**
   - Endpoints GET avec pagination, recherche et filtres
   - Service ElasticsearchService pour usage interne
   - Retour JSON structuré pour le frontend



# Guide du Système de Graphiques Dynamiques

## 🎯 Vue d'ensemble

Le système de graphiques dynamiques permet de créer, sauvegarder et réutiliser des configurations de graphiques avec la possibilité de choisir **dynamiquement** les attributs/champs à utiliser dans les graphiques.

## ✨ Fonctionnalités

- ✅ **Sélection dynamique des champs** : Choisir n'importe quel champ disponible dans l'index
- ✅ **Validation automatique** : Vérification que les champs peuvent être utilisés pour les axes/métriques
- ✅ **Multi-séries** : Support de plusieurs séries de données dans un même graphique
- ✅ **Filtres avancés** : Appliquer des filtres complexes sur les données
- ✅ **Types de graphiques** : Bar, Line, Pie, Area, Scatter, Table
- ✅ **Partage** : Configurations publiques/privées
- ✅ **Réutilisation** : Sauvegarder et réutiliser les configurations

---

## 📚 API Endpoints

### 1. Obtenir les champs disponibles d'un index

**Endpoint:** `GET /api/charts/builder/indexes/:indexName/fields`

**Description:** Récupère tous les champs disponibles d'un index avec leurs capacités (peut être axe, métrique, filtre, etc.)

**Exemple:**
```javascript
const response = await fetch('/api/charts/builder/indexes/producer_prices/fields', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// Retourne:
// {
//   success: true,
//   data: {
//     indexName: 'producer_prices',
//     fields: [
//       {
//         name: 'area',
//         type: 'text',
//         keywordField: 'area.keyword',
//         canBeAxis: true,
//         canBeMetric: false,
//         canBeFilter: true,
//         canBeSeries: true,
//         canBeTimeField: false,
//         aggregatable: true
//       },
//       {
//         name: 'value',
//         type: 'float',
//         keywordField: null,
//         canBeAxis: false,
//         canBeMetric: true,
//         canBeFilter: true,
//         canBeSeries: false,
//         canBeTimeField: false,
//         aggregatable: true
//       },
//       // ...
//     ]
//   }
// }
```

---

### 2. Créer une configuration de graphique

**Endpoint:** `POST /api/charts`

**Body:**
```json
{
  "name": "Production par Pays - Blé",
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
    "series": [
      {
        "field": "item",
        "label": "Blé",
        "filter": {
          "item": "Wheat"
        },
        "color": "#3498db"
      },
      {
        "field": "item",
        "label": "Maïs",
        "filter": {
          "item": "Maize"
        },
        "color": "#e74c3c"
      }
    ]
  },
  
  "filters": {
    "year": {
      "min": 2020,
      "max": 2023
    },
    "area": ["Tunisia", "Morocco", "Algeria"]
  },
  
  "visualization": {
    "colors": ["#3498db", "#e74c3c", "#2ecc71"],
    "showLegend": true,
    "showGrid": true,
    "stacked": false,
    "smooth": false
  },
  
  "tags": ["production", "wheat", "agriculture"],
  "isPublic": false
}
```

**Types de graphiques supportés:**
- `bar` : Graphique en barres
- `line` : Graphique en courbes
- `area` : Graphique en aires
- `pie` : Camembert
- `doughnut` : Donut
- `scatter` : Nuage de points
- `table` : Tableau

**Aggregations supportées pour les métriques (yAxis):**
- `sum` : Somme
- `avg` : Moyenne
- `min` : Minimum
- `max` : Maximum
- `count` : Compte

**Exemple JavaScript:**
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

  return await response.json();
};
```

---

### 3. Récupérer les configurations de l'utilisateur

**Endpoint:** `GET /api/charts?includePublic=true`

**Query Parameters:**
- `includePublic` : `true`/`false` - Inclure les configurations publiques (défaut: false)

**Exemple:**
```javascript
const response = await fetch('/api/charts?includePublic=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// Retourne:
// {
//   success: true,
//   data: [
//     {
//       id: 'chart_001',
//       name: 'Production par Pays',
//       type: 'bar',
//       indexName: 'producer_prices',
//       // ... configuration complète
//     },
//     // ...
//   ]
// }
```

---

### 4. Récupérer une configuration spécifique

**Endpoint:** `GET /api/charts/:id`

**Exemple:**
```javascript
const response = await fetch('/api/charts/chart_001', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

---

### 5. Générer les données d'un graphique

**Endpoint:** `GET /api/charts/:id/data`

**Description:** Génère les données du graphique à partir d'une configuration sauvegardée

**Exemple:**
```javascript
const response = await fetch('/api/charts/chart_001/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// Retourne:
// {
//   success: true,
//   data: {
//     config: { ... }, // Configuration complète
//     chartData: {
//       labels: ['Tunisia', 'Morocco', 'Algeria'],
//       datasets: [
//         {
//           label: 'Blé',
//           data: [1000, 800, 600],
//           backgroundColor: '#3498db'
//         },
//         {
//           label: 'Maïs',
//           data: [500, 400, 300],
//           backgroundColor: '#e74c3c'
//         }
//       ]
//     },
//     indexFields: [ ... ] // Champs disponibles avec leurs capacités
//   }
// }
```

**Utilisation avec Chart.js:**
```javascript
const chartData = await getChartData('chart_001');
const chartData = chartData.data.chartData;
const config = chartData.data.config;

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: config.type, // 'bar', 'line', etc.
  data: chartData.chartData,
  options: {
    ...config.visualization,
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
```

---

### 6. Mettre à jour une configuration

**Endpoint:** `PUT /api/charts/:id`

**Body:** Même structure que la création (champs partiels acceptés)

**Exemple:**
```javascript
const response = await fetch('/api/charts/chart_001', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    filters: {
      year: { min: 2021, max: 2023 } // Mise à jour partielle
    }
  })
});
```

---

### 7. Supprimer une configuration

**Endpoint:** `DELETE /api/charts/:id`

**Exemple:**
```javascript
const response = await fetch('/api/charts/chart_001', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### 8. Rechercher des configurations publiques

**Endpoint:** `GET /api/charts/public?q=search&tags=tag1,tag2&limit=20`

**Query Parameters:**
- `q` : Terme de recherche
- `tags` : Tags séparés par des virgules
- `limit` : Nombre de résultats (défaut: 20)

**Exemple:**
```javascript
const response = await fetch('/api/charts/public?q=production&tags=agriculture,wheat&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### 9. Dupliquer une configuration

**Endpoint:** `POST /api/charts/:id/duplicate`

**Body:**
```json
{
  "name": "Ma Copie"
}
```

**Exemple:**
```javascript
const response = await fetch('/api/charts/chart_001/duplicate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Ma Copie de Graphique'
  })
});
```

---

## 🎨 Exemples de Configurations

### Exemple 1: Graphique en barres simple

```json
{
  "name": "Production totale par année",
  "type": "bar",
  "indexName": "producer_prices",
  "dataConfig": {
    "xAxis": {
      "field": "year",
      "label": "Année"
    },
    "yAxis": {
      "field": "value",
      "label": "Production (tonnes)",
      "aggregation": "sum"
    }
  },
  "filters": {
    "item": "Wheat",
    "area": "Tunisia"
  }
}
```

### Exemple 2: Graphique multi-séries (plusieurs produits)

```json
{
  "name": "Comparaison Production - Blé vs Maïs",
  "type": "line",
  "indexName": "producer_prices",
  "dataConfig": {
    "xAxis": {
      "field": "year",
      "label": "Année"
    },
    "yAxis": {
      "field": "value",
      "label": "Production (tonnes)",
      "aggregation": "sum"
    },
    "series": [
      {
        "label": "Blé",
        "filter": { "item": "Wheat" },
        "color": "#3498db"
      },
      {
        "label": "Maïs",
        "filter": { "item": "Maize" },
        "color": "#e74c3c"
      }
    ]
  },
  "filters": {
    "area": "Tunisia",
    "year": { "min": 2020, "max": 2023 }
  },
  "visualization": {
    "smooth": true,
    "showGrid": true
  }
}
```

### Exemple 3: Camembert (répartition)

```json
{
  "name": "Répartition par Pays",
  "type": "pie",
  "indexName": "producer_prices",
  "dataConfig": {
    "xAxis": {
      "field": "area",
      "label": "Pays"
    },
    "yAxis": {
      "field": "value",
      "label": "Production",
      "aggregation": "sum"
    }
  },
  "filters": {
    "year": 2023,
    "item": "Wheat"
  }
}
```

### Exemple 4: Série temporelle avec agrégation par date

```json
{
  "name": "Évolution mensuelle",
  "type": "area",
  "indexName": "producer_prices",
  "dataConfig": {
    "xAxis": {
      "field": "createdAt",
      "label": "Date"
    },
    "yAxis": {
      "field": "value",
      "label": "Valeur",
      "aggregation": "avg"
    }
  },
  "filters": {
    "year": { "min": 2022, "max": 2023 }
  },
  "visualization": {
    "fill": true,
    "smooth": true
  }
}
```

---

## 🔍 Validation des Champs

Le système valide automatiquement que les champs peuvent être utilisés :

- **Axe X** : Doit être `keyword`, `text`, `date`, ou `integer`
- **Axe Y (métrique)** : Doit être `integer`, `long`, `float`, ou `double`
- **Série** : Doit être `keyword` ou `text`
- **Filtre** : Tout type de champ accepté
- **Champ temporel** : Doit être `date`

Si un champ est de type `text`, le système utilisera automatiquement le sous-champ `.keyword` s'il existe.

---

## 📊 Workflow Complet

### Étape 1: Obtenir les champs disponibles
```javascript
const fields = await getFieldsForIndex('producer_prices');
// Afficher à l'utilisateur les champs utilisables
```

### Étape 2: L'utilisateur configure le graphique
- Sélectionne le type (bar, line, etc.)
- Choisit les champs pour X et Y
- Ajoute des séries si nécessaire
- Applique des filtres
- Personnalise la visualisation

### Étape 3: Sauvegarder la configuration
```javascript
const config = await createChart(configuration);
```

### Étape 4: Générer et afficher les données
```javascript
const chartData = await getChartData(config.id);
// Utiliser chartData.chartData avec Chart.js ou autre bibliothèque
```

---

## 🛠️ Builder de Graphique (Frontend)

### Interface suggérée

1. **Sélection de l'index**
   - Liste déroulante des indices disponibles

2. **Récupération des champs**
   ```javascript
   const fields = await fetch(`/api/charts/builder/indexes/${indexName}/fields`);
   ```

3. **Sélection du type de graphique**
   - Radio buttons ou dropdown : bar, line, pie, etc.

4. **Configuration des axes**
   - Dropdown pour X-axis (filtre sur `canBeAxis: true`)
   - Dropdown pour Y-axis (filtre sur `canBeMetric: true`)
   - Dropdown pour l'aggregation (sum, avg, etc.)

5. **Ajout de séries** (optionnel)
   - Bouton "Ajouter série"
   - Pour chaque série : champ, filtre, couleur

6. **Application de filtres**
   - Interface dynamique basée sur les types de champs
   - Support des filtres simples et de plages

7. **Personnalisation**
   - Couleurs, légendes, grille, etc.

8. **Sauvegarde**
   - Nom, description, tags, public/privé

---

## 🎯 Cas d'Usage

### 1. Dashboard analytique
Créer plusieurs graphiques sauvegardés et les afficher sur un dashboard.

### 2. Rapports récurrents
Réutiliser des configurations pour générer des rapports réguliers.

### 3. Partage d'analyses
Partager des configurations publiques avec d'autres utilisateurs.

### 4. Templates
Créer des configurations de base que les utilisateurs peuvent dupliquer et personnaliser.

---

## 🔐 Permissions

- **Créer** : Tout utilisateur authentifié
- **Voir ses configurations** : Propriétaire uniquement
- **Voir configurations publiques** : Tout utilisateur authentifié
- **Modifier/Supprimer** : Propriétaire uniquement
- **Dupliquer** : Configurations publiques ou ses propres configurations

---

## ⚠️ Notes Importantes

1. **Champs text avec keyword** : Les champs `text` utilisent automatiquement `.keyword` pour les aggregations
2. **Limites** : Les aggregations ont une limite par défaut de 100 buckets (configurable via `limit`)
3. **Performance** : Les graphiques avec beaucoup de données peuvent prendre du temps à générer
4. **Filtres** : Les filtres sont appliqués AVANT les aggregations pour optimiser les performances

---

## 🚀 Améliorations Futures Possibles

- [ ] Dashboards composés de plusieurs graphiques
- [ ] Export des graphiques (PNG, PDF, CSV)
- [ ] Planification automatique de rapports
- [ ] Alertes basées sur les seuils
- [ ] Comparaisons temporelles (year-over-year)
- [ ] Drill-down interactif
- [ ] Cache des résultats pour améliorer les performances


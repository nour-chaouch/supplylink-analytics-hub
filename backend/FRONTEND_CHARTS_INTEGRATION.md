# Guide d'Intégration Frontend pour les Graphiques

## 📍 Routes Frontend pour Visualiser les Graphiques

### Structure suggérée des routes/pages

```
/                    → Dashboard avec liste des graphiques
/charts              → Liste de tous mes graphiques
/charts/create       → Créer un nouveau graphique (Builder)
/charts/:id          → Voir un graphique spécifique
/charts/:id/edit     → Modifier un graphique
/charts/public       → Graphiques publics partagés
```

---

## 🎨 Exemple d'Intégration React/Next.js

### 1. Page de Liste des Graphiques

**`pages/charts/index.js` ou `src/pages/Charts.js`**

```jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ChartsListPage = () => {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/charts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCharts(data.data);
      }
    } catch (error) {
      console.error('Error fetching charts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChart = (chartId) => {
    router.push(`/charts/${chartId}`);
  };

  const handleEditChart = (chartId) => {
    router.push(`/charts/${chartId}/edit`);
  };

  const handleCreateChart = () => {
    router.push('/charts/create');
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="charts-page">
      <div className="page-header">
        <h1>Mes Graphiques</h1>
        <button onClick={handleCreateChart} className="btn-primary">
          + Créer un Graphique
        </button>
      </div>

      <div className="charts-grid">
        {charts.map(chart => (
          <div key={chart.id} className="chart-card">
            <div className="chart-card-header">
              <h3>{chart.name}</h3>
              <span className="chart-type-badge">{chart.type}</span>
            </div>
            
            <p className="chart-description">{chart.description || 'Aucune description'}</p>
            
            <div className="chart-info">
              <span>Index: {chart.indexName}</span>
              <span>Type: {chart.type}</span>
            </div>

            <div className="chart-actions">
              <button 
                onClick={() => handleViewChart(chart.id)}
                className="btn-view"
              >
                Voir
              </button>
              <button 
                onClick={() => handleEditChart(chart.id)}
                className="btn-edit"
              >
                Modifier
              </button>
            </div>

            {chart.metadata?.tags && chart.metadata.tags.length > 0 && (
              <div className="chart-tags">
                {chart.metadata.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {charts.length === 0 && (
        <div className="empty-state">
          <p>Aucun graphique créé. Créez votre premier graphique !</p>
          <button onClick={handleCreateChart} className="btn-primary">
            Créer un Graphique
          </button>
        </div>
      )}
    </div>
  );
};

export default ChartsListPage;
```

---

### 2. Page de Visualisation d'un Graphique

**`pages/charts/[id].js` ou `src/pages/ChartView.js`**

```jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
         LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ChartViewPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [chartConfig, setChartConfig] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchChartData();
    }
  }, [id]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/charts/${id}/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setChartConfig(data.data.config);
        
        // Formater les données pour Chart.js
        const formattedData = {
          labels: data.data.chartData.labels,
          datasets: data.data.chartData.datasets
        };
        
        setChartData(formattedData);
      } else {
        setError(data.message || 'Erreur lors du chargement du graphique');
      }
    } catch (err) {
      setError('Erreur lors du chargement du graphique');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData || !chartConfig) return null;

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartConfig.visualization?.showLegend !== false,
          position: 'top',
        },
        title: {
          display: true,
          text: chartConfig.name,
        },
      },
      scales: chartConfig.type !== 'pie' && chartConfig.type !== 'doughnut' ? {
        y: {
          beginAtZero: true,
          grid: {
            display: chartConfig.visualization?.showGrid !== false
          }
        },
        x: {
          grid: {
            display: chartConfig.visualization?.showGrid !== false
          }
        }
      } : undefined
    };

    switch (chartConfig.type) {
      case 'bar':
        return (
          <Bar 
            data={chartData} 
            options={{
              ...commonOptions,
              scales: {
                ...commonOptions.scales,
                x: {
                  stacked: chartConfig.visualization?.stacked || false,
                  ...commonOptions.scales?.x
                },
                y: {
                  stacked: chartConfig.visualization?.stacked || false,
                  ...commonOptions.scales?.y
                }
              }
            }} 
          />
        );
      
      case 'line':
        return (
          <Line 
            data={chartData} 
            options={{
              ...commonOptions,
              elements: {
                line: {
                  tension: chartConfig.visualization?.smooth ? 0.4 : 0
                }
              }
            }} 
          />
        );
      
      case 'area':
        return (
          <Line 
            data={chartData} 
            options={{
              ...commonOptions,
              elements: {
                line: {
                  tension: chartConfig.visualization?.smooth ? 0.4 : 0
                }
              }
            }}
          />
        );
      
      case 'pie':
        return <Pie data={chartData} options={commonOptions} />;
      
      case 'doughnut':
        return <Doughnut data={chartData} options={commonOptions} />;
      
      default:
        return <div>Type de graphique non supporté: {chartConfig.type}</div>;
    }
  };

  if (loading) {
    return (
      <div className="chart-view-page">
        <div className="loading-state">
          <p>Chargement du graphique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-view-page">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => router.back()}>Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-view-page">
      <div className="chart-header">
        <button onClick={() => router.back()} className="btn-back">
          ← Retour
        </button>
        <h1>{chartConfig?.name}</h1>
        <div className="chart-meta">
          <span>Type: {chartConfig?.type}</span>
          <span>Index: {chartConfig?.indexName}</span>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-wrapper" style={{ height: '500px' }}>
          {renderChart()}
        </div>
      </div>

      <div className="chart-details">
        <div className="details-section">
          <h3>Description</h3>
          <p>{chartConfig?.description || 'Aucune description'}</p>
        </div>

        {chartConfig?.filters && Object.keys(chartConfig.filters).length > 0 && (
          <div className="details-section">
            <h3>Filtres appliqués</h3>
            <pre>{JSON.stringify(chartConfig.filters, null, 2)}</pre>
          </div>
        )}

        {chartConfig?.metadata?.tags && chartConfig.metadata.tags.length > 0 && (
          <div className="details-section">
            <h3>Tags</h3>
            <div className="tags-list">
              {chartConfig.metadata.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartViewPage;
```

---

### 3. Builder de Graphique (Création/Édition)

**`pages/charts/create.js` ou `src/pages/ChartBuilder.js`**

```jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ChartBuilderPage = () => {
  const router = useRouter();
  const { id } = router.query; // Si présent, on est en mode édition
  const isEditMode = !!id;

  const [indexes, setIndexes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'bar',
    indexName: '',
    description: '',
    dataConfig: {
      xAxis: { field: '', label: '', limit: 50 },
      yAxis: { field: '', label: '', aggregation: 'sum' },
      series: []
    },
    filters: {},
    visualization: {
      showLegend: true,
      showGrid: true,
      stacked: false,
      smooth: false
    },
    tags: [],
    isPublic: false
  });

  useEffect(() => {
    fetchIndexes();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      fetchChartConfig();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (selectedIndex) {
      fetchFieldsForIndex(selectedIndex);
      setFormData(prev => ({ ...prev, indexName: selectedIndex }));
    }
  }, [selectedIndex]);

  const fetchIndexes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/agricultural/indices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setIndexes(data.data);
      }
    } catch (error) {
      console.error('Error fetching indexes:', error);
    }
  };

  const fetchFieldsForIndex = async (indexName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/charts/builder/indexes/${indexName}/fields`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableFields(data.data.fields);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const fetchChartConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/charts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const config = data.data;
        setFormData({
          name: config.name,
          type: config.type,
          indexName: config.indexName,
          description: config.description || '',
          dataConfig: config.dataConfig || {},
          filters: config.filters || {},
          visualization: config.visualization || {},
          tags: config.metadata?.tags || [],
          isPublic: config.metadata?.isPublic || false
        });
        setSelectedIndex(config.indexName);
      }
    } catch (error) {
      console.error('Error fetching chart config:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = isEditMode 
        ? `/api/charts/${id}`
        : '/api/charts';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/charts/${isEditMode ? id : data.data._id}`);
      } else {
        alert('Erreur: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving chart:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const addSeries = () => {
    setFormData(prev => ({
      ...prev,
      dataConfig: {
        ...prev.dataConfig,
        series: [...(prev.dataConfig.series || []), {
          label: '',
          filter: {},
          color: '#3498db'
        }]
      }
    }));
  };

  const updateSeries = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      dataConfig: {
        ...prev.dataConfig,
        series: prev.dataConfig.series.map((series, i) => 
          i === index ? { ...series, [field]: value } : series
        )
      }
    }));
  };

  const axisFields = availableFields.filter(f => f.canBeAxis);
  const metricFields = availableFields.filter(f => f.canBeMetric);
  const seriesFields = availableFields.filter(f => f.canBeSeries);

  return (
    <div className="chart-builder-page">
      <div className="builder-header">
        <h1>{isEditMode ? 'Modifier le Graphique' : 'Créer un Graphique'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="chart-form">
        {/* Informations de base */}
        <div className="form-section">
          <h2>Informations de base</h2>
          
          <div className="form-group">
            <label>Nom du graphique *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Type de graphique *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              required
            >
              <option value="bar">Barres</option>
              <option value="line">Courbes</option>
              <option value="area">Aires</option>
              <option value="pie">Camembert</option>
              <option value="doughnut">Donut</option>
              <option value="scatter">Nuage de points</option>
            </select>
          </div>

          <div className="form-group">
            <label>Index de données *</label>
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
              required
            >
              <option value="">Sélectionner un index...</option>
              {indexes.map(index => (
                <option key={index.name} value={index.name}>
                  {index.displayName || index.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configuration des axes */}
        {selectedIndex && (
          <div className="form-section">
            <h2>Configuration des données</h2>

            <div className="form-group">
              <label>Axe X (Catégories) *</label>
              <select
                value={formData.dataConfig.xAxis?.field || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dataConfig: {
                    ...prev.dataConfig,
                    xAxis: {
                      ...prev.dataConfig.xAxis,
                      field: e.target.value,
                      label: e.target.options[e.target.selectedIndex].text
                    }
                  }
                }))}
                required
              >
                <option value="">Sélectionner un champ...</option>
                {axisFields.map(field => (
                  <option key={field.name} value={field.name}>
                    {field.name} ({field.type})
                  </option>
                ))}
              </select>
            </div>

            {formData.type !== 'pie' && formData.type !== 'doughnut' && (
              <div className="form-group">
                <label>Axe Y (Métrique) *</label>
                <select
                  value={formData.dataConfig.yAxis?.field || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dataConfig: {
                      ...prev.dataConfig,
                      yAxis: {
                        ...prev.dataConfig.yAxis,
                        field: e.target.value,
                        label: e.target.options[e.target.selectedIndex].text
                      }
                    }
                  }))}
                  required
                >
                  <option value="">Sélectionner un champ...</option>
                  {metricFields.map(field => (
                    <option key={field.name} value={field.name}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.dataConfig.yAxis?.field && (
              <div className="form-group">
                <label>Agrégation</label>
                <select
                  value={formData.dataConfig.yAxis?.aggregation || 'sum'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dataConfig: {
                      ...prev.dataConfig,
                      yAxis: {
                        ...prev.dataConfig.yAxis,
                        aggregation: e.target.value
                      }
                    }
                  }))}
                >
                  <option value="sum">Somme</option>
                  <option value="avg">Moyenne</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                  <option value="count">Compte</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Séries multiples */}
        {(formData.type === 'bar' || formData.type === 'line' || formData.type === 'area') && (
          <div className="form-section">
            <h2>Séries multiples (optionnel)</h2>
            <button type="button" onClick={addSeries} className="btn-secondary">
              + Ajouter une série
            </button>

            {formData.dataConfig.series?.map((series, index) => (
              <div key={index} className="series-item">
                <div className="form-group">
                  <label>Label de la série</label>
                  <input
                    type="text"
                    value={series.label}
                    onChange={(e) => updateSeries(index, 'label', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Champ de filtre</label>
                  <select
                    value={Object.keys(series.filter || {})[0] || ''}
                    onChange={(e) => {
                      const field = e.target.value;
                      updateSeries(index, 'filter', field ? { [field]: '' } : {});
                    }}
                  >
                    <option value="">Aucun filtre</option>
                    {seriesFields.map(field => (
                      <option key={field.name} value={field.name}>
                        {field.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Couleur</label>
                  <input
                    type="color"
                    value={series.color || '#3498db'}
                    onChange={(e) => updateSeries(index, 'color', e.target.value)}
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      dataConfig: {
                        ...prev.dataConfig,
                        series: prev.dataConfig.series.filter((_, i) => i !== index)
                      }
                    }));
                  }}
                  className="btn-danger"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Options de visualisation */}
        <div className="form-section">
          <h2>Options de visualisation</h2>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.visualization.showLegend}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  visualization: {
                    ...prev.visualization,
                    showLegend: e.target.checked
                  }
                }))}
              />
              Afficher la légende
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.visualization.showGrid}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  visualization: {
                    ...prev.visualization,
                    showGrid: e.target.checked
                  }
                }))}
              />
              Afficher la grille
            </label>
          </div>

          {(formData.type === 'bar' || formData.type === 'line' || formData.type === 'area') && (
            <>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.visualization.stacked}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      visualization: {
                        ...prev.visualization,
                        stacked: e.target.checked
                      }
                    }))}
                  />
                  Graphique empilé (pour barres)
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.visualization.smooth}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      visualization: {
                        ...prev.visualization,
                        smooth: e.target.checked
                      }
                    }))}
                  />
                  Courbes lissées (pour lignes)
                </label>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            {isEditMode ? 'Enregistrer' : 'Créer le graphique'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChartBuilderPage;
```

---

## 📦 Installation des dépendances

Si vous utilisez React/Next.js, installez Chart.js :

```bash
npm install chart.js react-chartjs-2
# ou
yarn add chart.js react-chartjs-2
```

---

## 🎨 CSS de base recommandé

```css
/* charts-page.css */
.charts-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-type-badge {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-primary, .btn-secondary, .btn-view, .btn-edit {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-view {
  background: #2ecc71;
  color: white;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.chart-wrapper {
  position: relative;
}

.chart-details {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
}

.details-section {
  margin-bottom: 1.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #ecf0f1;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

/* Builder styles */
.chart-builder-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.series-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}
```

---

## 🔗 Configuration de l'API

Assurez-vous que votre frontend pointe vers le bon backend :

```javascript
// config/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }
  });

  return response.json();
};

// Utilisation
import { apiRequest } from '@/config/api';

const charts = await apiRequest('/api/charts');
```

---

## 📱 Exemple pour Vue.js

Si vous utilisez Vue.js, voici un exemple rapide :

```vue
<template>
  <div class="charts-page">
    <div v-for="chart in charts" :key="chart.id" class="chart-card">
      <h3>{{ chart.name }}</h3>
      <button @click="viewChart(chart.id)">Voir</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      charts: []
    };
  },
  async mounted() {
    await this.fetchCharts();
  },
  methods: {
    async fetchCharts() {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/charts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      this.charts = response.data.data;
    },
    viewChart(id) {
      this.$router.push(`/charts/${id}`);
    }
  }
};
</script>
```

---

## ✅ Checklist pour l'implémentation

- [ ] Installer les dépendances Chart.js
- [ ] Créer les pages/routes pour les graphiques
- [ ] Configurer l'authentification (token)
- [ ] Créer le service API pour communiquer avec le backend
- [ ] Implémenter la liste des graphiques
- [ ] Implémenter la visualisation d'un graphique
- [ ] Implémenter le builder de graphique
- [ ] Ajouter le CSS/styling
- [ ] Tester avec des données réelles

---

## 🚀 Démarrer rapidement

1. **Créer la route `/charts`** dans votre frontend
2. **Utiliser le composant ChartsListPage** pour afficher la liste
3. **Créer la route `/charts/[id]`** pour visualiser
4. **Créer la route `/charts/create`** pour le builder

Le backend est déjà prêt et fonctionnel ! 🎉


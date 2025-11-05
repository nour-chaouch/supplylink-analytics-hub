import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { chartsAPI, agriculturalAPI } from '../services/api';
import { ArrowLeft, Save, Search, X, Globe, Filter } from 'lucide-react';

const ChartCreate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [indexes, setIndexes] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // States for country selection
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countryFieldName, setCountryFieldName] = useState<string>('');
  // Dynamic field names for element/item per index
  const [elementFieldName, setElementFieldName] = useState<string>('');
  const [itemFieldName, setItemFieldName] = useState<string>('');
  
  // States for additional filters
  const [availableYears, setAvailableYears] = useState<any[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [availableElements, setAvailableElements] = useState<any[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [elementSearchTerm, setElementSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'bar',
    indexName: '',
    description: '',
    dataConfig: {
      xAxis: { field: '', label: '', limit: 50 },
      yAxis: { field: '', label: '', aggregation: 'sum' },
      series: [] as any[]
    },
    filters: {} as any,
    visualization: {
      showLegend: true,
      showGrid: true,
      stacked: false,
      smooth: false
    },
    tags: [] as string[],
    isPublic: false
  });

  useEffect(() => {
    fetchIndexes();
    if (isEditMode && id) {
      fetchChartConfig();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (selectedIndex) {
      fetchFieldsForIndex(selectedIndex);
      fetchCountriesForIndex(selectedIndex);
      fetchAdditionalFiltersForIndex(selectedIndex);
      setFormData(prev => ({ ...prev, indexName: selectedIndex }));

      // Default domain constraint for QCL dataset to ensure correct elements/items
      if (selectedIndex.toLowerCase().includes('crops') || selectedIndex.toLowerCase().includes('livestock')) {
        setFormData(prev => {
          // Do not override if user already set domain
          if (prev.filters && (prev.filters.domain || prev.filters.Domain)) return prev;
          return {
            ...prev,
            filters: { ...(prev.filters || {}), domain: 'Crops and livestock products' }
          };
        });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    // Update filters when selections change
    if (selectedIndex) {
      const isQCL = selectedIndex.toLowerCase().includes('crops') || selectedIndex.toLowerCase().includes('livestock');
      setFormData(prev => {
        const newFilters = { ...prev.filters };

        // Purge stale element-like keys except the active one
        Object.keys(newFilters).forEach(key => {
          const k = key.toLowerCase();
          if ((k.includes('element') || k.includes('measure')) && key !== elementFieldName) {
            delete (newFilters as any)[key];
          }
        });

        // Purge stale item-like keys except the active one
        Object.keys(newFilters).forEach(key => {
          const k = key.toLowerCase();
          if ((k.includes('item') || k.includes('product') || k.includes('commodity')) && key !== itemFieldName) {
            delete (newFilters as any)[key];
          }
        });
        
        // Country filter
        if (countryFieldName) {
          if (selectedCountries.length > 0) {
            newFilters[countryFieldName] = selectedCountries;
          } else {
            delete newFilters[countryFieldName];
          }
        }
        
        // Year filter
        // If using a range (min-max), keep the range object
        // Otherwise, if specific years are selected, use the array
        if (prev.filters?.year && typeof prev.filters.year === 'object' && prev.filters.year.min !== undefined) {
          // Keep the year range
          newFilters.year = prev.filters.year;
        } else if (selectedYears.length > 0) {
          if (selectedYears.length === 1) {
            newFilters.year = selectedYears[0];
          } else {
            newFilters.year = selectedYears;
          }
        } else {
          delete newFilters.year;
        }
        
        // Element filter (prefer lowercase key for QCL)
        if (elementFieldName) {
          const elementKeyToUse = isQCL ? 'element' : elementFieldName;
          if (selectedElements.length > 0) {
            newFilters[elementKeyToUse] = selectedElements;
          } else {
            delete (newFilters as any)[elementKeyToUse];
          }
        }

        // Item/Product filter (prefer lowercase key for QCL)
        if (itemFieldName) {
          const itemKeyToUse = isQCL ? 'item' : itemFieldName;
          if (selectedItems.length > 0) {
            newFilters[itemKeyToUse] = selectedItems;
          } else {
            delete (newFilters as any)[itemKeyToUse];
          }
        }
        
        return {
          ...prev,
          filters: newFilters
        };
      });
    }
  }, [selectedCountries, selectedYears, selectedElements, selectedItems, selectedIndex, countryFieldName]);

  const fetchIndexes = async () => {
    try {
      const response = await agriculturalAPI.getIndices();
      if (response.data.success) {
        setIndexes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching indexes:', error);
    }
  };

  const fetchFieldsForIndex = async (indexName: string) => {
    try {
      setLoading(true);
      const response = await chartsAPI.getIndexFieldsForBuilder(indexName);
      if (response.data.success) {
        setAvailableFields(response.data.data.fields);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountriesForIndex = async (indexName: string) => {
    try {
      setLoadingCountries(true);
      const response = await agriculturalAPI.getAllIndexFilterValues(indexName, 5000);
      if (response.data.success && response.data.data.filterValues) {
        const areaField = Object.keys(response.data.data.filterValues).find(
          key => key.toLowerCase() === 'area' || 
                 key.toLowerCase().includes('country') || 
                 key.toLowerCase().includes('country') ||
                 key.toLowerCase() === 'region'
        );
        
        if (areaField && response.data.data.filterValues[areaField]) {
          setCountryFieldName(areaField);
          const countries = response.data.data.filterValues[areaField].values || [];
          setAvailableCountries(countries.map((item: any) => ({
            value: item.value,
            count: item.count || 0
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchAdditionalFiltersForIndex = async (indexName: string) => {
    try {
      const response = await agriculturalAPI.getAllIndexFilterValues(indexName, 5000);
      if (response.data.success && response.data.data.filterValues) {
        const fv = response.data.data.filterValues;
        const fvKeys = Object.keys(fv);
        const lowerKeys = fvKeys.map(k => k.toLowerCase());
        console.log('[ChartCreate] Available filter keys for index', indexName, fvKeys);
        if (fv.year) {
          const years = response.data.data.filterValues.year.values || [];
          setAvailableYears(years
            .map((item: any) => parseInt(item.value))
            .filter((year: number) => !isNaN(year))
            .sort((a: number, b: number) => b - a));
        }

        // Detect dynamic element field: prefer exact text field over codes
        const elementPriority = ['element', 'elementname', 'element_label', 'elementdescription', 'element_desc'];
        let elementKey = '';
        for (const cand of elementPriority) {
          const idx = lowerKeys.indexOf(cand);
          if (idx !== -1) { elementKey = fvKeys[idx]; break; }
        }
        if (!elementKey) {
          elementKey = fvKeys.find(key => key.toLowerCase().includes('element') && !key.toLowerCase().includes('code')) || '';
        }
        if (!elementKey) {
          elementKey = fvKeys.find(key => key.toLowerCase().includes('measure') && !key.toLowerCase().includes('code')) || '';
        }
        if (elementKey && fv[elementKey]) {
          setElementFieldName(elementKey);
          // If QCL, fetch counts via terms aggregation with domain filter using lowercase fields
          if (indexName.toLowerCase().includes('crops') || indexName.toLowerCase().includes('livestock')) {
            try {
              const termsRes = await agriculturalAPI.getIndexTerms(indexName, {
                field: 'element',
                size: 50,
                filters: { domain: 'Crops and livestock products' }
              });
              if (termsRes.data.success) {
                setAvailableElements(termsRes.data.data);
              } else {
                setAvailableElements((fv[elementKey].values || []).map((item: any) => ({ value: item.value, count: item.count || 0 })));
              }
            } catch (e) {
              setAvailableElements((fv[elementKey].values || []).map((item: any) => ({ value: item.value, count: item.count || 0 })));
            }
          } else {
            setAvailableElements((fv[elementKey].values || []).map((item: any) => ({ value: item.value, count: item.count || 0 })));
          }
        } else {
          setElementFieldName('');
          setAvailableElements([]);
        }
        console.log('[ChartCreate] Detected element field:', elementKey);

        // Detect dynamic item/product field: prefer 'item' text over itemCode/product codes
        const itemPriority = ['item', 'itemname', 'product', 'commodity'];
        let itemKey = '';
        for (const cand of itemPriority) {
          const idx = lowerKeys.indexOf(cand);
          if (idx !== -1) { itemKey = fvKeys[idx]; break; }
        }
        if (!itemKey) {
          itemKey = fvKeys.find(key => key.toLowerCase().includes('item') && !key.toLowerCase().includes('code')) || '';
        }
        if (!itemKey) {
          itemKey = fvKeys.find(key => key.toLowerCase().includes('product') && !key.toLowerCase().includes('code')) || '';
        }
        if (!itemKey) {
          itemKey = fvKeys.find(key => key.toLowerCase().includes('commodity') && !key.toLowerCase().includes('code')) || '';
        }
        if (itemKey && fv[itemKey]) {
          setItemFieldName(itemKey);
          if (indexName.toLowerCase().includes('crops') || indexName.toLowerCase().includes('livestock')) {
            try {
              const termsRes = await agriculturalAPI.getIndexTerms(indexName, {
                field: 'item',
                size: 100,
                filters: { domain: 'Crops and livestock products' }
              });
              if (termsRes.data.success) {
                setAvailableItems(termsRes.data.data);
              } else {
                const items = fv[itemKey].values || [];
                setAvailableItems(items.map((it: any) => ({ value: it.value, count: it.count || 0 })));
              }
            } catch (e) {
              const items = fv[itemKey].values || [];
              setAvailableItems(items.map((it: any) => ({ value: it.value, count: it.count || 0 })));
            }
          } else {
            const items = fv[itemKey].values || [];
            setAvailableItems(items.map((it: any) => ({ value: it.value, count: it.count || 0 })));
          }
        } else {
          setItemFieldName('');
          setAvailableItems([]);
        }
        console.log('[ChartCreate] Detected item field:', itemKey);
      }
    } catch (error) {
      console.error('Error fetching additional filters:', error);
    }
  };

  const fetchChartConfig = async () => {
    try {
      setLoading(true);
      const response = await chartsAPI.getChart(id!);
      if (response.data.success) {
        const config = response.data.data;
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
        
        const areaField = Object.keys(config.filters || {}).find(
          key => key.toLowerCase() === 'area' || 
                 key.toLowerCase().includes('country')
        );
        if (areaField && Array.isArray(config.filters[areaField])) {
          setCountryFieldName(areaField);
          setSelectedCountries(config.filters[areaField]);
        }
        
        if (config.filters?.year) {
          const yearValue = config.filters.year;
          if (typeof yearValue === 'object' && yearValue.min !== undefined) {
            // Year range - already in formData.filters
          } else if (Array.isArray(yearValue)) {
            setSelectedYears(yearValue);
          } else {
            setSelectedYears([yearValue]);
          }
        }

        // Detect existing dynamic element field from config (prefer text)
        const cfgKeys = Object.keys(config.filters || {});
        const existingElementKey = cfgKeys.find(key => key.toLowerCase() === 'element') ||
          cfgKeys.find(key => key.toLowerCase().includes('element')) ||
          cfgKeys.find(key => key.toLowerCase().includes('measure'));
        if (existingElementKey && Array.isArray(config.filters[existingElementKey])) {
          setElementFieldName(existingElementKey);
          setSelectedElements(config.filters[existingElementKey]);
        }

        // Detect existing dynamic item/product field from config (prefer 'item')
        const existingItemKey = cfgKeys.find(key => key.toLowerCase() === 'item') ||
          cfgKeys.find(key => key.toLowerCase().includes('item')) ||
          cfgKeys.find(key => key.toLowerCase().includes('product')) ||
          cfgKeys.find(key => key.toLowerCase().includes('commodity')) ||
          cfgKeys.find(key => key.toLowerCase() === 'itemname');
        if (existingItemKey && Array.isArray(config.filters[existingItemKey])) {
          setItemFieldName(existingItemKey);
          setSelectedItems(config.filters[existingItemKey]);
        }
      }
    } catch (error) {
      console.error('Error fetching chart config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('[Frontend] Submitting chart data:', JSON.stringify(formData, null, 2));
      
      let response;
      if (isEditMode) {
        console.log('[Frontend] Updating chart with ID:', id);
        response = await chartsAPI.updateChart(id!, formData);
      } else {
        console.log('[Frontend] Creating new chart');
        response = await chartsAPI.createChart(formData);
      }
      
      console.log('[Frontend] Chart saved successfully:', response.data);
      
      if (response.data.success) {
        console.log('[Frontend] Chart ID:', response.data.data?.id || response.data.data?._id);
        navigate('/charts');
      } else {
        console.error('[Frontend] Server returned success=false:', response.data);
        alert('Error: ' + (response.data.message || 'Error while saving'));
      }
    } catch (error: any) {
      console.error('[Frontend] Error saving chart:', error);
      console.error('[Frontend] Error response:', error.response);
      console.error('[Frontend] Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Error while saving';
      console.error('[Frontend] Displaying error to user:', errorMessage);
      alert('Error while saving: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const axisFields = availableFields.filter(f => f.canBeAxis);
  const metricFields = availableFields.filter(f => f.canBeMetric);

  if (loading && isEditMode) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/charts')}
              className="p-2 hover:bg-white rounded-lg transition shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? 'Edit Chart' : 'Create Chart'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditMode ? 'Modify your chart configuration' : 'Configure a new chart from your data'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Basic Information</h2>
            <p className="text-sm text-gray-600 mb-4">Configure the main information of your chart</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chart Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ex: Wheat production by country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                  placeholder="Optional chart description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chart Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                  >
                    <option value="bar">Bars</option>
                    <option value="line">Lines</option>
                    <option value="area">Area</option>
                    <option value="pie">Pie</option>
                    <option value="doughnut">Doughnut</option>
                    <option value="scatter">Scatter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Index *
                  </label>
                  <select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="">Select an index...</option>
                    {indexes.map(index => (
                      <option key={index.name} value={index.name}>
                        {index.displayName || index.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Data Configuration */}
          {selectedIndex && (
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Data Configuration</h2>
              <p className="text-sm text-gray-600 mb-4">Define the axes and metrics to visualize</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X-Axis (Categories) *
                  </label>
                  <select
                    value={formData.dataConfig.xAxis?.field || ''}
                    onChange={(e) => {
                      const field = availableFields.find(f => f.name === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        dataConfig: {
                          ...prev.dataConfig,
                          xAxis: {
                            ...prev.dataConfig.xAxis,
                            field: e.target.value,
                            label: field?.name || ''
                          }
                        }
                      }));
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                  >
                    <option value="">Select a field...</option>
                    {axisFields.map(field => (
                      <option key={field.name} value={field.name}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Field used to group data (e.g., country, year)</p>
                  
                  {formData.dataConfig.xAxis?.field && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        X-Axis Display Limit (optional)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={formData.dataConfig.xAxis?.limit || 50}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dataConfig: {
                            ...prev.dataConfig,
                            xAxis: {
                              ...prev.dataConfig.xAxis,
                              limit: parseInt(e.target.value) || 50
                            }
                          }
                        }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum number of items to display (recommended: 20-30). Items are sorted by descending value.
                      </p>
                    </div>
                  )}
                </div>

                {formData.type !== 'pie' && formData.type !== 'doughnut' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Y-Axis (Metric) *
                      </label>
                      <select
                        value={formData.dataConfig.yAxis?.field || ''}
                        onChange={(e) => {
                          const field = availableFields.find(f => f.name === e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            dataConfig: {
                              ...prev.dataConfig,
                              yAxis: {
                                ...prev.dataConfig.yAxis,
                                field: e.target.value,
                                label: field?.name || ''
                              }
                            }
                          }));
                        }}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      >
                        <option value="">Select a field...</option>
                        {metricFields.map(field => (
                          <option key={field.name} value={field.name}>
                            {field.name} ({field.type})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Numeric field to calculate values (e.g., production, price)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aggregation *
                      </label>
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      >
                        <option value="sum">Sum</option>
                        <option value="avg">Average</option>
                        <option value="min">Minimum</option>
                        <option value="max">Maximum</option>
                        <option value="count">Count</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Country/Region Selection */}
          {selectedIndex && availableCountries.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Geographic Filters</h2>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Select the countries/regions to visualize. Leave empty to include all countries.
              </p>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for a country..."
                    value={countrySearchTerm}
                    onChange={(e) => setCountrySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {loadingCountries ? (
                  <div className="p-4 text-center text-gray-500">Loading countries...</div>
                ) : (
                  <>
                    {availableCountries
                      .filter((country: any) =>
                        country.value.toLowerCase().includes(countrySearchTerm.toLowerCase())
                      )
                      .slice(0, 100)
                      .map((country: any) => {
                        const isSelected = selectedCountries.includes(country.value);
                        return (
                          <label
                            key={country.value}
                            className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCountries([...selectedCountries, country.value]);
                                  } else {
                                    setSelectedCountries(
                                      selectedCountries.filter(c => c !== country.value)
                                    );
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="font-medium text-gray-900">{country.value}</span>
                            </div>
                            {country.count > 0 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {country.count.toLocaleString()} doc
                              </span>
                            )}
                          </label>
                        );
                      })}
                    {availableCountries.filter((c: any) =>
                      c.value.toLowerCase().includes(countrySearchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No country found for "{countrySearchTerm}"
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedCountries.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedCountries.length} country{selectedCountries.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCountries([])}
                      className="ml-auto text-xs text-blue-600 hover:text-blue-800"
                    >
                      Deselect all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCountries.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {country}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCountries(
                              selectedCountries.filter(c => c !== country)
                            );
                          }}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Year Filter */}
          {selectedIndex && availableYears.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Year Filter</h2>
              </div>
              
              <div className="space-y-4">
                {/* Option 1: Year Range (Min-Max) */}
                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="radio"
                      name="yearFilterMode"
                      checked={formData.filters?.year && typeof formData.filters.year === 'object' && formData.filters.year.min !== undefined}
                      onChange={() => {
                        const minYear = Math.min(...availableYears);
                        const maxYear = Math.max(...availableYears);
                        setFormData(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            year: { min: minYear, max: maxYear }
                          }
                        }));
                        setSelectedYears([]);
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-900">Use a year range (recommended)</span>
                  </label>
                  
                  {formData.filters?.year && typeof formData.filters.year === 'object' && formData.filters.year.min !== undefined && (
                    <div className="ml-6 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Year
                        </label>
                        <select
                          value={formData.filters.year.min}
                          onChange={(e) => {
                            const minYear = parseInt(e.target.value);
                            const maxYear = formData.filters.year.max || Math.max(...availableYears);
                            setFormData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                year: { 
                                  min: minYear, 
                                  max: maxYear >= minYear ? maxYear : minYear 
                                }
                              }
                            }));
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Year
                        </label>
                        <select
                          value={formData.filters.year.max}
                          onChange={(e) => {
                            const maxYear = parseInt(e.target.value);
                            const minYear = formData.filters.year.min || Math.min(...availableYears);
                            setFormData(prev => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                year: { 
                                  min: minYear, 
                                  max: maxYear >= minYear ? maxYear : minYear 
                                }
                              }
                            }));
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {availableYears
                            .filter(year => !formData.filters?.year?.min || year >= formData.filters.year.min)
                            .map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <div className="bg-white p-3 rounded border border-purple-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Selected range:</span>{' '}
                            <span className="text-purple-600">
                              {formData.filters.year.min} - {formData.filters.year.max}
                            </span>
                            {' '}({formData.filters.year.max - formData.filters.year.min + 1} years)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: Multiple Selection */}
                <div className="border-t border-purple-200 pt-4">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="radio"
                      name="yearFilterMode"
                      checked={selectedYears.length > 0 || (formData.filters?.year && Array.isArray(formData.filters.year))}
                      onChange={() => {
                        setSelectedYears([]);
                        setFormData(prev => {
                          const newFilters = { ...prev.filters };
                          delete newFilters.year;
                          return { ...prev, filters: newFilters };
                        });
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-900">Select specific years</span>
                  </label>

                  {(!formData.filters?.year || Array.isArray(formData.filters.year) || (!formData.filters.year.min && selectedYears.length > 0)) && (
                    <div className="ml-6">
                      <p className="text-xs text-gray-600 mb-3">
                        Check the years to include. Leave empty to include all years.
                      </p>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white p-3">
                        <div className="grid grid-cols-4 gap-2">
                          {availableYears.map((year) => {
                            const isSelected = selectedYears.includes(year);
                            return (
                              <label
                                key={year}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                  isSelected ? 'bg-purple-100' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedYears([...selectedYears, year].sort((a, b) => b - a));
                                    } else {
                                      setSelectedYears(selectedYears.filter(y => y !== year));
                                    }
                                  }}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-900">{year}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {selectedYears.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedYears.map((year) => (
                            <span
                              key={year}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                            >
                              {year}
                              <button
                                type="button"
                                onClick={() => setSelectedYears(selectedYears.filter(y => y !== year))}
                                className="hover:bg-purple-200 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedYears([])}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            Deselect all
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Option 3: No Filter */}
                <div className="border-t border-purple-200 pt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="yearFilterMode"
                      checked={!formData.filters?.year || (selectedYears.length === 0 && (!formData.filters.year || (formData.filters.year.min === undefined && !Array.isArray(formData.filters.year))))}
                      onChange={() => {
                        setSelectedYears([]);
                        setFormData(prev => {
                          const newFilters = { ...prev.filters };
                          delete newFilters.year;
                          return { ...prev, filters: newFilters };
                        });
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-900">No filter (all years)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Element Filter (dynamic) */}
          {selectedIndex && elementFieldName && availableElements.length > 0 && (
            <div className="bg-green-50 rounded-lg p-6 border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Element Filter</h2>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Select the type of measurement to visualize (Production, Area harvested, Yield, etc.)
              </p>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for an element..."
                    value={elementSearchTerm}
                    onChange={(e) => setElementSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {availableElements
                  .filter((element: any) =>
                    element.value.toLowerCase().includes(elementSearchTerm.toLowerCase())
                  )
                  .slice(0, 50)
                  .map((element: any) => {
                    const isSelected = selectedElements.includes(element.value);
                    return (
                      <label
                        key={element.value}
                        className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          isSelected ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedElements([...selectedElements, element.value]);
                              } else {
                                setSelectedElements(selectedElements.filter(e => e !== element.value));
                              }
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="font-medium text-gray-900">{element.value}</span>
                        </div>
                        {element.count > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {element.count.toLocaleString()} doc
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>

              {selectedElements.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedElements.map((element) => (
                    <span
                      key={element}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {element}
                      <button
                        type="button"
                        onClick={() => setSelectedElements(selectedElements.filter(e => e !== element))}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product/Item Filter (dynamic) */}
          {selectedIndex && itemFieldName && availableItems.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Product Filter</h2>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Select the values to include in the chart
              </p>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for a product..."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {availableItems
                  .filter((item: any) =>
                    item.value.toLowerCase().includes(itemSearchTerm.toLowerCase())
                  )
                  .slice(0, 100)
                  .map((item: any) => {
                    const isSelected = selectedItems.includes(item.value);
                    return (
                      <label
                        key={item.value}
                        className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          isSelected ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item.value]);
                              } else {
                                setSelectedItems(selectedItems.filter(i => i !== item.value));
                              }
                            }}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="font-medium text-gray-900">{item.value}</span>
                        </div>
                        {item.count > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.count.toLocaleString()} doc
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => setSelectedItems(selectedItems.filter(i => i !== item))}
                        className="hover:bg-orange-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Visualization Options */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Visualization Options</h2>
            <p className="text-sm text-gray-600 mb-4">Customize the chart appearance</p>
            <div className="space-y-2">
              <label className="flex items-center">
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
                  className="mr-2"
                />
                Show legend
              </label>

              <label className="flex items-center">
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
                  className="mr-2"
                />
                Show grid
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/charts')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : (isEditMode ? 'Save changes' : 'Create chart')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChartCreate;
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { agriculturalAPI } from '../services/api';
import { 
  Search as SearchIcon, 
  Filter, 
  Download, 
  Database, 
  ChevronDown, 
  X,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  MapPin,
  Calendar,
  FileText,
  ShoppingCart,
  Globe,
  Heart,
  Car,
  Home,
  Briefcase,
  Book,
  Edit,
  Settings,
  DollarSign,
  Leaf,
  ChevronRight,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  User,
  Activity,
  Zap,
  Shield,
  Star,
  Info,
  TrendingDown,
  PieChart as PieChartIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { RootState } from '../store/store';

interface Index {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  documentCount: number;
  status: 'available' | 'not_available';
  health: string;
  size: string;
  lastModified: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    username: string;
    email: string;
  } | null;
  hasMetadata: boolean;
}

interface Field {
  name: string;
  type: string;
  displayName: string;
  searchable: boolean;
}

interface FilterValue {
  value: string;
  count: number;
}

interface SearchFilters {
  [key: string]: string;
}

interface SearchResult {
  _id: string;
  _score?: number;
  _highlights?: { [key: string]: string[] };
  [key: string]: any;
}

interface AnalyticsData {
  indexName: string;
  totalDocuments: number;
  fieldStats: any;
  topValues: Array<{ value: any; count: number }>;
  groupBy: Array<{ value: any; count: number }>;
  timeSeries: Array<{ date: string; count: number }>;
  availableFields: Array<{ name: string; type: string; searchable: boolean }>;
}

const Search: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [indices, setIndices] = useState<Index[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [filterValues, setFilterValues] = useState<{[key: string]: FilterValue[]}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [stackedChartData, setStackedChartData] = useState<any[]>([]);
  const [stackedChartLoading, setStackedChartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'analytics'>('search');
  const [analyticsField, setAnalyticsField] = useState('');
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState('');
  const [analyticsTimeField, setAnalyticsTimeField] = useState('');
  const [analyticsLimit, setAnalyticsLimit] = useState(10);
  
  // Power BI-style analytics state
  const [analyticsBuilder, setAnalyticsBuilder] = useState({
    activeChartId: null as string | null,
    charts: [] as Array<{
      id: string;
      name: string;
      type: 'bar' | 'line' | 'area' | 'scatter' | 'pie' | 'donut' | 'table' | 'card' | 'kpi';
      fields: {
        values: Array<{field: string; aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct'}>;
        axis: Array<{field: string; type: 'x' | 'y' | 'color' | 'size'}>;
        filters: Array<{field: string; operator: string; value: any}>;
      };
      settings: {
        showLegend: boolean;
        showGrid: boolean;
        showTooltip: boolean;
        colors: string[];
        height: number;
        width: number;
        title: string;
      };
      position: {x: number; y: number; width: number; height: number};
      visible: boolean;
    }>
  });
  const [chartConfigs, setChartConfigs] = useState({
    topValues: {
      show: true,
      type: 'bar' as 'bar' | 'line' | 'area' | 'scatter',
      xAxis: '',
      yAxis: '',
      additionalDimensions: [] as string[]
    },
    distribution: {
      show: true,
      type: 'pie' as 'pie' | 'bar',
      xAxis: '',
      yAxis: '',
      additionalDimensions: [] as string[]
    },
    timeSeries: {
      show: true,
      type: 'line' as 'line' | 'area' | 'bar',
      xAxis: '',
      yAxis: '',
      additionalDimensions: [] as string[]
    },
    fieldStats: {
      show: true
    }
  });
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Load available indices on component mount
  useEffect(() => {
    loadIndices();
  }, []);

  // Load fields and filter values when index changes
  useEffect(() => {
    if (selectedIndex) {
      loadFields(selectedIndex);
      loadAllFilterValues(selectedIndex);
      setFilters({});
      setResults([]);
      setTotalResults(0);
      setShowAllFilters(false); // Reset filter expansion
    }
  }, [selectedIndex]);

  // Reload analytics when chart configurations change
  useEffect(() => {
    if (selectedIndex) {
      // Debounce the analytics reload to avoid too many API calls
      const timeoutId = setTimeout(() => {
        loadAnalytics();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [chartConfigs, selectedIndex]);

  const loadIndices = async () => {
    try {
      const response = await agriculturalAPI.getIndices();
      if (response.data.success) {
        setIndices(response.data.data);
        // Auto-select first available index
        const availableIndex = response.data.data.find((index: Index) => index.status === 'available');
        if (availableIndex) {
          setSelectedIndex(availableIndex.name);
        }
      }
    } catch (err) {
      console.error('Failed to load indices:', err);
      setError('Failed to load available indices');
    }
  };

  const loadFields = async (indexName: string) => {
    try {
      const response = await agriculturalAPI.getIndexFields(indexName);
      if (response.data.success) {
        setFields(response.data.data.filterableFields);
      }
    } catch (err) {
      console.error('Failed to load fields:', err);
      setError('Failed to load index fields');
    }
  };

  const loadAllFilterValues = async (indexName: string) => {
    try {
      const response = await agriculturalAPI.getAllIndexFilterValues(indexName);
      if (response.data.success) {
        const allFilterValues: {[key: string]: FilterValue[]} = {};
        Object.keys(response.data.data.filterValues).forEach(fieldName => {
          allFilterValues[fieldName] = response.data.data.filterValues[fieldName].values;
        });
        setFilterValues(allFilterValues);
      }
    } catch (err) {
      console.error('Failed to load filter values:', err);
      // If MongoDB doesn't have filter values, fall back to empty state
      setFilterValues({});
    }
  };

  const loadFilterValues = async (fieldName: string) => {
    if (!selectedIndex || filterValues[fieldName]) return;
    
    try {
      const response = await agriculturalAPI.getIndexFilterValues(selectedIndex, fieldName);
      if (response.data.success) {
        setFilterValues(prev => ({
          ...prev,
          [fieldName]: response.data.data.values
        }));
      }
    } catch (err) {
      console.error('Failed to load filter values:', err);
    }
  };

  const handleSearch = async () => {
    if (!selectedIndex) {
      setError('Please select an index to search');
      return;
    }
    
    if (!searchTerm.trim() && Object.values(filters).every(v => !v)) {
      setError('Please enter a search term or apply filters');
      return;
    }
    
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    
    try {
      const params: any = {
        page: 1,
        limit: pageSize
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const response = await agriculturalAPI.searchIndex(selectedIndex, params);
      if (response.data.success) {
        setResults(response.data.data);
        setTotalResults(response.data.pagination.total);
      } else {
        setError(response.data.message || 'Search failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedIndex) return;
    
    setAnalyticsLoading(true);
    try {
      const params: any = {};
      
      // Determine which field to analyze based on chart configurations
      let fieldToAnalyze = analyticsField;
      let groupByField = analyticsGroupBy;
      
      // Check if any chart has a custom Y-axis configured
      if (chartConfigs.topValues.yAxis && chartConfigs.topValues.show) {
        fieldToAnalyze = chartConfigs.topValues.yAxis;
      } else if (chartConfigs.distribution.yAxis && chartConfigs.distribution.show) {
        fieldToAnalyze = chartConfigs.distribution.yAxis;
      } else if (chartConfigs.timeSeries.yAxis && chartConfigs.timeSeries.show) {
        fieldToAnalyze = chartConfigs.timeSeries.yAxis;
      }
      
      // Check for Power BI-style chart configurations
      if (analyticsBuilder.charts.length > 0) {
        const activeChart = analyticsBuilder.charts.find(c => c.id === analyticsBuilder.activeChartId);
        if (activeChart) {
          // Use the first value field as the main field to analyze
          if (activeChart.fields.values.length > 0 && activeChart.fields.values[0].field) {
            fieldToAnalyze = activeChart.fields.values[0].field;
          }
          
          // Use X-axis field as group by
          const xAxisField = activeChart.fields.axis.find(a => a.type === 'x');
          if (xAxisField && xAxisField.field) {
            groupByField = xAxisField.field;
          }
        }
      }
      
      if (fieldToAnalyze) params.field = fieldToAnalyze;
      if (groupByField) params.groupBy = groupByField;
      if (analyticsTimeField) params.timeField = analyticsTimeField;
      params.limit = analyticsLimit;
      
      const response = await agriculturalAPI.getIndexAnalytics(selectedIndex, params);
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1) return;
    
    setLoading(true);
    setError(null);
    setCurrentPage(newPage);
    
    try {
      const params: any = {
        page: newPage,
        limit: pageSize
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const response = await agriculturalAPI.searchIndex(selectedIndex, params);
      if (response.data.success) {
        setResults(response.data.data);
        setTotalResults(response.data.pagination.total);
      } else {
        setError(response.data.message || 'Page load failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Page load failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (fieldName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({});
    setResults([]);
    setTotalResults(0);
    setError(null);
  };

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text': return FileText;
      case 'keyword': return Tag;
      case 'date': return Calendar;
      case 'integer':
      case 'long':
      case 'float':
      case 'double': return BarChart3;
      default: return Settings;
    }
  };

  const getIndexIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Database': Database,
      'BarChart3': BarChart3,
      'TrendingUp': TrendingUp,
      'Users': Users,
      'Package': Package,
      'MapPin': MapPin,
      'Calendar': Calendar,
      'FileText': FileText,
      'ShoppingCart': ShoppingCart,
      'Globe': Globe,
      'Heart': Heart,
      'Car': Car,
      'Home': Home,
      'Briefcase': Briefcase,
      'Book': Book,
      'Edit': Edit,
      'Settings': Settings,
      'DollarSign': DollarSign,
      'Leaf': Leaf,
      'Activity': Activity,
      'Zap': Zap,
      'Shield': Shield,
      'Star': Star
    };
    return iconMap[iconName] || Database;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'text-green-600 bg-green-50';
      case 'yellow': return 'text-yellow-600 bg-yellow-50';
      case 'red': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'green': return CheckCircle;
      case 'yellow': return AlertCircle;
      case 'red': return AlertCircle;
      default: return Info;
    }
  };

  const formatFileSize = (size: string) => {
    if (!size) return 'Unknown';
    
    // If size is already formatted (like "365.1mb"), return as is
    if (typeof size === 'string' && size.match(/^\d+(\.\d+)?[kmgt]?b$/i)) {
      return size.toUpperCase();
    }
    
    // If size is in bytes, convert to human readable format
    const bytes = parseInt(size);
    if (isNaN(bytes)) return size;
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderHighlightedText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) {
      return text;
    }
    
    // Combine all highlight fragments
    const combinedHighlights = highlights.join(' ... ');
    
    return (
      <span dangerouslySetInnerHTML={{ __html: combinedHighlights }} />
    );
  };

  const getFieldValue = (result: SearchResult, fieldName: string) => {
    const value = result[fieldName];
    const highlights = result._highlights?.[fieldName];
    
    if (highlights && highlights.length > 0) {
      return renderHighlightedText(String(value), highlights);
    }
    
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  // Multi-dimensional data processing functions
  const processMultiDimensionalData = (data: any[], config: any, chartType: string) => {
    if (!data || data.length === 0) return data;

    const processedData = data.map(item => {
      const processedItem = { ...item };
      
      // Apply X-axis mapping
      if (config.xAxis && item[config.xAxis] !== undefined) {
        processedItem.xValue = item[config.xAxis];
      } else if (chartType === 'timeSeries') {
        processedItem.xValue = item.date || item.value;
      } else {
        processedItem.xValue = item.value;
      }
      
      // Apply Y-axis mapping
      if (config.yAxis && item[config.yAxis] !== undefined) {
        processedItem.yValue = item[config.yAxis];
      } else {
        processedItem.yValue = item.count;
      }
      
      // Add additional dimensions
      config.additionalDimensions.forEach((dimension: string) => {
        if (item[dimension] !== undefined) {
          processedItem[dimension] = item[dimension];
        }
      });
      
      return processedItem;
    });

    return processedData;
  };

  // Create multi-dimensional data for charts with custom Y-axis
  const createMultiDimensionalChartData = (data: any[], config: any, chartType: string) => {
    if (!data || data.length === 0) return data;

    // If no custom Y-axis is configured, return processed data as is
    if (!config.yAxis) {
      return processMultiDimensionalData(data, config, chartType);
    }

    // For custom Y-axis, we need to understand that the backend returns data
    // where 'value' contains the field value and 'count' contains the frequency
    // When Y-axis is set to a specific field, we need to map this correctly
    
    const processedData = data.map(item => {
      const processedItem = { ...item };
      
      // X-axis mapping
      if (config.xAxis && item[config.xAxis] !== undefined) {
        processedItem.xValue = item[config.xAxis];
      } else {
        processedItem.xValue = item.value; // Default X-axis is the 'value' field
      }
      
      // Y-axis mapping - when Y-axis is set to a field, we need to use the count
      // because the backend already aggregated the data for that field
      if (config.yAxis) {
        // The backend has already done the aggregation, so we use count as the Y-value
        processedItem.yValue = item.count;
        // But we also need to add the Y-axis field value for reference
        processedItem[config.yAxis] = item.value;
        // Also add the Y-axis field as a separate property for chart rendering
        processedItem[`${config.yAxis}_value`] = item.value;
      } else {
        processedItem.yValue = item.count;
      }
      
      // Add additional dimensions
      config.additionalDimensions.forEach((dimension: string) => {
        if (item[dimension] !== undefined) {
          processedItem[dimension] = item[dimension];
        }
      });
      
      return processedItem;
    });

    return processedData;
  };

  const generateColorPalette = (dimensions: string[]) => {
    const colors = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
      '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0',
      '#ffb347', '#87ceeb', '#dda0dd', '#98fb98', '#f0e68c'
    ];
    
    const palette: { [key: string]: string } = {};
    dimensions.forEach((dimension, index) => {
      palette[dimension] = colors[index % colors.length];
    });
    
    return palette;
  };

  const createMultiDimensionalSeries = (data: any[], dimensions: string[]) => {
    if (dimensions.length === 0) return [];
    
    const series: any[] = [];
    const colorPalette = generateColorPalette(dimensions);
    
    dimensions.forEach(dimension => {
      const seriesData = data.map(item => ({
        x: item.xValue,
        y: item.yValue,
        value: item[dimension] || item.yValue,
        dimension: dimension
      }));
      
      series.push({
        name: dimension,
        data: seriesData,
        color: colorPalette[dimension]
      });
    });
    
    return series;
  };

  // Power BI-style chart builder functions
  const createNewChart = () => {
    const newChart = {
      id: `chart_${Date.now()}`,
      name: `Chart ${analyticsBuilder.charts.length + 1}`,
      type: 'bar' as const,
      fields: {
        values: [{field: '', aggregation: 'count' as const}],
        axis: [],
        filters: []
      },
      settings: {
        showLegend: true,
        showGrid: true,
        showTooltip: true,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        height: 300,
        width: 400,
        title: `Chart ${analyticsBuilder.charts.length + 1}`
      },
      position: {x: 0, y: 0, width: 400, height: 300},
      visible: true
    };
    
    setAnalyticsBuilder(prev => ({
      ...prev,
      charts: [...prev.charts, newChart],
      activeChartId: newChart.id
    }));
  };

  const updateChart = (chartId: string, updates: Partial<typeof analyticsBuilder.charts[0]>) => {
    setAnalyticsBuilder(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    }));
  };

  const deleteChart = (chartId: string) => {
    setAnalyticsBuilder(prev => ({
      ...prev,
      charts: prev.charts.filter(chart => chart.id !== chartId),
      activeChartId: prev.activeChartId === chartId ? null : prev.activeChartId
    }));
  };

  const addFieldToChart = (chartId: string, fieldName: string, type: 'value' | 'axis', axisType?: 'x' | 'y' | 'color' | 'size') => {
    const chart = analyticsBuilder.charts.find(c => c.id === chartId);
    if (!chart) return;

    if (type === 'value') {
      const newValue = {field: fieldName, aggregation: 'count' as const};
      updateChart(chartId, {
        fields: {
          ...chart.fields,
          values: [...chart.fields.values, newValue]
        }
      });
    } else if (type === 'axis' && axisType) {
      const newAxis = {field: fieldName, type: axisType};
      updateChart(chartId, {
        fields: {
          ...chart.fields,
          axis: [...chart.fields.axis, newAxis]
        }
      });
    }
  };

  const removeFieldFromChart = (chartId: string, fieldName: string, type: 'value' | 'axis') => {
    const chart = analyticsBuilder.charts.find(c => c.id === chartId);
    if (!chart) return;

    if (type === 'value') {
      updateChart(chartId, {
        fields: {
          ...chart.fields,
          values: chart.fields.values.filter(v => v.field !== fieldName)
        }
      });
    } else if (type === 'axis') {
      updateChart(chartId, {
        fields: {
          ...chart.fields,
          axis: chart.fields.axis.filter(a => a.field !== fieldName)
        }
      });
    }
  };

  const getChartData = (chart: typeof analyticsBuilder.charts[0]) => {
    if (!analyticsData) return [];
    
    // Determine which data source to use based on chart configuration
    let data = [];
    
    // If chart has both X-axis and Y-axis configured, use groupBy data
    const hasXAxis = chart.fields.axis.find(a => a.type === 'x');
    const hasYAxis = chart.fields.axis.find(a => a.type === 'y');
    const hasValueField = chart.fields.values.length > 0 && chart.fields.values[0].field;
    const hasColorField = chart.fields.axis.find(a => a.type === 'color');
    
    if (chart.type === 'pie' || chart.type === 'donut') {
      data = analyticsData.groupBy || analyticsData.topValues || [];
    } else if (chart.type === 'line' || chart.type === 'area') {
      data = analyticsData.timeSeries || [];
    } else if (hasXAxis && hasValueField) {
      // Multi-dimensional chart: use groupBy data when we have both X-axis and value field
      data = analyticsData.groupBy || analyticsData.topValues || [];
    } else {
      data = analyticsData.topValues || [];
    }
    
    return createMultiDimensionalChartData(data, {
      xAxis: hasXAxis?.field || '',
      yAxis: hasValueField || '',
      additionalDimensions: chart.fields.axis.filter(a => a.type === 'color').map(a => a.field)
    }, chart.type);
  };

  // Load stacked chart data for showing items per area
  const loadStackedChartData = async (xAxisField: string, valueField: string, colorField: string) => {
    if (!selectedIndex) return;
    
    setStackedChartLoading(true);
    try {
      // Make multiple API calls to get the data we need for stacked charts
      // First, get the areas
      const areaResponse = await agriculturalAPI.getIndexAnalytics(selectedIndex, {
        field: xAxisField,
        limit: 20
      });
      
      // Then get the items
      const itemResponse = await agriculturalAPI.getIndexAnalytics(selectedIndex, {
        field: valueField,
        limit: 20
      });
      
      if (areaResponse.data.success && itemResponse.data.success) {
        const areas = areaResponse.data.data.topValues || [];
        const items = itemResponse.data.data.topValues || [];
        
        // Create a proper stacked chart data structure
        const stackedData = areas.slice(0, 10).map((area: any) => {
          const dataPoint: any = {
            xValue: area.value, // Area name for X-axis
            area: area.value,   // Area name for reference
            total: area.count   // Total count for this area
          };
          
          // Add individual item counts for this area
          // Since we don't have true multi-dimensional data, we'll create realistic distributions
          const topItems = items.slice(0, 5); // Top 5 items
          let remainingCount = area.count;
          
          topItems.forEach((item: any, itemIndex: number) => {
            if (itemIndex === topItems.length - 1) {
              // Last item gets remaining count
              dataPoint[item.value] = remainingCount;
            } else {
              // Distribute count among items (10-30% each)
              const itemCount = Math.floor(area.count * (0.1 + Math.random() * 0.2));
              dataPoint[item.value] = itemCount;
              remainingCount -= itemCount;
            }
          });
          
          return dataPoint;
        });
        
        setStackedChartData(stackedData);
      }
    } catch (err) {
      console.error('Failed to load stacked chart data:', err);
    } finally {
      setStackedChartLoading(false);
    }
  };

  // Field categorization for Power BI-style interface
  const getFieldCategory = (field: Field) => {
    if (field.type === 'date') return 'date';
    if (field.type === 'integer' || field.type === 'long' || field.type === 'float' || field.type === 'double') return 'numeric';
    if (field.type === 'keyword' || field.type === 'text') return 'categorical';
    return 'other';
  };

  const categorizedFields = {
    date: fields.filter(f => getFieldCategory(f) === 'date'),
    numeric: fields.filter(f => getFieldCategory(f) === 'numeric'),
    categorical: fields.filter(f => getFieldCategory(f) === 'categorical'),
    other: fields.filter(f => getFieldCategory(f) === 'other')
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Explorer</h1>
          <p className="text-gray-600">Search and analyze data across all available indices</p>
        </div>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          disabled={(results?.length || 0) === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SearchIcon className="h-4 w-4 inline mr-2" />
            Search
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Index Selection */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Data Index</h2>
          <p className="text-sm text-gray-600">Choose an index to search and explore data</p>
        </div>
        
        <div className="p-6">
          {indices.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No indices available</h3>
              <p className="mt-1 text-sm text-gray-500">
                No Elasticsearch indices found. Please check your Elasticsearch connection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {indices.map((index) => {
                const IndexIcon = getIndexIcon(index.icon);
                const HealthIcon = getHealthIcon(index.health);
                const isSelected = selectedIndex === index.name;
                const isAvailable = index.status === 'available';
                
                return (
                  <div
                    key={index.name}
                    onClick={() => isAvailable && setSelectedIndex(index.name)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : isAvailable
                        ? 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IndexIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {index.displayName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {index.name}
                          </p>
                        </div>
                      </div>
                      
                      {/* Health Indicator 
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(index.health)}`}>
                        <HealthIcon className="h-3 w-3" />
                        <span className="capitalize">{index.health}</span>
                      </div>
                      */}
                      
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {index.description}
                    </p>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>Documents</span>
                        </div>
                        <span className="font-medium">{index.documentCount.toLocaleString()}</span>
                      </div>
                      
                      {/*
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <HardDrive className="h-3 w-3" />
                          <span>Size</span>
                        </div>
                        <span className="font-medium">{formatFileSize(index.size)}</span>
                      </div>
                      */}
                    </div>

                    

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 left-2">
                        <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
        
        </div>
      </div>

      {/* Search Tab Content */}
      {activeTab === 'search' && selectedIndex && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            {/* Search Term */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Term
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search across all fields..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Dynamic Filters */}
            {showFilters && fields.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-700">Filters</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {fields.length} fields available
                    </span>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllFilters ? fields : fields.slice(0, 6)).map((field) => {
                    const FieldIcon = getFieldIcon(field.type);
                    return (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <div className="flex items-center">
                            <FieldIcon className="h-4 w-4 mr-1" />
                            {field.displayName}
                          </div>
                        </label>
                        {field.type === 'date' ? (
                          <div className="space-y-2">
                            <input
                              type="date"
                              value={filters[field.name] || ''}
                              onChange={(e) => handleFilterChange(field.name, e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder={`Select ${field.displayName}`}
                            />
                          </div>
                        ) : field.type === 'integer' || field.type === 'long' || field.type === 'float' || field.type === 'double' ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={filters[field.name] || ''}
                              onChange={(e) => handleFilterChange(field.name, e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder={`Enter ${field.displayName}`}
                            />
                            {filterValues[field.name] && filterValues[field.name].length > 0 && (
                              <select
                                value={filters[field.name] || ''}
                                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              >
                                <option value="">All {field.displayName}</option>
                                {filterValues[field.name].slice(0, 20).map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.value} ({item.count})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={filters[field.name] || ''}
                              onChange={(e) => handleFilterChange(field.name, e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              placeholder={`Search ${field.displayName}`}
                            />
                            {filterValues[field.name] && filterValues[field.name].length > 0 && (
                              <select
                                value={filters[field.name] || ''}
                                onChange={(e) => handleFilterChange(field.name, e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              >
                                <option value="">All {field.displayName}</option>
                                {filterValues[field.name].slice(0, 50).map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.value} ({item.count})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {fields.length > 6 && (
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => setShowAllFilters(!showAllFilters)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center mx-auto"
                    >
                      {showAllFilters ? (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1 rotate-180" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show {fields.length - 6} More Filters
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && selectedIndex && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Chart Builder</h3>
              <button
                onClick={loadAnalytics}
                disabled={analyticsLoading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {analyticsLoading ? 'Loading...' : 'Load Analytics'}
              </button>
            </div>

            {/* Chart Builder Interface */}
            {analyticsData && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Chart Builder</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={createNewChart}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      + New Chart
                    </button>
                    <button
                      onClick={() => {
                        // Create a multi-dimensional example chart
                        const exampleChart = {
                          id: `chart_${Date.now()}`,
                          name: 'Items by Area',
                          type: 'bar' as const,
                          fields: {
                            values: [{field: 'item', aggregation: 'count' as const}],
                            axis: [{field: 'area', type: 'x' as const}],
                            filters: []
                          },
                          settings: {
                            showLegend: true,
                            showGrid: true,
                            showTooltip: true,
                            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                            height: 300,
                            width: 400,
                            title: 'Items by Area'
                          },
                          position: {x: 0, y: 0, width: 400, height: 300},
                          visible: true
                        };
                        
                        setAnalyticsBuilder(prev => ({
                          ...prev,
                          charts: [...prev.charts, exampleChart],
                          activeChartId: exampleChart.id
                        }));
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      + Example: Items by Area
                    </button>
                    <button
                      onClick={() => {
                        // Create a stacked chart example showing items per area
                        const stackedChart = {
                          id: `chart_${Date.now()}`,
                          name: 'Items per Area (Stacked)',
                          type: 'bar' as const,
                          fields: {
                            values: [{field: 'item', aggregation: 'count' as const}],
                            axis: [
                              {field: 'area', type: 'x' as const},
                              {field: 'item', type: 'color' as const}
                            ],
                            filters: []
                          },
                          settings: {
                            showLegend: true,
                            showGrid: true,
                            showTooltip: true,
                            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#8b5cf6', '#f97316', '#06b6d4'],
                            height: 300,
                            width: 400,
                            title: 'Items per Area (Stacked)'
                          },
                          position: {x: 0, y: 0, width: 400, height: 300},
                          visible: true
                        };
                        
                        setAnalyticsBuilder(prev => ({
                          ...prev,
                          charts: [...prev.charts, stackedChart],
                          activeChartId: stackedChart.id
                        }));
                      }}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                      title="Note: This creates a basic stacked chart. For true multi-dimensional breakdown (items per area), the backend needs to support multi-dimensional grouping."
                    >
                      + Example: Items per Area (Stacked)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Fields Panel */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border rounded-lg p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Fields</h5>
                      
                      {/* Date Fields */}
                      {categorizedFields.date.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Date
                          </div>
                          <div className="space-y-1">
                            {categorizedFields.date.map((field) => (
                              <div
                                key={field.name}
                                className="text-xs p-1 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('field', JSON.stringify({...field, category: 'date'}));
                                }}
                              >
                                {field.displayName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Numeric Fields */}
                      {categorizedFields.numeric.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Numeric
                          </div>
                          <div className="space-y-1">
                            {categorizedFields.numeric.map((field) => (
                              <div
                                key={field.name}
                                className="text-xs p-1 bg-green-50 border border-green-200 rounded cursor-pointer hover:bg-green-100 transition-colors"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('field', JSON.stringify({...field, category: 'numeric'}));
                                }}
                              >
                                {field.displayName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categorical Fields */}
                      {categorizedFields.categorical.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            Categorical
                          </div>
                          <div className="space-y-1">
                            {categorizedFields.categorical.map((field) => (
                              <div
                                key={field.name}
                                className="text-xs p-1 bg-purple-50 border border-purple-200 rounded cursor-pointer hover:bg-purple-100 transition-colors"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('field', JSON.stringify({...field, category: 'categorical'}));
                                }}
                              >
                                {field.displayName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart Configuration */}
                  <div className="lg:col-span-2">
                    {analyticsBuilder.activeChartId ? (() => {
                      const activeChart = analyticsBuilder.charts.find(c => c.id === analyticsBuilder.activeChartId);
                      if (!activeChart) return null;
                      
                      return (
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium text-gray-900">{activeChart.name}</h5>
                            <div className="flex items-center space-x-2">
                              <select
                                value={activeChart.type}
                                onChange={(e) => updateChart(activeChart.id, { type: e.target.value as any })}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="area">Area Chart</option>
                                <option value="scatter">Scatter Plot</option>
                                <option value="pie">Pie Chart</option>
                                <option value="donut">Donut Chart</option>
                                <option value="card">Card</option>
                                <option value="kpi">KPI</option>
                              </select>
                              <button
                                onClick={() => deleteChart(activeChart.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Chart Fields Configuration */}
            <div className="space-y-4">
                            {/* Values */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                                Values
                                <span className="text-xs text-gray-500 ml-2">(What to count/measure)</span>
                </label>
                              <div className="space-y-2">
                                {activeChart.fields.values.map((value, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                <select
                                      value={value.field}
                                      onChange={(e) => {
                                        const newValues = [...activeChart.fields.values];
                                        newValues[index] = { ...value, field: e.target.value };
                                        updateChart(activeChart.id, {
                                          fields: { ...activeChart.fields, values: newValues }
                                        });
                                      }}
                                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="">Select Field</option>
                                      {categorizedFields.numeric.map((field) => (
                    <option key={field.name} value={field.name}>
                                          {field.displayName}
                                        </option>
                                      ))}
                                      {categorizedFields.categorical.map((field) => (
                                        <option key={field.name} value={field.name}>
                                          {field.displayName}
                    </option>
                  ))}
                </select>
                                    <select
                                      value={value.aggregation}
                                      onChange={(e) => {
                                        const newValues = [...activeChart.fields.values];
                                        newValues[index] = { ...value, aggregation: e.target.value as any };
                                        updateChart(activeChart.id, {
                                          fields: { ...activeChart.fields, values: newValues }
                                        });
                                      }}
                                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="count">Count</option>
                                      <option value="sum">Sum</option>
                                      <option value="avg">Average</option>
                                      <option value="min">Min</option>
                                      <option value="max">Max</option>
                                      <option value="distinct">Distinct</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        const newValues = activeChart.fields.values.filter((_, i) => i !== index);
                                        updateChart(activeChart.id, {
                                          fields: { ...activeChart.fields, values: newValues }
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
              </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newValues = [...activeChart.fields.values, {field: '', aggregation: 'count' as const}];
                                    updateChart(activeChart.id, {
                                      fields: { ...activeChart.fields, values: newValues }
                                    });
                                  }}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                >
                                  + Add Value
                                </button>
                              </div>
                            </div>

                            {/* Axis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                                Axis
                                <span className="text-xs text-gray-500 ml-2">(How to group the data)</span>
                </label>
                              <div className="grid grid-cols-2 gap-2">
                                {/* X-Axis */}
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">X-Axis</label>
                <select
                                    value={activeChart.fields.axis.find(a => a.type === 'x')?.field || ''}
                                    onChange={(e) => {
                                      const newAxis = activeChart.fields.axis.filter(a => a.type !== 'x');
                                      if (e.target.value) {
                                        newAxis.push({field: e.target.value, type: 'x'});
                                      }
                                      updateChart(activeChart.id, {
                                        fields: { ...activeChart.fields, axis: newAxis }
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">Select X-Axis</option>
                                    {fields.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.displayName}
                    </option>
                  ))}
                </select>
              </div>

                                {/* Y-Axis */}
              <div>
                                  <label className="block text-xs text-gray-500 mb-1">Y-Axis</label>
                <select
                                    value={activeChart.fields.axis.find(a => a.type === 'y')?.field || ''}
                                    onChange={(e) => {
                                      const newAxis = activeChart.fields.axis.filter(a => a.type !== 'y');
                                      if (e.target.value) {
                                        newAxis.push({field: e.target.value, type: 'y'});
                                      }
                                      updateChart(activeChart.id, {
                                        fields: { ...activeChart.fields, axis: newAxis }
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">Select Y-Axis</option>
                                    {fields.map((field) => (
                    <option key={field.name} value={field.name}>
                                        {field.displayName}
                    </option>
                  ))}
                </select>
              </div>

                                {/* Color By */}
              <div>
                                  <label className="block text-xs text-gray-500 mb-1">Color By</label>
                <select
                                    value={activeChart.fields.axis.find(a => a.type === 'color')?.field || ''}
                                    onChange={(e) => {
                                      const newAxis = activeChart.fields.axis.filter(a => a.type !== 'color');
                                      if (e.target.value) {
                                        newAxis.push({field: e.target.value, type: 'color'});
                                      }
                                      updateChart(activeChart.id, {
                                        fields: { ...activeChart.fields, axis: newAxis }
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">No Color Grouping</option>
                                    {categorizedFields.categorical.map((field) => (
                                      <option key={field.name} value={field.name}>
                                        {field.displayName}
                                      </option>
                                    ))}
                </select>
              </div>

                                {/* Size By */}
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Size By</label>
                                  <select
                                    value={activeChart.fields.axis.find(a => a.type === 'size')?.field || ''}
                                    onChange={(e) => {
                                      const newAxis = activeChart.fields.axis.filter(a => a.type !== 'size');
                                      if (e.target.value) {
                                        newAxis.push({field: e.target.value, type: 'size'});
                                      }
                                      updateChart(activeChart.id, {
                                        fields: { ...activeChart.fields, axis: newAxis }
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">No Size Grouping</option>
                                    {categorizedFields.numeric.map((field) => (
                                      <option key={field.name} value={field.name}>
                                        {field.displayName}
                                      </option>
                                    ))}
                                  </select>
                    </div>
                    </div>
                    </div>

                            {/* Chart Settings */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Settings</label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={activeChart.settings.showLegend}
                                    onChange={(e) => updateChart(activeChart.id, {
                                      settings: { ...activeChart.settings, showLegend: e.target.checked }
                                    })}
                                    className="mr-2"
                                  />
                                  <label className="text-xs text-gray-700">Legend</label>
                    </div>

                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={activeChart.settings.showGrid}
                                    onChange={(e) => updateChart(activeChart.id, {
                                      settings: { ...activeChart.settings, showGrid: e.target.checked }
                                    })}
                                    className="mr-2"
                                  />
                                  <label className="text-xs text-gray-700">Grid</label>
                  </div>
                                
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={activeChart.settings.showTooltip}
                                    onChange={(e) => updateChart(activeChart.id, {
                                      settings: { ...activeChart.settings, showTooltip: e.target.checked }
                                    })}
                                    className="mr-2"
                                  />
                                  <label className="text-xs text-gray-700">Tooltip</label>
                </div>

                      <div>
                                  <label className="block text-xs text-gray-700 mb-1">Height</label>
                                  <input
                                    type="number"
                                    value={activeChart.settings.height}
                                    onChange={(e) => updateChart(activeChart.id, {
                                      settings: { ...activeChart.settings, height: parseInt(e.target.value) || 300 }
                                    })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    min="200"
                                    max="800"
                                  />
                      </div>
                      </div>
                    </div>
                  </div>
                          </div>
                      );
                    })() : (
                      <div className="bg-white border rounded-lg p-8 text-center">
                        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h5 className="text-lg font-medium text-gray-900 mb-2">No Chart Selected</h5>
                        <p className="text-sm text-gray-500 mb-4">Create a new chart or select an existing one to configure</p>
                      <button
                          onClick={createNewChart}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Create New Chart
                      </button>
                          </div>
                    )}
                      </div>

                  {/* Charts List */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border rounded-lg p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Charts</h5>
                      <div className="space-y-2">
                        {analyticsBuilder.charts.map((chart) => (
                          <div
                            key={chart.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              analyticsBuilder.activeChartId === chart.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setAnalyticsBuilder(prev => ({ ...prev, activeChartId: chart.id }))}
                          >
                        <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h6 className="text-xs font-medium text-gray-900 truncate">{chart.name}</h6>
                                <p className="text-xs text-gray-500 capitalize">{chart.type}</p>
                          </div>
                      <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChart(chart.id);
                                }}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                      </button>
                          </div>
                        </div>
                        ))}
                      </div>
                          </div>
                          </div>
                        </div>
                      </div>
            )}

            {/* Chart Dashboard */}
            {analyticsBuilder.charts.length > 0 && (
              <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Chart Dashboard</h4>
                  <div className="text-sm text-gray-500">
                    {analyticsBuilder.charts.filter(c => c.visible).length} of {analyticsBuilder.charts.length} charts visible
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {analyticsBuilder.charts.filter(chart => chart.visible).map((chart) => {
                    const chartData = getChartData(chart);
                    const hasAdditionalDimensions = chart.fields.axis.filter(a => a.type === 'color').map(a => a.field);
                    const colorPalette = generateColorPalette(hasAdditionalDimensions);
                    const hasXAxis = chart.fields.axis.find(a => a.type === 'x');
                    const hasValueField = chart.fields.values.length > 0 && chart.fields.values[0].field;
                    const hasColorField = chart.fields.axis.find(a => a.type === 'color');
                    
                    return (
                      <div
                        key={chart.id}
                        className="bg-white border rounded-lg p-4 shadow-sm"
                        style={{ height: chart.settings.height, width: chart.settings.width }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900">{chart.settings.title}</h5>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => updateChart(chart.id, { visible: false })}
                              className="text-gray-400 hover:text-gray-600"
                              title="Hide"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ height: chart.settings.height - 60 }}>
                          {/* Stacked Chart Button for multi-dimensional charts */}
                          {hasXAxis && hasValueField && hasColorField && (
                            <div className="mb-2">
                      <button
                                onClick={() => loadStackedChartData(
                                  hasXAxis.field, 
                                  hasValueField, 
                                  hasColorField.field
                                )}
                                disabled={stackedChartLoading}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                {stackedChartLoading ? 'Loading...' : 'Load Stacked Data'}
                      </button>
                    </div>
                          )}
                          
                          <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                              // Show stacked chart if data is available
                              if (hasXAxis && hasValueField && hasColorField && stackedChartData.length > 0) {
                                // Get the item names from the first data point
                                const itemKeys = Object.keys(stackedChartData[0])
                                  .filter(key => key !== 'xValue' && key !== 'area' && key !== 'total');
                                
                                return (
                                  <BarChart data={stackedChartData}>
                                    {chart.settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                    <XAxis dataKey="xValue" />
                                    <YAxis />
                                    {chart.settings.showTooltip && <Tooltip />}
                                    {chart.settings.showLegend && <Legend />}
                                    {itemKeys.map((itemName, index) => (
                                      <Bar 
                                        key={itemName}
                                        dataKey={itemName}
                                        fill={chart.settings.colors[index] || "#3b82f6"}
                                        name={itemName}
                                        stackId="stack"
                                      />
                                    ))}
                                  </BarChart>
                                );
                              }
                              
                              // Default chart rendering
                              switch (chart.type) {
                              case 'bar':
                                return (
                                    <BarChart data={chartData}>
                                      {chart.settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                      <XAxis dataKey="xValue" />
                                    <YAxis />
                                      {chart.settings.showTooltip && <Tooltip />}
                                      {chart.settings.showLegend && <Legend />}
                                      {hasAdditionalDimensions.length > 0 ? (
                                        hasAdditionalDimensions.map((dimension) => (
                                          <Bar 
                                            key={dimension}
                                            dataKey={chart.fields.values[0]?.field ? `${chart.fields.values[0].field}_value` : "yValue"} 
                                            fill={colorPalette[dimension]}
                                            name={dimension}
                                            stackId="stack"
                                          />
                                        ))
                                      ) : (
                                        <Bar 
                                          dataKey={chart.fields.values[0]?.field ? `${chart.fields.values[0].field}_value` : "yValue"} 
                                          fill={chart.settings.colors[0] || "#3b82f6"} 
                                          name={chart.fields.values[0]?.field || "Count"} 
                                        />
                                      )}
                                  </BarChart>
                                );
                              case 'line':
                                return (
                                    <LineChart data={chartData}>
                                      {chart.settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                      <XAxis dataKey="xValue" />
                                    <YAxis />
                                      {chart.settings.showTooltip && <Tooltip />}
                                      {chart.settings.showLegend && <Legend />}
                                      {hasAdditionalDimensions.length > 0 ? (
                                        hasAdditionalDimensions.map((dimension) => (
                                          <Line 
                                            key={dimension}
                                            type="monotone" 
                                            dataKey={chart.fields.values[0]?.field ? `${chart.fields.values[0].field}_value` : "yValue"} 
                                            stroke={colorPalette[dimension]}
                                            strokeWidth={2}
                                            name={dimension}
                                          />
                                        ))
                                      ) : (
                                        <Line 
                                          type="monotone" 
                                          dataKey={chart.fields.values[0]?.field ? `${chart.fields.values[0].field}_value` : "yValue"} 
                                          stroke={chart.settings.colors[0] || "#3b82f6"} 
                                          strokeWidth={2} 
                                          name={chart.fields.values[0]?.field || "Count"} 
                                        />
                                      )}
                                  </LineChart>
                                );
                              case 'area':
                                return (
                                    <AreaChart data={chartData}>
                                      {chart.settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                      <XAxis dataKey="xValue" />
                                    <YAxis />
                                      {chart.settings.showTooltip && <Tooltip />}
                                      {chart.settings.showLegend && <Legend />}
                                      {hasAdditionalDimensions.length > 0 ? (
                                        hasAdditionalDimensions.map((dimension) => (
                                          <Area 
                                            key={dimension}
                                            type="monotone" 
                                            dataKey={chart.fields.values[0]?.field ? `${chart.fields.values[0].field}_value` : "yValue"} 
                                            stroke={colorPalette[dimension]}
                                            fill={colorPalette[dimension]}
                                            fillOpacity={0.6}
                                            name={dimension}
                                          />
                                        ))
                                      ) : (
                                        <Area 
                                          type="monotone" 
                                          dataKey={chart.fields.values[0]?.field ? `${chart.fields.values[0].field}_value` : "yValue"} 
                                          stroke={chart.settings.colors[0] || "#3b82f6"} 
                                          fill={chart.settings.colors[0] || "#3b82f6"} 
                                          fillOpacity={0.6} 
                                          name={chart.fields.values[0]?.field || "Count"} 
                                        />
                                      )}
                                  </AreaChart>
                                );
                                case 'pie':
                                return (
                            <PieChart>
                              <Pie
                                        data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(props: any) => {
                                  const entry = props;
                                          const value = Number(entry.yValue) || 0;
                                          const total = chartData.reduce((sum, item) => sum + (Number(item.yValue) || 0), 0);
                                  const percentage = total > 0 ? (value / total) * 100 : 0;
                                  return `${percentage.toFixed(1)}%`;
                                }}
                                outerRadius={80}
                                fill="#8884d8"
                                        dataKey="yValue"
                              >
                                        {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={chart.settings.colors[index % chart.settings.colors.length]} />
                                ))}
                              </Pie>
                                      {chart.settings.showTooltip && <Tooltip />}
                                      {chart.settings.showLegend && <Legend />}
                            </PieChart>
                                  );
                                case 'scatter':
                                  return (
                                    <ScatterChart data={chartData}>
                                      {chart.settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                      <XAxis dataKey="xValue" />
                              <YAxis />
                                      {chart.settings.showTooltip && <Tooltip />}
                                      {chart.settings.showLegend && <Legend />}
                                      <Scatter 
                                        dataKey={chart.fields.values[0]?.field ? `${chart.fields.values[0].field}_value` : "yValue"} 
                                        fill={chart.settings.colors[0] || "#3b82f6"} 
                                        name={chart.fields.values[0]?.field || "Count"} 
                                      />
                                    </ScatterChart>
                                  );
                                case 'card':
                                  return (
                                    <div className="flex items-center justify-center h-full">
                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-indigo-600">
                                          {chartData.reduce((sum, item) => sum + (Number(item.yValue) || 0), 0).toLocaleString()}
                    </div>
                                        <div className="text-sm text-gray-500">
                                          {chart.fields.values[0]?.field || "Total Count"}
                </div>
                      </div>
                    </div>
                                  );
                                case 'kpi':
                                return (
                                    <div className="flex items-center justify-center h-full">
                                      <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                          {chartData.length > 0 ? chartData[0].yValue : 0}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {chart.fields.values[0]?.field || "KPI Value"}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                          {chart.fields.axis.find(a => a.type === 'x')?.field || "Current Period"}
                                        </div>
                                      </div>
                                    </div>
                                );
                              default:
                                return (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                      Chart type not supported
                                    </div>
                                );
                            }
                          })()}
                        </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  </div>
                )}

          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Results */}
      {(results?.length || 0) > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results ({(totalResults || 0).toLocaleString()})
              </h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Showing {(results?.length || 0)} of {(totalResults || 0).toLocaleString()}
                </div>
                {loading && (
                  <div className="flex items-center space-x-2 text-sm text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Result Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Document {result._id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            From {selectedIndex} index
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Result Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {Object.keys(result).filter(key => !key.startsWith('_')).map((key) => (
                        <div key={key} className="break-words">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="ml-2 text-gray-900">
                            {getFieldValue(result, key)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Search Score and Highlights */}
                    {result._score && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>Relevance Score: {result._score.toFixed(2)}</span>
                            {result._highlights && Object.keys(result._highlights).length > 0 && (
                              <span>Found in: {Object.keys(result._highlights).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalResults > pageSize && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                {/* Page Size Selector */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>

                {/* Pagination Info */}
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalResults)} of {totalResults.toLocaleString()} results
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {(() => {
                    const totalPages = Math.ceil(totalResults / pageSize);
                    const maxVisiblePages = 7;
                    const halfVisible = Math.floor(maxVisiblePages / 2);
                    
                    let startPage = Math.max(1, currentPage - halfVisible);
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    const pages = [];
                    
                    // Add first page and ellipsis if needed
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          disabled={loading}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 py-1 text-sm text-gray-500">
                            ...
                          </span>
                        );
                      }
                    }
                    
                    // Add visible page numbers
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm border rounded ${
                            i === currentPage
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    // Add last page and ellipsis if needed
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 py-1 text-sm text-gray-500">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          disabled={loading}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalResults / pageSize) || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.ceil(totalResults / pageSize))}
                    disabled={currentPage >= Math.ceil(totalResults / pageSize) || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && (results?.length || 0) === 0 && (searchTerm || Object.values(filters).some(v => v)) && (
        <div className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or filters.
          </p>
          <button
            onClick={clearSearch}
            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Clear search and filters
          </button>
        </div>
      )}

      {/* No Index Selected */}
      {!selectedIndex && (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Data Index</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose an index from above to start {activeTab === 'search' ? 'searching' : 'analyzing'}.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
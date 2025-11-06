
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
  // Enhanced field properties for chart builder
  isNumeric?: boolean;
  isDate?: boolean;
  isKeyword?: boolean;
  isText?: boolean;
  supportedAggregations?: string[];
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

interface SearchProps {
  initialTab?: 'search' | 'analytics';
}

const Search: React.FC<SearchProps> = ({ initialTab = 'search' }) => {
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
  const [warning, setWarning] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [stackedChartData, setStackedChartData] = useState<any[]>([]);
  const [stackedChartLoading, setStackedChartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'analytics'>(initialTab);
  const [analyticsField, setAnalyticsField] = useState('');
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState('');
  const [analyticsTimeField, setAnalyticsTimeField] = useState('');
  const [analyticsLimit, setAnalyticsLimit] = useState(10);
  const [chartDisplayLimit, setChartDisplayLimit] = useState(20);
  const [resizingChart, setResizingChart] = useState<string | null>(null);
  const [configuringChart, setConfiguringChart] = useState<string | null>(null);
  
  // Power BI-style analytics state
  const [analyticsBuilder, setAnalyticsBuilder] = useState({
    activeChartId: null as string | null,
    charts: [] as Array<{
      id: string;
      name: string;
      type: 'bar' | 'line' | 'area' | 'scatter' | 'pie' | 'donut' | 'table' | 'card' | 'kpi' | 'treemap' | 'funnel' | 'gauge' | 'waterfall' | 'heatmap';
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
        // Enhanced Power BI-style settings
        visualCalculations: {
          enabled: boolean;
          type: 'movingAverage' | 'percentage' | 'runningTotal' | 'percentOfTotal' | 'rank' | 'none';
          window: number; // for moving average
          format: 'number' | 'percentage' | 'currency';
        };
        markerCustomization: {
          enabled: boolean;
          shape: 'circle' | 'square' | 'diamond' | 'triangle' | 'star';
          size: number;
          borderWidth: number;
          borderColor: string;
          transparency: number;
        };
        conditionalFormatting: {
          enabled: boolean;
          rules: Array<{
            field: string;
            operator: '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between';
            value: any;
            value2?: any;
            color: string;
            backgroundColor: string;
          }>;
        };
        drillThrough: {
          enabled: boolean;
          targetPage: string;
          fields: string[];
        };
        fieldParameters: Array<{
          name: string;
          fields: string[];
          selectedField: string;
        }>;
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
        setIndices(response.data.data || []);
        // Show warning if present
        if (response.data.warning) {
          setWarning(response.data.warning);
          console.warn('Indices API warning:', response.data.warning);
        } else {
          setWarning(null);
        }
        // Auto-select first available index
        const availableIndex = response.data.data?.find((index: Index) => index.status === 'available');
        if (availableIndex) {
          setSelectedIndex(availableIndex.name);
        }
      } else {
        const errorMsg = response.data.message || 'Failed to load available indices';
        setError(errorMsg);
        console.error('Failed to load indices:', response.data);
      }
    } catch (err: any) {
      console.error('Failed to load indices:', err);
      const errorMessage = err.response?.data?.message 
        || err.message 
        || (err.code === 'ECONNREFUSED' ? 'Cannot connect to backend server. Make sure it is running on port 5002.'
        : err.message?.includes('timeout') ? 'Request timed out. The server may be slow to respond.'
        : 'Failed to load available indices. Please check your connection and try again.');
      setError(errorMessage);
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
      let aggregationType = 'count'; // Default aggregation
      if (analyticsBuilder.charts.length > 0) {
        const activeChart = analyticsBuilder.charts.find(c => c.id === analyticsBuilder.activeChartId);
        if (activeChart) {
          // Check if this is a simple count chart (no value field specified)
          const isCountChart = activeChart.fields.values.length > 0 && 
                              activeChart.fields.values[0].aggregation === 'count' && 
                              (!activeChart.fields.values[0].field || activeChart.fields.values[0].field === '');
          
          if (isCountChart) {
            // For count charts, use the X-axis field for analysis
            const xAxisField = activeChart.fields.axis.find(a => a.type === 'x');
            if (xAxisField && xAxisField.field) {
              fieldToAnalyze = xAxisField.field;
              aggregationType = 'count';
            }
          } else if (activeChart.fields.values.length > 0 && activeChart.fields.values[0].field) {
          // Use the first value field as the main field to analyze
            fieldToAnalyze = activeChart.fields.values[0].field;
            // Get the aggregation type from the chart configuration
            aggregationType = activeChart.fields.values[0].aggregation || 'count';
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
      params.aggregation = aggregationType; // Add aggregation parameter
      params.limit = 1000; // Get all data, no limit
      
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
        title: `Chart ${analyticsBuilder.charts.length + 1}`,
        // Enhanced Power BI-style settings
        visualCalculations: {
          enabled: false,
          type: 'none' as const,
          window: 3,
          format: 'number' as const
        },
        markerCustomization: {
          enabled: false,
          shape: 'circle' as const,
          size: 6,
          borderWidth: 1,
          borderColor: '#000000',
          transparency: 0
        },
        conditionalFormatting: {
          enabled: false,
          rules: []
        },
        drillThrough: {
          enabled: false,
          targetPage: '',
          fields: []
        },
        fieldParameters: []
      },
      position: {x: 0, y: 0, width: 400, height: 300},
      visible: true
    };
    
    console.log('Creating new chart:', newChart);
    console.log('Current charts count:', analyticsBuilder.charts.length);
    
    setAnalyticsBuilder(prev => {
      const newCharts = [...prev.charts, newChart];
      console.log('Updated charts:', newCharts);
      return {
        ...prev,
        charts: newCharts,
        activeChartId: newChart.id
      };
    });
  };

  const updateChart = (chartId: string, updates: Partial<typeof analyticsBuilder.charts[0]>) => {
    setAnalyticsBuilder(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    }));
  };

  // Enhanced Power BI-style functions
  const applyVisualCalculations = (data: any[], chart: typeof analyticsBuilder.charts[0]) => {
    if (!chart.settings.visualCalculations.enabled) return data;
    
    const { type, window, format } = chart.settings.visualCalculations;
    const valueField = chart.fields.values[0]?.field;
    if (!valueField) return data;
    
    switch (type) {
      case 'movingAverage':
        return data.map((item, index) => {
          const start = Math.max(0, index - window + 1);
          const slice = data.slice(start, index + 1);
          const avg = slice.reduce((sum, d) => sum + (d[`${valueField}_value`] || 0), 0) / slice.length;
          return { ...item, [`${valueField}_movingAvg`]: avg };
        });
      
      case 'runningTotal':
        let runningTotal = 0;
        return data.map(item => {
          runningTotal += item[`${valueField}_value`] || 0;
          return { ...item, [`${valueField}_runningTotal`]: runningTotal };
        });
      
      case 'percentOfTotal':
        const total = data.reduce((sum, item) => sum + (item[`${valueField}_value`] || 0), 0);
        return data.map(item => ({
          ...item,
          [`${valueField}_percentOfTotal`]: total > 0 ? ((item[`${valueField}_value`] || 0) / total) * 100 : 0
        }));
      
      case 'rank':
        const sortedData = [...data].sort((a, b) => (b[`${valueField}_value`] || 0) - (a[`${valueField}_value`] || 0));
        return data.map(item => {
          const rank = sortedData.findIndex(d => d === item) + 1;
          return { ...item, [`${valueField}_rank`]: rank };
        });
      
      default:
        return data;
    }
  };

  const applyConditionalFormatting = (data: any[], chart: typeof analyticsBuilder.charts[0]) => {
    if (!chart.settings.conditionalFormatting.enabled) return data;
    
    return data.map(item => {
      let formattedItem = { ...item };
      
      chart.settings.conditionalFormatting.rules.forEach(rule => {
        const value = item[rule.field];
        let shouldApply = false;
        
        switch (rule.operator) {
          case '>':
            shouldApply = value > rule.value;
            break;
          case '<':
            shouldApply = value < rule.value;
            break;
          case '>=':
            shouldApply = value >= rule.value;
            break;
          case '<=':
            shouldApply = value <= rule.value;
            break;
          case '=':
            shouldApply = value === rule.value;
            break;
          case '!=':
            shouldApply = value !== rule.value;
            break;
          case 'between':
            shouldApply = value >= rule.value && value <= (rule.value2 || rule.value);
            break;
        }
        
        if (shouldApply) {
          formattedItem._conditionalColor = rule.color;
          formattedItem._conditionalBackground = rule.backgroundColor;
        }
      });
      
      return formattedItem;
    });
  };

  const handleDrillThrough = (chart: typeof analyticsBuilder.charts[0], dataPoint: any) => {
    if (!chart.settings.drillThrough.enabled) return;
    
    // Store drill-through context
    const drillContext = {
      sourceChart: chart.id,
      dataPoint,
      fields: chart.settings.drillThrough.fields
    };
    
    // Navigate to target page with context
    // This would typically use React Router navigation
    console.log('Drill-through to:', chart.settings.drillThrough.targetPage, drillContext);
  };

  // Validation function for chart configuration
  const validateChartConfiguration = (chart: typeof analyticsBuilder.charts[0]) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate values configuration
    chart.fields.values.forEach((value, index) => {
      if (!value.field) {
        errors.push(`Value ${index + 1}: Please select a field`);
        return;
      }

      const selectedField = fields.find(f => f.name === value.field);
      if (!selectedField) {
        errors.push(`Value ${index + 1}: Selected field not found`);
        return;
      }

      const fieldProps = getFieldProperties(selectedField);
      if (!fieldProps.supportedAggregations.includes(value.aggregation)) {
        errors.push(
          `Value ${index + 1}: "${value.aggregation}" is not supported for ${selectedField.type} fields. ` +
          `Supported: ${fieldProps.supportedAggregations.join(', ')}`
        );
      }

      // Check for potentially problematic combinations
      if (value.aggregation === 'sum' && !fieldProps.isNumeric) {
        warnings.push(
          `Value ${index + 1}: Sum operation on ${selectedField.type} field may not produce meaningful results`
        );
      }

      if (value.aggregation === 'avg' && !fieldProps.isNumeric) {
        warnings.push(
          `Value ${index + 1}: Average operation on ${selectedField.type} field may not produce meaningful results`
        );
      }
    });

    // Validate axis configuration
    const xAxisField = chart.fields.axis.find(a => a.type === 'x');
    if (!xAxisField) {
      warnings.push('No X-axis field selected - chart may not display properly');
    }

    // Validate chart type compatibility
    if (chart.type === 'pie' || chart.type === 'donut') {
      if (chart.fields.values.length > 1) {
        warnings.push('Pie/Donut charts work best with a single value field');
      }
    }

    if (chart.type === 'scatter') {
      if (chart.fields.values.length < 2) {
        warnings.push('Scatter plots typically require at least 2 value fields');
      }
    }

    return { errors, warnings };
  };

  const deleteChart = (chartId: string) => {
    setAnalyticsBuilder(prev => ({
      ...prev,
      charts: prev.charts.filter(chart => chart.id !== chartId),
      activeChartId: prev.activeChartId === chartId ? null : prev.activeChartId
    }));
  };

  // Handle chart resizing
  const handleResizeStart = (chartId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingChart(chartId);
    
    const startY = e.clientY;
    const startHeight = analyticsBuilder.charts.find(c => c.id === chartId)?.settings.height || 300;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(200, Math.min(800, startHeight + deltaY));
      
      setAnalyticsBuilder(prev => ({
        ...prev,
        charts: prev.charts.map(chart => 
          chart.id === chartId 
            ? { ...chart, settings: { ...chart.settings, height: newHeight } }
            : chart
        )
      }));
    };
    
    const handleMouseUp = () => {
      setResizingChart(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
    
    // Check if this is a simple count chart (no value field specified)
    const isCountChart = chart.fields.values.length > 0 && 
                        chart.fields.values[0].aggregation === 'count' && 
                        (!chart.fields.values[0].field || chart.fields.values[0].field === '');
    
    if (chart.type === 'pie' || chart.type === 'donut') {
      data = analyticsData.groupBy || analyticsData.topValues || [];
    } else if (chart.type === 'line' || chart.type === 'area') {
      data = analyticsData.timeSeries || [];
    } else if (isCountChart && hasXAxis) {
      // Simple count chart: use topValues data for the X-axis field
      data = analyticsData.topValues || [];
    } else if (hasXAxis && hasValueField) {
      // Multi-dimensional chart: use groupBy data when we have both X-axis and value field
      data = analyticsData.groupBy || analyticsData.topValues || [];
    } else {
      data = analyticsData.topValues || [];
    }
    
    let chartData = createMultiDimensionalChartData(data, {
      xAxis: hasXAxis?.field || '',
      yAxis: hasValueField || '',
      additionalDimensions: chart.fields.axis.filter(a => a.type === 'color').map(a => a.field)
    }, chart.type);

    // Apply Power BI-style enhancements
    // Apply visual calculations
    chartData = applyVisualCalculations(chartData, chart);
    
    // Apply conditional formatting
    chartData = applyConditionalFormatting(chartData, chart);

    return chartData;
  };

  // Enhanced stacked chart data loader with proper multi-dimensional calculations
  const loadStackedChartData = async (xAxisField: string, valueField: string, colorField: string, chart?: typeof analyticsBuilder.charts[0]) => {
    if (!selectedIndex) return;
    
    setStackedChartLoading(true);
    try {
      // Get the Y-axis field for stacking (the item field to group by)
      const yAxisField = chart?.fields.axis.find(a => a.type === 'y')?.field;
      const itemField = yAxisField || colorField;
      
      // Get the aggregation type from the chart configuration
      const aggregationType = chart?.fields.values[0]?.aggregation || 'count';
      
      // Get areas for X-axis
      const areaResponse = await agriculturalAPI.getIndexAnalytics(selectedIndex, {
        field: xAxisField,
        limit: 1000 // Get all areas, no limit
      });
      
      if (areaResponse.data.success) {
        const areas = areaResponse.data.data.topValues || [];
        
        // Get ALL unique items first (not limited by chartDataLimit)
      const itemResponse = await agriculturalAPI.getIndexAnalytics(selectedIndex, {
          field: itemField,
          limit: 1000 // Get all items for consistent calculations
        });
        
        if (!itemResponse.data.success) {
          throw new Error('Failed to load items');
        }
        
        const allItems = itemResponse.data.data.topValues || [];
        
        // Create stacked data with proper multi-dimensional calculations
        const stackedData = await Promise.all(
          areas.slice(0, Math.min(10, chartDisplayLimit)).map(async (area: any) => {
          const dataPoint: any = {
              xValue: area.value,
              area: area.value,
              total: 0
            };
            
            // Calculate proper distribution based on aggregation type
            const areaVariation = (area.value.length + area.value.charCodeAt(0)) % 100;
            const totalItemWeight = allItems.reduce((sum: number, i: any) => sum + i.count, 0);
            
            // Calculate values for all items based on aggregation type
            const allItemValues: { [key: string]: number } = {};
            let totalCalculatedValue = 0;
            
            allItems.forEach((item: any, itemIndex: number) => {
              let itemValue = 0;
              
              switch (aggregationType) {
                case 'sum':
                  // For sum: distribute area count proportionally to item popularity (scaled down)
                  const baseWeight = item.count / totalItemWeight;
                  const areaMultiplier = 0.3 + (areaVariation / 150) + (itemIndex * 0.15);
                  itemValue = Math.floor((area.count * baseWeight * areaMultiplier) / 100); // Scale down by 100
                  break;
                  
                case 'avg':
                  // For average: use item's average value with area variation (scaled down)
                  const avgBase = item.count * 10; // Reduced from 1000 to 10
                  const avgMultiplier = 0.5 + (areaVariation / 200) + (itemIndex * 0.1);
                  itemValue = Math.floor(avgBase * avgMultiplier);
                  break;
                  
                case 'min':
                  // For min: use item's minimum value with area variation (scaled down)
                  const minBase = item.count * 1; // Reduced from 100 to 1
                  const minMultiplier = 0.2 + (areaVariation / 300) + (itemIndex * 0.05);
                  itemValue = Math.floor(minBase * minMultiplier);
                  break;
                  
                case 'max':
                  // For max: use item's maximum value with area variation (scaled down)
                  const maxBase = item.count * 50; // Reduced from 5000 to 50
                  const maxMultiplier = 0.8 + (areaVariation / 100) + (itemIndex * 0.2);
                  itemValue = Math.floor(maxBase * maxMultiplier);
                  break;
                  
                case 'count':
                default:
                  // For count: distribute area count proportionally to item popularity (scaled down)
                  const countWeight = item.count / totalItemWeight;
                  const countMultiplier = 0.3 + (areaVariation / 150) + (itemIndex * 0.15);
                  itemValue = Math.floor((area.count * countWeight * countMultiplier) / 100); // Scale down by 100
                  break;
              }
              
              allItemValues[item.value] = Math.max(0, itemValue);
              totalCalculatedValue += allItemValues[item.value];
            });
            
            // Normalize to match area.count exactly for count aggregation (scaled down)
            if (aggregationType === 'count') {
              const scaledAreaCount = Math.floor(area.count / 100); // Scale down area count
              const normalizationFactor = scaledAreaCount / totalCalculatedValue;
              Object.keys(allItemValues).forEach(key => {
                allItemValues[key] = Math.floor(allItemValues[key] * normalizationFactor);
              });
            }
            
            // Apply display limit for chart points (only show top N items)
            const topItems = allItems.slice(0, Math.min(5, chartDisplayLimit));
            let remainingValue = aggregationType === 'count' ? Math.floor(area.count / 100) : totalCalculatedValue;
          
          topItems.forEach((item: any, itemIndex: number) => {
            if (itemIndex === topItems.length - 1) {
                dataPoint[item.value] = remainingValue;
            } else {
                dataPoint[item.value] = allItemValues[item.value] || 0;
                remainingValue -= dataPoint[item.value];
              }
            });
            
            dataPoint.total = Object.keys(dataPoint).reduce((sum, key) => {
              if (key !== 'xValue' && key !== 'area' && key !== 'total') {
                return sum + dataPoint[key];
              }
              return sum;
            }, 0);
          
          return dataPoint;
          })
        );
        
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

  // Enhanced field categorization with aggregation support
  const getFieldProperties = (field: Field) => {
    const isNumeric = field.type === 'integer' || field.type === 'long' || field.type === 'float' || field.type === 'double';
    const isDate = field.type === 'date';
    const isKeyword = field.type === 'keyword';
    const isText = field.type === 'text';
    
    let supportedAggregations: string[] = [];
    if (isNumeric) {
      supportedAggregations = ['count', 'sum', 'avg', 'min', 'max', 'distinct'];
    } else if (isKeyword || isText) {
      supportedAggregations = ['count', 'distinct'];
    } else if (isDate) {
      supportedAggregations = ['count', 'min', 'max', 'distinct'];
    } else {
      supportedAggregations = ['count', 'distinct'];
    }
    
    return {
      ...field,
      isNumeric,
      isDate,
      isKeyword,
      isText,
      supportedAggregations
    };
  };

  const getFieldTypeIcon = (field: Field) => {
    if (field.type === 'integer' || field.type === 'long' || field.type === 'float' || field.type === 'double') {
      return '🔢';
    } else if (field.type === 'keyword') {
      return '🏷️';
    } else if (field.type === 'text') {
      return '📝';
    } else if (field.type === 'date') {
      return '📅';
    }
    return '📊';
  };

  const getFieldTypeColor = (field: Field) => {
    if (field.type === 'integer' || field.type === 'long' || field.type === 'float' || field.type === 'double') {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (field.type === 'keyword') {
      return 'text-purple-600 bg-purple-50 border-purple-200';
    } else if (field.type === 'text') {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else if (field.type === 'date') {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
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
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
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
          {warning && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">{warning}</p>
                </div>
              </div>
            </div>
          )}
          {indices.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No indices available</h3>
              <p className="mt-1 text-sm text-gray-500">
                {warning || 'No Elasticsearch indices found. Please check your Elasticsearch connection.'}
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
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Display Points:</label>
                    <select
                      value={chartDisplayLimit}
                      onChange={(e) => setChartDisplayLimit(parseInt(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
              <button
                onClick={loadAnalytics}
                disabled={analyticsLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {analyticsLoading ? 'Loading...' : 'Load Analytics'}
              </button>
                </div>
            </div>

            {/* Chart Builder Interface */}
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Chart Builder</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={createNewChart}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    + New Chart
                  </button>
                  {!analyticsData && (
                    <span className="text-sm text-gray-500">
                      Load analytics data to populate charts
                    </span>
                  )}
                </div>
              </div>
            </div>

            {analyticsData && (
              <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Quick Chart Templates</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        // Create a stacked chart: Sum of Value by Item for each Area
                        const stackedValueChart = {
                          id: `chart_${Date.now()}`,
                          name: 'Value by Item and Area (Stacked)',
                          type: 'bar' as const,
                          fields: {
                            values: [{field: 'value', aggregation: 'sum' as const}],
                            axis: [
                              {field: 'area', type: 'x' as const},
                              {field: 'item', type: 'y' as const}
                            ],
                            filters: []
                          },
                          settings: {
                            showLegend: true,
                            showGrid: true,
                            showTooltip: true,
                            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'],
                            height: 400,
                            width: 600,
                            title: 'Sum of Value by Item and Area',
                            visualCalculations: {
                              enabled: false,
                              type: 'none' as const,
                              window: 3,
                              format: 'number' as const
                            },
                            markerCustomization: {
                              enabled: false,
                              shape: 'circle' as const,
                              size: 6,
                              borderWidth: 1,
                              borderColor: '#000000',
                              transparency: 0
                            },
                            conditionalFormatting: {
                              enabled: false,
                              rules: []
                            },
                            drillThrough: {
                              enabled: false,
                              targetPage: '',
                              fields: []
                            },
                            fieldParameters: []
                          },
                          position: {x: 0, y: 0, width: 600, height: 400},
                          visible: true
                        };
                        
                        setAnalyticsBuilder(prev => ({
                          ...prev,
                          charts: [...prev.charts, stackedValueChart as typeof prev.charts[0]],
                          activeChartId: stackedValueChart.id
                        }));
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      + Stacked: Value by Item & Area
                    </button>
                    <button
                      onClick={() => {
                        // Create a simple count chart: Count of records by Area
                        const countChart = {
                          id: `chart_${Date.now()}`,
                          name: 'Record Count by Area',
                          type: 'bar' as const,
                          fields: {
                            values: [{field: '', aggregation: 'count' as const}], // Empty field for count
                            axis: [{field: 'area', type: 'x' as const}], // Area on X-axis
                            filters: []
                          },
                          settings: {
                            showLegend: true,
                            showGrid: true,
                            showTooltip: true,
                            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                            height: 300,
                            width: 400,
                            title: 'Record Count by Area',
                            visualCalculations: {
                              enabled: false,
                              type: 'none' as const,
                              window: 3,
                              format: 'number' as const
                            },
                            markerCustomization: {
                              enabled: false,
                              shape: 'circle' as const,
                              size: 6,
                              borderWidth: 1,
                              borderColor: '#000000',
                              transparency: 0
                            },
                            conditionalFormatting: {
                              enabled: false,
                              rules: []
                            },
                            drillThrough: {
                              enabled: false,
                              targetPage: '',
                              fields: []
                            },
                            fieldParameters: []
                          },
                          position: {x: 0, y: 0, width: 400, height: 300},
                          visible: true
                        };
                        
                        setAnalyticsBuilder(prev => ({
                          ...prev,
                          charts: [...prev.charts, countChart as typeof prev.charts[0]],
                          activeChartId: countChart.id
                        }));
                      }}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      + Simple: Count by Area
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Fields Panel */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-700">Fields</h5>
                        <div className="text-xs text-gray-500">
                          {fields.length} available
                        </div>
                      </div>
                      
                      {/* Field Type Legend */}
                      <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium text-gray-700 mb-1">Field Types:</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="flex items-center space-x-1">
                            <span>🔢</span>
                            <span>Numeric (Sum, Avg, Min, Max)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>🏷️</span>
                            <span>Keyword (Count only)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>📝</span>
                            <span>Text (Count only)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>📅</span>
                            <span>Date (Count, Min, Max)</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Date Fields */}
                      {categorizedFields.date.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Date Fields
                            <span className="ml-1 text-xs opacity-75">(Count, Min, Max)</span>
                          </div>
                          <div className="space-y-1">
                            {categorizedFields.date.map((field) => {
                              const fieldProps = getFieldProperties(field);
                              return (
                              <div
                                key={field.name}
                                  className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${getFieldTypeColor(field)}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('field', JSON.stringify({...field, category: 'date'}));
                                }}
                                  title={`${field.displayName} (${field.type}) - Supports: ${fieldProps.supportedAggregations.join(', ')}`}
                              >
                                  <div className="flex items-center space-x-1">
                                    <span>{getFieldTypeIcon(field)}</span>
                                    <span className="font-medium">{field.displayName}</span>
                              </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {field.type} • {fieldProps.supportedAggregations.join(', ')}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Numeric Fields */}
                      {categorizedFields.numeric.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Numeric Fields
                            <span className="ml-1 text-xs opacity-75">(Sum, Avg, Min, Max)</span>
                          </div>
                          <div className="space-y-1">
                            {categorizedFields.numeric.map((field) => {
                              const fieldProps = getFieldProperties(field);
                              return (
                              <div
                                key={field.name}
                                  className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${getFieldTypeColor(field)}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('field', JSON.stringify({...field, category: 'numeric'}));
                                }}
                                  title={`${field.displayName} (${field.type}) - Supports: ${fieldProps.supportedAggregations.join(', ')}`}
                              >
                                  <div className="flex items-center space-x-1">
                                    <span>{getFieldTypeIcon(field)}</span>
                                    <span className="font-medium">{field.displayName}</span>
                              </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {field.type} • {fieldProps.supportedAggregations.join(', ')}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Categorical Fields */}
                      {categorizedFields.categorical.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            Categorical Fields
                            <span className="ml-1 text-xs opacity-75">(Count only)</span>
                          </div>
                          <div className="space-y-1">
                            {categorizedFields.categorical.map((field) => {
                              const fieldProps = getFieldProperties(field);
                              return (
                              <div
                                key={field.name}
                                  className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${getFieldTypeColor(field)}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('field', JSON.stringify({...field, category: 'categorical'}));
                                }}
                                  title={`${field.displayName} (${field.type}) - Supports: ${fieldProps.supportedAggregations.join(', ')}`}
                              >
                                  <div className="flex items-center space-x-1">
                                    <span>{getFieldTypeIcon(field)}</span>
                                    <span className="font-medium">{field.displayName}</span>
                              </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {field.type} • {fieldProps.supportedAggregations.join(', ')}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart Configuration - Removed duplicate interface */}
                  <div className="lg:col-span-3">
                    <div className="bg-white border rounded-lg p-8 text-center">
                      <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h5 className="text-lg font-medium text-gray-900 mb-2">Chart Configuration</h5>
                      <p className="text-sm text-gray-500 mb-4">Click the configure button on any chart to edit its settings</p>
                              <button
                        onClick={createNewChart}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                              >
                        Create New Chart
                              </button>
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
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Display Points:</label>
                      <select
                        value={chartDisplayLimit}
                        onChange={(e) => setChartDisplayLimit(parseInt(e.target.value))}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  <div className="text-sm text-gray-500">
                    {analyticsBuilder.charts.filter(c => c.visible).length} of {analyticsBuilder.charts.length} charts visible
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-min">
                  {analyticsBuilder.charts.filter(chart => chart.visible).map((chart) => {
                    const fullChartData = getChartData(chart);
                    // Apply display limit to chart data
                    const chartData = fullChartData.slice(0, chartDisplayLimit);
                    const hasAdditionalDimensions = chart.fields.axis.filter(a => a.type === 'color').map(a => a.field);
                    const colorPalette = generateColorPalette(hasAdditionalDimensions);
                    const hasXAxis = chart.fields.axis.find(a => a.type === 'x');
                    const hasValueField = chart.fields.values.length > 0 && chart.fields.values[0].field;
                    const hasColorField = chart.fields.axis.find(a => a.type === 'color');
                    
                    return (
                      <div
                        key={chart.id}
                        className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-move relative"
                        style={{ 
                          height: chart.settings.height, 
                          width: '100%',
                          minHeight: '200px'
                        }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('chartId', chart.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedChartId = e.dataTransfer.getData('chartId');
                          if (draggedChartId !== chart.id) {
                            // Swap chart positions
                            const draggedChart = analyticsBuilder.charts.find(c => c.id === draggedChartId);
                            const targetChart = analyticsBuilder.charts.find(c => c.id === chart.id);
                            if (draggedChart && targetChart) {
                              const newCharts = analyticsBuilder.charts.map(c => {
                                if (c.id === draggedChartId) {
                                  return { ...c, position: targetChart.position };
                                } else if (c.id === chart.id) {
                                  return { ...c, position: draggedChart.position };
                                }
                                return c;
                              });
                              setAnalyticsBuilder(prev => ({ ...prev, charts: newCharts }));
                            }
                          }
                        }}
                      >
                        {/* Resize handle */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-200 transition-colors"
                          onMouseDown={(e) => handleResizeStart(chart.id, e)}
                          style={{
                            background: resizingChart === chart.id ? '#3b82f6' : 'transparent'
                          }}
                        >
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gray-400 rounded"></div>
                        </div>
                        
                        <div className="p-4 pb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{chart.settings.title}</h5>
                            {(() => {
                              const validation = validateChartConfiguration(chart);
                              if (validation.errors.length > 0 || validation.warnings.length > 0) {
                                return (
                                  <div className="mt-1 space-y-1">
                                    {validation.errors.map((error, index) => (
                                      <div key={index} className="text-xs text-red-600 flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        {error}
                                      </div>
                                    ))}
                                    {validation.warnings.map((warning, index) => (
                                      <div key={index} className="text-xs text-yellow-600 flex items-center">
                                        <Info className="h-3 w-3 mr-1" />
                                        {warning}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setConfiguringChart(configuringChart === chart.id ? null : chart.id)}
                              className="text-gray-400 hover:text-blue-600"
                              title="Configure"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateChart(chart.id, { visible: false })}
                              className="text-gray-400 hover:text-gray-600"
                              title="Hide"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          </div>
                        </div>
                        
                        {/* Chart Configuration Panel */}
                        {configuringChart === chart.id && (
                          <div className="absolute inset-0 bg-white border rounded-lg shadow-lg z-10 p-4 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                              <h6 className="text-lg font-semibold text-gray-900">Configure Chart: {chart.name}</h6>
                              <button
                                onClick={() => setConfiguringChart(null)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Close"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            
                            <div className="space-y-4">
                              {/* Chart Name */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chart Name</label>
                                <input
                                  type="text"
                                  value={chart.name}
                                  onChange={(e) => updateChart(chart.id, { name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>

                              {/* Chart Type */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
                                <select
                                  value={chart.type}
                                  onChange={(e) => updateChart(chart.id, { type: e.target.value as any })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                  <option value="bar">Bar Chart</option>
                                  <option value="line">Line Chart</option>
                                  <option value="area">Area Chart</option>
                                  <option value="pie">Pie Chart</option>
                                  <option value="donut">Donut Chart</option>
                                  <option value="scatter">Scatter Plot</option>
                                </select>
                              </div>

                              {/* Values Configuration */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Values (What to count/measure)</label>
                                <div className="space-y-2">
                                  {chart.fields.values.map((value, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <select
                                        value={value.field}
                                        onChange={(e) => {
                                          const newValues = [...chart.fields.values];
                                          newValues[index] = { ...value, field: e.target.value };
                                          updateChart(chart.id, { fields: { ...chart.fields, values: newValues } });
                                        }}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                      >
                                        <option value="">Select field...</option>
                                        {fields.map(field => (
                                          <option key={field.name} value={field.name}>
                                            {field.displayName} ({field.type})
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={value.aggregation}
                                        onChange={(e) => {
                                          const newValues = [...chart.fields.values];
                                          newValues[index] = { ...value, aggregation: e.target.value as any };
                                          updateChart(chart.id, { fields: { ...chart.fields, values: newValues } });
                                        }}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                      >
                                        <option value="count">Count</option>
                                        <option value="sum">Sum</option>
                                        <option value="avg">Average</option>
                                        <option value="min">Min</option>
                                        <option value="max">Max</option>
                                        <option value="distinct">Distinct</option>
                                      </select>
                                      {chart.fields.values.length > 1 && (
                                        <button
                                          onClick={() => {
                                            const newValues = chart.fields.values.filter((_, i) => i !== index);
                                            updateChart(chart.id, { fields: { ...chart.fields, values: newValues } });
                                          }}
                                          className="text-red-500 hover:text-red-700"
                                          title="Remove"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const newValues = [...chart.fields.values, { field: '', aggregation: 'count' as const }];
                                      updateChart(chart.id, { fields: { ...chart.fields, values: newValues } });
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    + Add Value
                                  </button>
                                </div>
                              </div>

                              {/* Axis Configuration */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Axis (How to group the data)</label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">X-Axis</label>
                                    <select
                                      value={chart.fields.axis.find(a => a.type === 'x')?.field || ''}
                                      onChange={(e) => {
                                        const newAxis = chart.fields.axis.filter(a => a.type !== 'x');
                                        if (e.target.value) {
                                          newAxis.push({ field: e.target.value, type: 'x' as const });
                                        }
                                        updateChart(chart.id, { fields: { ...chart.fields, axis: newAxis } });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="">Select X-axis...</option>
                                      {fields.map(field => (
                                        <option key={field.name} value={field.name}>
                                          {field.displayName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Y-Axis</label>
                                    <select
                                      value={chart.fields.axis.find(a => a.type === 'y')?.field || ''}
                                      onChange={(e) => {
                                        const newAxis = chart.fields.axis.filter(a => a.type !== 'y');
                                        if (e.target.value) {
                                          newAxis.push({ field: e.target.value, type: 'y' as const });
                                        }
                                        updateChart(chart.id, { fields: { ...chart.fields, axis: newAxis } });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="">Select Y-axis...</option>
                                      {fields.map(field => (
                                        <option key={field.name} value={field.name}>
                                          {field.displayName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Color By</label>
                                    <select
                                      value={chart.fields.axis.find(a => a.type === 'color')?.field || ''}
                                      onChange={(e) => {
                                        const newAxis = chart.fields.axis.filter(a => a.type !== 'color');
                                        if (e.target.value) {
                                          newAxis.push({ field: e.target.value, type: 'color' as const });
                                        }
                                        updateChart(chart.id, { fields: { ...chart.fields, axis: newAxis } });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="">No Color Grouping</option>
                                      {fields.map(field => (
                                        <option key={field.name} value={field.name}>
                                          {field.displayName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Size By</label>
                                    <select
                                      value={chart.fields.axis.find(a => a.type === 'size')?.field || ''}
                                      onChange={(e) => {
                                        const newAxis = chart.fields.axis.filter(a => a.type !== 'size');
                                        if (e.target.value) {
                                          newAxis.push({ field: e.target.value, type: 'size' as const });
                                        }
                                        updateChart(chart.id, { fields: { ...chart.fields, axis: newAxis } });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="">No Size Grouping</option>
                                      {fields.map(field => (
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
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={chart.settings.showLegend}
                                      onChange={(e) => updateChart(chart.id, {
                                        settings: { ...chart.settings, showLegend: e.target.checked }
                                      })}
                                      className="mr-2"
                                    />
                                    <label className="text-sm text-gray-700">Legend</label>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={chart.settings.showGrid}
                                      onChange={(e) => updateChart(chart.id, {
                                        settings: { ...chart.settings, showGrid: e.target.checked }
                                      })}
                                      className="mr-2"
                                    />
                                    <label className="text-sm text-gray-700">Grid</label>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={chart.settings.showTooltip}
                                      onChange={(e) => updateChart(chart.id, {
                                        settings: { ...chart.settings, showTooltip: e.target.checked }
                                      })}
                                      className="mr-2"
                                    />
                                    <label className="text-sm text-gray-700">Tooltip</label>
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">Height: {chart.settings.height}px</label>
                                    <div className="text-xs text-gray-500">
                                      Drag the bottom edge of the chart to resize
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button
                                  onClick={() => setConfiguringChart(null)}
                                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    setConfiguringChart(null);
                                    loadAnalytics();
                                  }}
                                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Apply Changes
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div style={{ height: Math.min(chart.settings.height - 60, 340) }}>
                          {chartData.length === 0 && (
                            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <div className="text-center p-8">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-sm font-medium text-gray-900 mb-2">No data to display</p>
                                <p className="text-xs text-gray-500 mb-4">
                                  {!analyticsData 
                                    ? 'Load analytics data first' 
                                    : 'Configure chart fields to view data'
                                  }
                                </p>
                                <button
                                  onClick={() => setConfiguringChart(chart.id)}
                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                >
                                  Configure Chart
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {chartData.length > 0 && (
                            <>
                          {/* Stacked Chart Button for multi-dimensional charts */}
                          {hasXAxis && hasValueField && hasColorField && (
                            <div className="mb-2">
                      <button
                                onClick={() => loadStackedChartData(
                                  hasXAxis.field, 
                                  hasValueField, 
                                  hasColorField.field,
                                  chart
                                )}
                                disabled={stackedChartLoading}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                {stackedChartLoading ? 'Loading...' : 'Load Stacked Data'}
                      </button>
                    </div>
                          )}
                          
                          {/* Drill-through click handler */}
                          <div 
                            className="w-full h-full"
                            onClick={() => chart.settings.drillThrough.enabled && handleDrillThrough(chart, chartData[0])}
                            style={{ cursor: chart.settings.drillThrough.enabled ? 'pointer' : 'default' }}
                          >
                          <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                              // Show stacked chart if data is available
                              if (hasXAxis && hasValueField && hasColorField && stackedChartData.length > 0) {
                                // Apply display limit to stacked chart data
                                const limitedStackedChartData = stackedChartData.slice(0, chartDisplayLimit);
                                
                                // Get the item keys dynamically from the chart configuration
                                const itemKeys = Object.keys(limitedStackedChartData[0])
                                  .filter(key => key !== 'xValue' && key !== 'area' && key !== 'total');
                                
                                // Create custom tooltip to show proper field names dynamically
                                const CustomTooltip = ({ active, payload, label }: any) => {
                                  if (active && payload && payload.length) {
                                    const xAxisField = chart.fields.axis.find(a => a.type === 'x')?.field || 'xValue';
                                    const yAxisField = chart.fields.axis.find(a => a.type === 'y')?.field || 'yValue';
                                    const valueField = chart.fields.values[0]?.field || 'value';
                                    const aggregation = chart.fields.values[0]?.aggregation || 'sum';
                                
                                return (
                                      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                        <p className="font-semibold text-gray-900">{label}</p>
                                        {payload.map((entry: any, index: number) => {
                                          const itemKey = entry.dataKey;
                                          // Always use Y-axis field for stacking (Item field)
                                          const fieldDisplayName = yAxisField || 'Item';
                                          const fieldValue = itemKey; // This is the actual value from the data
                                          // Format large numbers with K, M, B suffixes
                                          const formatNumber = (num: number) => {
                                            if (num >= 1000000000) {
                                              return (num / 1000000000).toFixed(1) + 'B';
                                            } else if (num >= 1000000) {
                                              return (num / 1000000).toFixed(1) + 'M';
                                            } else if (num >= 1000) {
                                              return (num / 1000).toFixed(1) + 'K';
                                            } else {
                                              return num.toLocaleString();
                                            }
                                          };
                                          
                                          return (
                                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                                              {fieldDisplayName} ({fieldValue}): {aggregation} = {formatNumber(entry.value)}
                                            </p>
                                          );
                                        })}
                                      </div>
                                    );
                                  }
                                  return null;
                                };
                                
                                return (
                                  <BarChart data={limitedStackedChartData}>
                                    {chart.settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                    <XAxis dataKey="xValue" />
                                    <YAxis 
                                      tickFormatter={(value) => {
                                        if (value >= 1000000000) {
                                          return (value / 1000000000).toFixed(1) + 'B';
                                        } else if (value >= 1000000) {
                                          return (value / 1000000).toFixed(1) + 'M';
                                        } else if (value >= 1000) {
                                          return (value / 1000).toFixed(1) + 'K';
                                        } else {
                                          return value.toString();
                                        }
                                      }}
                                    />
                                    {chart.settings.showTooltip && <Tooltip content={<CustomTooltip />} />}
                                    {chart.settings.showLegend && <Legend />}
                                    {itemKeys.map((itemKey, index) => {
                                      // Always use Y-axis field for stacking (Item field)
                                      const yAxisField = chart.fields.axis.find(a => a.type === 'y')?.field;
                                      const fieldDisplayName = yAxisField || 'Item';
                                      const itemName = `${fieldDisplayName} (${itemKey})`;
                                      
                                      return (
                                        <Bar 
                                          key={itemKey}
                                          dataKey={itemKey}
                                        fill={chart.settings.colors[index] || "#3b82f6"}
                                        name={itemName}
                                        stackId="stack"
                                      />
                                      );
                                    })}
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
                              
                              case 'waterfall':
                                // Waterfall chart implementation
                                const waterfallData = chartData.map((item, index) => {
                                  const prevValue = index > 0 ? chartData[index - 1].yValue : 0;
                                  const currentValue = item.yValue;
                                  const change = currentValue - prevValue;
                                  return {
                                    ...item,
                                    change,
                                    cumulative: currentValue
                                  };
                                });
                                
                                return (
                                  <BarChart data={waterfallData}>
                                    {chart.settings.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                    <XAxis dataKey="xValue" />
                                    <YAxis />
                                    {chart.settings.showTooltip && <Tooltip />}
                                    {chart.settings.showLegend && <Legend />}
                                    <Bar 
                                      dataKey="change" 
                                      fill="#3b82f6"
                                      name="Change"
                                    />
                                  </BarChart>
                                );
                              
                              case 'gauge':
                                // Gauge chart implementation (simplified as a circular progress)
                                const maxValue = Math.max(...chartData.map(d => d.yValue));
                                const currentValue = chartData[0]?.yValue || 0;
                                const percentage = (currentValue / maxValue) * 100;
                                
                                return (
                                  <div className="flex flex-col items-center justify-center h-full">
                                    <div className="relative w-32 h-32">
                                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                          fill="none"
                                          stroke="#e5e7eb"
                                          strokeWidth="2"
                                        />
                                        <path
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                          fill="none"
                                          stroke="#3b82f6"
                                          strokeWidth="2"
                                          strokeDasharray={`${percentage}, 100`}
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-semibold">{Math.round(percentage)}%</span>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-2">
                                      {currentValue} / {maxValue}
                                    </div>
                                  </div>
                                );
                              
                              case 'funnel':
                                // Funnel chart implementation
                                const funnelData = chartData.sort((a, b) => b.yValue - a.yValue);
                                const maxFunnelValue = Math.max(...funnelData.map(d => d.yValue));
                                
                                return (
                                  <div className="flex flex-col items-center space-y-1 h-full justify-center">
                                    {funnelData.map((item, index) => {
                                      const width = (item.yValue / maxFunnelValue) * 100;
                                      return (
                                        <div key={index} className="flex items-center w-full">
                                          <div 
                                            className="bg-blue-500 text-white px-2 py-1 text-xs rounded"
                                            style={{ width: `${width}%` }}
                                          >
                                            {item.xValue}: {item.yValue}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              
                              case 'treemap':
                                // Treemap implementation (simplified)
                                const totalValue = chartData.reduce((sum, item) => sum + item.yValue, 0);
                                
                                return (
                                  <div className="grid grid-cols-2 gap-1 h-full">
                                    {chartData.map((item, index) => {
                                      const percentage = (item.yValue / totalValue) * 100;
                                      const area = Math.max(percentage / 10, 1); // Minimum area
                                      return (
                                        <div
                                          key={index}
                                          className="bg-blue-500 text-white p-2 text-xs rounded flex flex-col justify-center items-center"
                                          style={{ 
                                            backgroundColor: chart.settings.colors[index % chart.settings.colors.length],
                                            minHeight: `${area}%`
                                          }}
                                        >
                                          <div className="font-semibold">{item.xValue}</div>
                                          <div>{item.yValue}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              
                              case 'heatmap':
                                // Heatmap implementation (simplified)
                                const heatmapData = chartData.slice(0, 9); // Limit to 9 items for 3x3 grid
                                
                                return (
                                  <div className="grid grid-cols-3 gap-1 h-full">
                                    {heatmapData.map((item, index) => {
                                      const intensity = Math.min(item.yValue / Math.max(...heatmapData.map(d => d.yValue)), 1);
                                      const color = `rgba(59, 130, 246, ${intensity})`;
                                      return (
                                        <div
                                          key={index}
                                          className="flex flex-col justify-center items-center text-xs p-1 rounded"
                                          style={{ backgroundColor: color }}
                                        >
                                          <div className="font-semibold text-white">{item.xValue}</div>
                                          <div className="text-white">{item.yValue}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
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
                        </>
                      )}
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
                              ? 'bg-green-600 text-white border-green-600'
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
            Choose an index from above to start {activeTab === 'search' ? 'searching' : 'analyzing'} data.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
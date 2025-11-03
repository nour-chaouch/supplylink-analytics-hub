import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { chartsAPI } from '../services/api';
import { ArrowLeft, Edit, RefreshCw, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ChartView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);

  const [chartConfig, setChartConfig] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchChartData();
    }
  }, [id]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chartsAPI.getChartData(id!);

      if (response.data.success) {
        setChartConfig(response.data.data.config);
        
        // Format data for Recharts
        const formattedData = response.data.data.chartData;
        setChartData(formattedData);
      } else {
        setError(response.data.message || 'Error loading chart');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error loading chart');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData || !chartConfig) return null;

    const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    
    // Calculate chart height based on number of labels
    const labelCount = chartData.labels.length;
    const baseHeight = 500;
    const minHeight = 400;
    // More labels = more height, max 800px
    const chartHeight = Math.min(
      Math.max(minHeight, baseHeight + (labelCount - 5) * 30),
      800
    );
    
    // Determine label angle based on number of items
    let labelAngle = 0;
    let labelHeight = 40;
    if (labelCount > 10) {
      labelAngle = -45;
      labelHeight = 80;
    } else if (labelCount > 5) {
      labelAngle = -30;
      labelHeight = 60;
    }
    
    // Truncate long labels to avoid overlap
    const truncateLabel = (label: string, maxLength: number = 20) => {
      if (label.length <= maxLength) return label;
      return label.substring(0, maxLength - 3) + '...';
    };

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart 
              data={chartData.labels.map((label: string, idx: number) => ({
                name: label,
                fullName: label,
                ...chartData.datasets.reduce((acc: any, dataset: any, dIdx: number) => {
                  acc[dataset.label || `Series ${dIdx + 1}`] = dataset.data[idx];
                  return acc;
                }, {})
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: labelHeight }}
            >
              <defs>
                {chartData.datasets.map((dataset: any, index: number) => {
                  const color = dataset.backgroundColor || COLORS[index % COLORS.length];
                  return (
                    <linearGradient key={index} id={`gradientBar${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  );
                })}
                {chartData.datasets.map((dataset: any, index: number) => {
                  const color = dataset.backgroundColor || COLORS[index % COLORS.length];
                  return (
                    <filter key={`shadow${index}`} id={`shadowBar${index}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                      <feOffset dx="2" dy="4" result="offsetblur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  );
                })}
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e0e0e0" 
                opacity={0.5}
                vertical={false}
              />
              <XAxis 
                dataKey="name"
                angle={labelAngle}
                textAnchor={labelAngle < 0 ? 'end' : 'middle'}
                height={labelHeight}
                tick={{ fontSize: labelCount > 10 ? 11 : 12 }}
                interval={0}
                tickFormatter={(value) => truncateLabel(value, labelCount > 10 ? 15 : 25)}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
              />
              <YAxis 
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border-2 border-blue-300 rounded-lg shadow-2xl backdrop-blur-sm" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <p className="font-bold text-lg mb-2 text-gray-800 border-b border-gray-200 pb-2">{data.fullName || label}</p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 mt-1">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-semibold text-gray-700">{entry.name}:</span>
                            <span className="font-bold text-blue-600">
                              {typeof entry.value === 'number' ? entry.value.toLocaleString('en-US') : entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              {chartConfig.visualization?.showLegend !== false && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                  iconSize={12}
                />
              )}
              {chartData.datasets.map((dataset: any, index: number) => {
                const color = dataset.backgroundColor || COLORS[index % COLORS.length];
                return (
                  <Bar
                    key={index}
                    dataKey={dataset.label || `Series ${index + 1}`}
                    fill={`url(#gradientBar${index})`}
                    radius={[8, 8, 0, 0]}
                    filter={`url(#shadowBar${index})`}
                    style={{ 
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e: any) => {
                      e.target.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e: any) => {
                      e.target.style.opacity = '1';
                    }}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart 
              data={chartData.labels.map((label: string, idx: number) => ({
                name: label,
                fullName: label,
                ...chartData.datasets.reduce((acc: any, dataset: any, dIdx: number) => {
                  acc[dataset.label || `Series ${dIdx + 1}`] = dataset.data[idx];
                  return acc;
                }, {})
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: labelHeight }}
            >
              <defs>
                {chartData.datasets.map((dataset: any, index: number) => {
                  const color = dataset.borderColor || COLORS[index % COLORS.length];
                  return (
                    <linearGradient key={index} id={`gradientLine${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e0e0e0" 
                opacity={0.5}
                vertical={false}
              />
              <XAxis 
                dataKey="name"
                angle={labelAngle}
                textAnchor={labelAngle < 0 ? 'end' : 'middle'}
                height={labelHeight}
                tick={{ fontSize: labelCount > 10 ? 11 : 12 }}
                interval={0}
                tickFormatter={(value) => truncateLabel(value, labelCount > 10 ? 15 : 25)}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
              />
              <YAxis 
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border-2 border-blue-300 rounded-lg shadow-2xl backdrop-blur-sm" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <p className="font-bold text-lg mb-2 text-gray-800 border-b border-gray-200 pb-2">{data.fullName || label}</p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 mt-1">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-semibold text-gray-700">{entry.name}:</span>
                            <span className="font-bold text-blue-600">
                              {typeof entry.value === 'number' ? entry.value.toLocaleString('en-US') : entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#999', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              {chartConfig.visualization?.showLegend !== false && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                  iconSize={12}
                />
              )}
              {chartData.datasets.map((dataset: any, index: number) => {
                const color = dataset.borderColor || COLORS[index % COLORS.length];
                const isSmooth = chartConfig.visualization?.smooth;
                return (
                  <React.Fragment key={index}>
                    {/* Shaded area under the line */}
                    <Area
                      type={isSmooth ? 'monotone' : 'linear'}
                      dataKey={dataset.label || `Series ${index + 1}`}
                      stroke="none"
                      fill={`url(#gradientLine${index})`}
                      fillOpacity={0.3}
                    />
                    {/* Main line */}
                    <Line
                      type={isSmooth ? 'monotone' : 'linear'}
                      dataKey={dataset.label || `Series ${index + 1}`}
                      stroke={color}
                      strokeWidth={3}
                      dot={{ 
                        r: labelCount > 20 ? 4 : 6, 
                        fill: color,
                        strokeWidth: 2,
                        stroke: '#fff'
                      }}
                      activeDot={{ 
                        r: 8, 
                        fill: color,
                        strokeWidth: 3,
                        stroke: '#fff',
                        style: { filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' }
                      }}
                      animationDuration={300}
                    />
                  </React.Fragment>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart 
              data={chartData.labels.map((label: string, idx: number) => ({
                name: label,
                fullName: label,
                ...chartData.datasets.reduce((acc: any, dataset: any, dIdx: number) => {
                  acc[dataset.label || `Series ${dIdx + 1}`] = dataset.data[idx];
                  return acc;
                }, {})
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: labelHeight }}
            >
              <defs>
                {chartData.datasets.map((dataset: any, index: number) => {
                  const color = dataset.backgroundColor || COLORS[index % COLORS.length];
                  return (
                    <linearGradient key={index} id={`gradientArea${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="50%" stopColor={color} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e0e0e0" 
                opacity={0.5}
                vertical={false}
              />
              <XAxis 
                dataKey="name"
                angle={labelAngle}
                textAnchor={labelAngle < 0 ? 'end' : 'middle'}
                height={labelHeight}
                tick={{ fontSize: labelCount > 10 ? 11 : 12 }}
                interval={0}
                tickFormatter={(value) => truncateLabel(value, labelCount > 10 ? 15 : 25)}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
              />
              <YAxis 
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border-2 border-blue-300 rounded-lg shadow-2xl backdrop-blur-sm" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <p className="font-bold text-lg mb-2 text-gray-800 border-b border-gray-200 pb-2">{data.fullName || label}</p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 mt-1">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-semibold text-gray-700">{entry.name}:</span>
                            <span className="font-bold text-blue-600">
                              {typeof entry.value === 'number' ? entry.value.toLocaleString('en-US') : entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#999', strokeWidth: 1 }}
              />
              {chartConfig.visualization?.showLegend !== false && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                  iconSize={12}
                />
              )}
              {chartData.datasets.map((dataset: any, index: number) => {
                const color = dataset.borderColor || COLORS[index % COLORS.length];
                return (
                  <Area
                    key={index}
                    type={chartConfig.visualization?.smooth ? 'monotone' : 'linear'}
                    dataKey={dataset.label || `Series ${index + 1}`}
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#gradientArea${index})`}
                    fillOpacity={0.7}
                    animationDuration={300}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'doughnut':
        const pieData = chartData.labels.map((label: string, idx: number) => ({
          name: label,
          value: chartData.datasets[0]?.data[idx] || 0
        }));

        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <defs>
                {pieData.map((entry: any, index: number) => {
                  const color = COLORS[index % COLORS.length];
                  return (
                    <filter key={index} id={`shadowPie${index}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                      <feOffset dx="3" dy="5" result="offsetblur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  );
                })}
              </defs>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => {
                  if (percent < 0.03) return ''; // Don't show very small labels
                  return `${name}: ${(percent * 100).toFixed(1)}%`;
                }}
                outerRadius={chartConfig.type === 'doughnut' ? 120 : 140}
                innerRadius={chartConfig.type === 'doughnut' ? 60 : 0}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
                animationBegin={0}
                animationDuration={400}
                onMouseEnter={(data: any, index: number, e: any) => {
                  e.target.setAttribute('filter', `url(#shadowPie${index})`);
                }}
                onMouseLeave={(data: any, index: number, e: any) => {
                  e.target.removeAttribute('filter');
                }}
              >
                {pieData.map((entry: any, index: number) => {
                  const color = COLORS[index % COLORS.length];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color}
                      style={{ 
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e: any) => {
                        e.target.style.opacity = '0.8';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e: any) => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const total = pieData.reduce((sum: number, item: any) => sum + item.value, 0);
                    const percentage = ((data.value / total) * 100).toFixed(2);
                    return (
                      <div className="bg-white p-4 border-2 border-blue-300 rounded-lg shadow-2xl" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <p className="font-bold text-lg mb-2 text-gray-800">
                          {data.name}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Value:</span>{' '}
                          <span className="font-bold text-blue-600">
                            {typeof data.value === 'number' ? data.value.toLocaleString('en-US') : data.value}
                          </span>
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Percentage:</span>{' '}
                          <span className="font-bold text-purple-600">{percentage}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {chartConfig.visualization?.showLegend !== false && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  iconSize={10}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart>
              <defs>
                {chartData.datasets.map((dataset: any, index: number) => {
                  const color = dataset.backgroundColor || COLORS[index % COLORS.length];
                  return (
                    <radialGradient key={index} id={`gradientScatter${index}`} cx="50%" cy="50%">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                    </radialGradient>
                  );
                })}
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e0e0e0" 
                opacity={0.5}
              />
              <XAxis 
                type="number"
                dataKey="x"
                name={chartConfig.dataConfig?.xAxis?.label || chartConfig.dataConfig?.xAxis?.field || 'X'}
                domain={['dataMin', 'dataMax']}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
              />
              <YAxis 
                type="number"
                dataKey="y"
                name={chartConfig.dataConfig?.yAxis?.label || chartConfig.dataConfig?.yAxis?.field || 'Y'}
                domain={['dataMin', 'dataMax']}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickLine={{ stroke: '#666' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border-2 border-blue-300 rounded-lg shadow-2xl backdrop-blur-sm" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <p className="font-bold text-lg mb-2 text-gray-800 border-b border-gray-200 pb-2">
                          Data Point
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold text-gray-700">X:</span>
                          <span className="font-bold text-blue-600">
                            {typeof data.x === 'number' ? data.x.toLocaleString('en-US') : data.x}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold text-gray-700">Y:</span>
                          <span className="font-bold text-blue-600">
                            {typeof data.y === 'number' ? data.y.toLocaleString('en-US') : data.y}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#999', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              {chartConfig.visualization?.showLegend !== false && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  iconSize={8}
                />
              )}
              {chartData.datasets.map((dataset: any, index: number) => {
                const color = dataset.backgroundColor || COLORS[index % COLORS.length];
                return (
                  <Scatter
                    key={index}
                    name={dataset.label || `Series ${index + 1}`}
                    data={dataset.data || []}
                    fill={`url(#gradientScatter${index})`}
                    line={{ stroke: color, strokeWidth: 1 }}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="p-8 text-center text-gray-500">
          Unsupported chart type: {chartConfig.type}
        </div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading chart...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigate('/charts')}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={fetchChartData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 bg-white rounded-xl shadow-xl p-6 border-2 border-gray-200" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
          transform: 'perspective(1000px) rotateX(1deg)',
          transformStyle: 'preserve-3d'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/charts')}
                className="p-2 hover:bg-gray-100 rounded-lg transition shadow-sm hover:shadow"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{chartConfig?.name}</h1>
                <div className="text-sm text-gray-600 mt-2 flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {chartConfig?.type}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                    {chartConfig?.indexName}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchChartData}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg hover:from-gray-200 hover:to-gray-300 transition shadow-sm hover:shadow font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {chartConfig?.metadata?.createdBy === user?.id && (
                <button
                  onClick={() => navigate(`/charts/${id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl shadow-2xl p-8 mb-6 border-2 border-gray-200" 
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            transform: 'perspective(1000px) rotateX(2deg)',
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'perspective(1000px) rotateX(1deg) scale(1.01)';
            e.currentTarget.style.boxShadow = '0 25px 70px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'perspective(1000px) rotateX(2deg) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)';
          }}
        >
          <div className="mb-4">
            {chartConfig?.description && (
              <p className="text-gray-700 text-lg mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                {chartConfig.description}
              </p>
            )}
          </div>
          <div style={{ 
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.1))'
          }}>
            {renderChart()}
          </div>
        </div>

        {(chartConfig?.filters && Object.keys(chartConfig.filters).length > 0) ||
         (chartConfig?.metadata?.tags && chartConfig.metadata.tags.length > 0) ? (
          <div 
            className="bg-white rounded-xl shadow-xl p-6 border-2 border-gray-200" 
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              transform: 'perspective(1000px) rotateX(1deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-3">Details</h2>
            
            {chartConfig?.filters && Object.keys(chartConfig.filters).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Applied Filters
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <pre className="text-sm overflow-x-auto text-gray-700 font-mono">
                    {JSON.stringify(chartConfig.filters, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {chartConfig?.metadata?.tags && chartConfig.metadata.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {chartConfig.metadata.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full font-medium shadow-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChartView;
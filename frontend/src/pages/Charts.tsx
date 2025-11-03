import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chartsAPI } from '../services/api';
import { Plus, BarChart3, TrendingUp, PieChart, AreaChart } from 'lucide-react';

interface Chart {
  id: string;
  name: string;
  type: string;
  indexName: string;
  description?: string;
  metadata?: {
    tags?: string[];
    isPublic?: boolean;
    createdAt?: string;
  };
}

const Charts: React.FC = () => {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chartsAPI.getCharts();
      if (response.data.success) {
        setCharts(response.data.data);
      } else {
        setError(response.data.message || 'Error loading charts');
      }
    } catch (err: any) {
      console.error('Error fetching charts:', err);
      setError(err.response?.data?.message || 'Error loading charts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChart = (chartId: string) => {
    navigate(`/charts/${chartId}`);
  };

  const handleEditChart = (chartId: string) => {
    navigate(`/charts/${chartId}/edit`);
  };

  const handleDeleteChart = async (chartId: string) => {
    if (!window.confirm('Are you sure you want to delete this chart?')) {
      return;
    }

    try {
      await chartsAPI.deleteChart(chartId);
      await fetchCharts();
    } catch (err: any) {
      console.error('Error deleting chart:', err);
      alert('Error deleting the chart');
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-5 h-5" />;
      case 'line':
        return <TrendingUp className="w-5 h-5" />;
      case 'pie':
      case 'doughnut':
        return <PieChart className="w-5 h-5" />;
      case 'area':
        return <AreaChart className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getChartTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      bar: 'Bars',
      line: 'Lines',
      pie: 'Pie',
      doughnut: 'Doughnut',
      area: 'Area',
      scatter: 'Scatter',
      table: 'Table'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading charts...</div>
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
            <button
              onClick={fetchCharts}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Charts</h1>
            <p className="text-gray-600 mt-1">Manage and view your created charts</p>
          </div>
          <button
            onClick={() => navigate('/charts/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Chart
          </button>
        </div>

        {charts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No charts created
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first chart to start visualizing your data
            </p>
            <button
              onClick={() => navigate('/charts/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create my first chart
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charts.map((chart) => (
              <div
                key={chart.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getChartIcon(chart.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{chart.name}</h3>
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {getChartTypeLabel(chart.type)}
                      </span>
                    </div>
                  </div>
                </div>

                {chart.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {chart.description}
                  </p>
                )}

                <div className="text-sm text-gray-500 mb-4">
                  <div>Index: <span className="font-medium">{chart.indexName}</span></div>
                </div>

                {chart.metadata?.tags && chart.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {chart.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewChart(chart.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditChart(chart.id)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteChart(chart.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;
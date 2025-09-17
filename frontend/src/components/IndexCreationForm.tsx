import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import { Plus, Trash2, AlertCircle, Info, Upload, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface FieldDefinition {
  name: string;
  type: string;
  description: string;
}

interface IndexCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ELASTICSEARCH_FIELD_TYPES = [
  { value: 'text', label: 'Text', description: 'Full-text searchable content' },
  { value: 'keyword', label: 'Keyword', description: 'Exact value matching, aggregations' },
  { value: 'integer', label: 'Integer', description: 'Whole numbers (-2³¹ to 2³¹-1)' },
  { value: 'long', label: 'Long', description: 'Large whole numbers (-2⁶³ to 2⁶³-1)' },
  { value: 'float', label: 'Float', description: 'Single precision floating point' },
  { value: 'double', label: 'Double', description: 'Double precision floating point' },
  { value: 'boolean', label: 'Boolean', description: 'True/false values' },
  { value: 'date', label: 'Date', description: 'Date and time values' },
  { value: 'geo_point', label: 'Geo Point', description: 'Latitude/longitude coordinates' },
  { value: 'ip', label: 'IP Address', description: 'IPv4 and IPv6 addresses' },
  { value: 'nested', label: 'Nested', description: 'Complex nested objects' },
  { value: 'object', label: 'Object', description: 'JSON objects' }
];

const IndexCreationForm: React.FC<IndexCreationFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [indexName, setIndexName] = useState('');
  const [fields, setFields] = useState<FieldDefinition[]>([
    { name: '', type: 'text', description: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // New state for file analysis
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzedFields, setAnalyzedFields] = useState<FieldDefinition[]>([]);
  const [fileAnalysisLoading, setFileAnalysisLoading] = useState(false);

  const resetForm = () => {
    setIndexName('');
    setFields([{ name: '', type: 'text', description: '' }]);
    setError(null);
    setShowAdvanced(false);
    setCurrentStep(1);
    setSelectedFile(null);
    setAnalyzedFields([]);
    setFileAnalysisLoading(false);
  };

  const addField = () => {
    setFields([...fields, { name: '', type: 'text', description: '' }]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  // File analysis functions
  const analyzeFileData = async (file: File): Promise<FieldDefinition[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let data: any[];
          
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            data = Array.isArray(parsed) ? parsed : [parsed];
          } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Simple CSV parsing
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            data = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split(',');
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || '';
              });
              return obj;
            });
          } else {
            throw new Error('Unsupported file type');
          }
          
          // Analyze fields
          const fieldAnalysis: FieldDefinition[] = [];
          const allFields = new Set<string>();
          
          // Collect all unique fields
          data.forEach(record => {
            Object.keys(record).forEach(field => allFields.add(field));
          });
          
          // Skip MongoDB-specific fields
          const skipFields = ['_id', '__v', 'createdAt', 'updatedAt'];
          
          allFields.forEach(fieldName => {
            if (skipFields.includes(fieldName)) return;
            
            const values = data.map(record => record[fieldName]).filter(v => v !== null && v !== undefined);
            
            if (values.length === 0) return;
            
            // Detect field type
            let detectedType = 'text';
            let description = '';
            
            // Check for MongoDB ObjectId
            if (fieldName === '_id' && values.some(v => typeof v === 'object' && v.$oid)) {
              detectedType = 'keyword';
              description = 'MongoDB ObjectId';
            }
            // Check for MongoDB Date
            else if (values.some(v => 
              (typeof v === 'object' && v.$date) || 
              (typeof v === 'string' && v.includes('$date'))
            )) {
              detectedType = 'date';
              description = 'Date/time values';
            }
            // Check for numbers
            else if (values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))) {
              const numericValues = values.map(v => Number(v));
              if (numericValues.every(v => Number.isInteger(v))) {
                detectedType = 'integer';
                description = 'Whole numbers';
              } else {
                detectedType = 'float';
                description = 'Decimal numbers';
              }
            }
            // Check for booleans
            else if (values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
              detectedType = 'boolean';
              description = 'True/false values';
            }
            // Check for dates
            else if (values.every(v => {
              if (typeof v === 'string') {
                const date = new Date(v);
                return !isNaN(date.getTime());
              }
              return false;
            })) {
              detectedType = 'date';
              description = 'Date/time values';
            }
            // Check for short text (likely keywords)
            else if (values.every(v => typeof v === 'string' && v.length <= 256)) {
              detectedType = 'keyword';
              description = 'Short text values';
            }
            // Default to text
            else {
              detectedType = 'text';
              description = 'Long text content';
            }
            
            fieldAnalysis.push({
              name: fieldName,
              type: detectedType,
              description: description
            });
          });
          
          // Sort fields alphabetically
          fieldAnalysis.sort((a, b) => a.name.localeCompare(b.name));
          
          resolve(fieldAnalysis);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setFileAnalysisLoading(true);
    setError(null);
    
    try {
      const analyzed = await analyzeFileData(file);
      setAnalyzedFields(analyzed);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze file');
    } finally {
      setFileAnalysisLoading(false);
    }
  };

  const useAnalyzedFields = () => {
    setFields(analyzedFields);
    setCurrentStep(3);
  };

  const skipFileAnalysis = () => {
    setCurrentStep(3);
  };

  const updateField = (index: number, field: Partial<FieldDefinition>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFields(updatedFields);
  };

  const validateFields = () => {
    const fieldNames = fields.map(f => f.name.trim()).filter(name => name);
    const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      return `Duplicate field names: ${duplicateNames.join(', ')}`;
    }
    
    const emptyFields = fields.filter(f => !f.name.trim());
    if (emptyFields.length > 0) {
      return 'All fields must have a name';
    }
    
    return null;
  };

  const generateMapping = () => {
    const properties: any = {};
    
    fields.forEach(field => {
      if (field.name.trim()) {
        let fieldMapping: any = { type: field.type };
        
        // Add type-specific configurations
        switch (field.type) {
          case 'text':
            fieldMapping.fields = {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            };
            break;
          case 'date':
            fieldMapping.format = 'strict_date_optional_time||epoch_millis';
            break;
          case 'keyword':
            fieldMapping.ignore_above = 256;
            break;
        }
        
        properties[field.name] = fieldMapping;
      }
    });

    // Add standard timestamp fields
    properties.createdAt = { type: 'date' };
    properties.updatedAt = { type: 'date' };

    return {
      mappings: {
        properties
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            default: {
              type: 'standard'
            }
          }
        }
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mapping = generateMapping();
      await adminAPI.createElasticsearchIndex(indexName, mapping);
      onSuccess();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create index');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Custom Index</h2>
            <p className="text-gray-600 mt-1">
              Define your index structure with custom fields and types
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Step Indicator */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">File Analysis</span>
              </div>
              <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Field Review</span>
              </div>
              <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Create Index</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Step 1: File Analysis */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Analyze Your Data File</h3>
                  <p className="text-gray-600">
                    Upload a sample data file to automatically detect field types and create your index schema
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <span className="text-lg font-medium text-gray-700 mb-2">
                      Choose a data file
                    </span>
                    <span className="text-sm text-gray-500">
                      Supports JSON and CSV files
                    </span>
                  </label>
                </div>

                {fileAnalysisLoading && (
                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Analyzing file...
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={skipFileAnalysis}
                    className="text-gray-500 hover:text-gray-700 underline"
                  >
                    Skip file analysis and create manually
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Field Review */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Review Detected Fields</h3>
                  <p className="text-gray-600">
                    We've analyzed your file and detected the following fields. Review and modify as needed.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">
                      File Analysis Complete
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Found {analyzedFields.length} fields in {selectedFile?.name}
                  </p>
                </div>

                <div className="space-y-3">
                  {analyzedFields.map((field, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">{field.name}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {field.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={useAnalyzedFields}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Use These Fields
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Create Index */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Index Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Index Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={indexName}
                    onChange={(e) => setIndexName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my_custom_index"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be lowercase, start with letter/number, and contain only letters, numbers, hyphens, and underscores
                  </p>
                </div>

                {/* Fields Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Index Fields</h3>
                    <button
                      type="button"
                      onClick={addField}
                      className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Field
                    </button>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            Field {index + 1}
                          </h4>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeField(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Field Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Field Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateField(index, { name: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="field_name"
                            />
                          </div>

                          {/* Field Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Data Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(index, { type: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                              {ELASTICSEARCH_FIELD_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={field.description}
                              onChange={(e) => updateField(index, { description: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Field description"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-800 font-medium">Error</span>
                    </div>
                    <p className="text-red-700 mt-1">{error}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Index
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexCreationForm;
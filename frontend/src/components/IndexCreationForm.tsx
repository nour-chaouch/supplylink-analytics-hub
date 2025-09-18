import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import { Plus, Trash2, AlertCircle, Info, Upload, FileText, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';

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

const ICON_OPTIONS = [
  { value: 'Database', label: 'Database', description: 'General data storage' },
  { value: 'BarChart3', label: 'Bar Chart', description: 'Analytics and reporting' },
  { value: 'TrendingUp', label: 'Trending Up', description: 'Growth and trends' },
  { value: 'Users', label: 'Users', description: 'User-related data' },
  { value: 'Package', label: 'Package', description: 'Product or inventory' },
  { value: 'MapPin', label: 'Map Pin', description: 'Location-based data' },
  { value: 'Calendar', label: 'Calendar', description: 'Time-based data' },
  { value: 'FileText', label: 'File Text', description: 'Document or text data' },
  { value: 'ShoppingCart', label: 'Shopping Cart', description: 'E-commerce data' },
  { value: 'Globe', label: 'Globe', description: 'Global or web data' },
  { value: 'Heart', label: 'Heart', description: 'Health or wellness data' },
  { value: 'Car', label: 'Car', description: 'Transportation data' },
  { value: 'Home', label: 'Home', description: 'Real estate or housing' },
  { value: 'Briefcase', label: 'Briefcase', description: 'Business data' },
  { value: 'Book', label: 'Book', description: 'Educational content' }
];

const IndexCreationForm: React.FC<IndexCreationFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [indexName, setIndexName] = useState('');
  const [indexTitle, setIndexTitle] = useState('');
  const [indexDescription, setIndexDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Database');
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
    setIndexTitle('');
    setIndexDescription('');
    setSelectedIcon('Database');
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

  // File analysis functions - optimized for large files
  const analyzeFileData = async (file: File): Promise<FieldDefinition[]> => {
    return new Promise((resolve, reject) => {
      // Check file size and warn for large files
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 100) {
        console.warn(`Large file detected: ${fileSizeMB.toFixed(2)}MB. Using optimized analysis.`);
      }

      // For very large files (>500MB), use chunked analysis
      if (fileSizeMB > 500) {
        console.log('Using chunked analysis for very large file...');
        analyzeLargeFileChunked(file).then(resolve).catch(reject);
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            analyzeJsonData(content, fileSizeMB).then(resolve).catch(reject);
          } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            analyzeCsvData(content, fileSizeMB).then(resolve).catch(reject);
          } else {
            throw new Error('Unsupported file type');
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Chunked analysis for very large files
  const analyzeLargeFileChunked = async (file: File): Promise<FieldDefinition[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Read first 10MB for analysis
      const chunkSize = Math.min(10 * 1024 * 1024, file.size); // 10MB or file size
      const firstChunk = file.slice(0, chunkSize);
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            // For JSON, try to parse just the first chunk
            const lines = content.split('\n');
            const firstLine = lines[0];
            
            if (firstLine.trim().startsWith('[')) {
              // It's a JSON array, try to extract some objects
              let jsonContent = firstLine;
              let braceCount = 0;
              let inString = false;
              let escapeNext = false;
              
              for (let i = 0; i < firstLine.length; i++) {
                const char = firstLine[i];
                if (escapeNext) {
                  escapeNext = false;
                  continue;
                }
                if (char === '\\') {
                  escapeNext = true;
                  continue;
                }
                if (char === '"' && !escapeNext) {
                  inString = !inString;
                  continue;
                }
                if (!inString) {
                  if (char === '{') braceCount++;
                  if (char === '}') braceCount--;
                  if (braceCount === 0 && i > 0) {
                    jsonContent = firstLine.substring(0, i + 1);
                    break;
                  }
                }
              }
              
              try {
                const sampleData = JSON.parse(jsonContent);
                const data = Array.isArray(sampleData) ? sampleData : [sampleData];
                resolve(analyzeFieldDefinitions(data));
              } catch (parseError) {
                // Fallback: create sample data based on file structure
                resolve(createSampleFieldDefinitions());
              }
            } else {
              // Single JSON object
              try {
                const data = JSON.parse(content);
                resolve(analyzeFieldDefinitions([data]));
              } catch (parseError) {
                resolve(createSampleFieldDefinitions());
              }
            }
          } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            analyzeCsvData(content, file.size / (1024 * 1024)).then(resolve).catch(reject);
          } else {
            throw new Error('Unsupported file type');
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file chunk'));
      reader.readAsText(firstChunk);
    });
  };

  // Create sample field definitions for very large files
  const createSampleFieldDefinitions = (): FieldDefinition[] => {
    return [
      { name: 'id', type: 'keyword', description: 'Unique identifier' },
      { name: 'name', type: 'text', description: 'Name or title' },
      { name: 'description', type: 'text', description: 'Description text' },
      { name: 'value', type: 'float', description: 'Numeric value' },
      { name: 'date', type: 'date', description: 'Date/time value' },
      { name: 'status', type: 'keyword', description: 'Status or category' }
    ];
  };

  // Optimized JSON analysis for large files
  const analyzeJsonData = async (content: string, fileSizeMB: number): Promise<FieldDefinition[]> => {
    try {
      const parsed = JSON.parse(content);
      const data = Array.isArray(parsed) ? parsed : [parsed];
      
      // For very large files, use smart sampling
      let sampleSize = data.length;
      if (fileSizeMB > 100) {
        // For files > 100MB, analyze up to 2000 records or 5% of data
        sampleSize = Math.min(2000, Math.floor(data.length * 0.05));
      } else if (fileSizeMB > 50) {
        // For files > 50MB, analyze up to 1000 records or 10% of data
        sampleSize = Math.min(1000, Math.floor(data.length * 0.1));
      }
      
      const sampleData = data.slice(0, sampleSize);
      
      console.log(`Analyzing ${sampleData.length} records from ${data.length} total records (${fileSizeMB.toFixed(2)}MB file)`);
      
      return analyzeFieldDefinitions(sampleData);
    } catch (error: any) {
      // If JSON parsing fails due to size, try to analyze just the first part
      console.warn('Full JSON parsing failed, attempting partial analysis...');
      const partialContent = content.substring(0, Math.min(1000000, content.length)); // First 1MB
      try {
        const partialParsed = JSON.parse(partialContent);
        const partialData = Array.isArray(partialParsed) ? partialParsed : [partialParsed];
        return analyzeFieldDefinitions(partialData);
      } catch (partialError: any) {
        throw new Error(`Unable to analyze JSON file: ${error.message}`);
      }
    }
  };

  // Optimized CSV analysis for large files
  const analyzeCsvData = async (content: string, fileSizeMB: number): Promise<FieldDefinition[]> => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // For large files, only analyze a sample of lines
    const totalLines = lines.length - 1; // Exclude header
    const sampleSize = fileSizeMB > 50 ? Math.min(1000, Math.floor(totalLines * 0.1)) : totalLines;
    const sampleLines = lines.slice(1, sampleSize + 1);
    
    console.log(`Analyzing ${sampleLines.length} lines from ${totalLines} total lines`);
    
    const data = sampleLines.filter(line => line.trim()).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index]?.trim() || '';
      });
      return obj;
    });
    
    return analyzeFieldDefinitions(data);
  };

  // Core field analysis logic
  const analyzeFieldDefinitions = (data: any[]): FieldDefinition[] => {
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
    
    return fieldAnalysis;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['application/json', 'text/csv'];
    const validExtensions = ['.json', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please select a JSON or CSV file.');
      return;
    }
    
    // For JSON files, do basic validation with chunked reading
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      try {
        // For very large files, use chunked reading
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 100) {
          console.log(`Large file detected: ${fileSizeMB.toFixed(2)}MB. Using chunked validation.`);
          // For very large files, just check the first and last few characters
          await validateLargeJsonFile(file);
        } else {
          // For smaller files, use the full text method
          const text = await file.text();
          const trimmed = text.trim();
          
          if (!trimmed) {
            setError('JSON file is empty.');
            return;
          }
          
          if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
            setError('Invalid JSON format. File must start with [ or {');
            return;
          }
        }
      } catch (error: any) {
        setError(`Invalid JSON file: ${error.message}`);
        return;
      }
    }
    
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

  // Validate large JSON files by reading chunks
  const validateLargeJsonFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Read first 1KB to check start
      const firstChunk = file.slice(0, 1024);
      reader.onload = (e) => {
        const firstText = e.target?.result as string;
        if (!firstText.trim()) {
          reject(new Error('JSON file is empty.'));
          return;
        }
        
        if (!firstText.trim().startsWith('[') && !firstText.trim().startsWith('{')) {
          reject(new Error('Invalid JSON format. File must start with [ or {'));
          return;
        }
        
        // Read last 1KB to check end
        const lastChunk = file.slice(file.size - 1024, file.size);
        const lastReader = new FileReader();
        lastReader.onload = (e) => {
          const lastText = e.target?.result as string;
          const trimmedLast = lastText.trim();
          
          if (firstText.trim().startsWith('[') && !trimmedLast.endsWith(']')) {
            reject(new Error('JSON array appears to be incomplete. Please check if the file was uploaded completely.'));
            return;
          }
          
          if (firstText.trim().startsWith('{') && !trimmedLast.endsWith('}')) {
            reject(new Error('JSON object appears to be incomplete. Please check if the file was uploaded completely.'));
            return;
          }
          
          resolve();
        };
        lastReader.onerror = () => reject(new Error('Failed to read file end'));
        lastReader.readAsText(lastChunk);
      };
      
      reader.onerror = () => reject(new Error('Failed to read file start'));
      reader.readAsText(firstChunk);
    });
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

    // Validate metadata fields
    if (!indexTitle.trim()) {
      setError('Index title is required');
      return;
    }
    if (!indexDescription.trim()) {
      setError('Index description is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mapping = generateMapping();
      const metadata = {
        title: indexTitle.trim(),
        description: indexDescription.trim(),
        icon: selectedIcon
      };
      await adminAPI.createElasticsearchIndex(indexName, mapping, metadata);
      onSuccess();
      resetForm();
      onClose(); // Close the dialog after successful creation
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
                  <p className="text-gray-600 mb-2">
                    Upload a sample data file to automatically detect field types and create your index schema
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
                    <p className="text-sm text-blue-800">
                      <strong>Large files supported:</strong> Upload any size file for field analysis. 
                      The system will automatically optimize processing for large datasets.
                    </p>
                  </div>
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

                {selectedFile && !fileAnalysisLoading && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setAnalyzedFields([]);
                          setCurrentStep(1);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
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
                    {selectedFile && (selectedFile.size / (1024 * 1024)) > 50 && (
                      <span className="block mt-1 text-xs text-green-600">
                        Analysis based on sample data for optimal performance
                      </span>
                    )}
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
                {/* Index Metadata */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Index Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Index Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={indexTitle}
                        onChange={(e) => setIndexTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="My Custom Index"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Human-readable title for the index
                      </p>
                    </div>
                  </div>

                  {/* Index Description */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={indexDescription}
                      onChange={(e) => setIndexDescription(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe what this index contains and its purpose..."
                      rows={3}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Brief description of the index content and purpose
                    </p>
                  </div>

                  {/* Icon Selection */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() => setSelectedIcon(icon.value)}
                          className={`p-3 border rounded-lg text-center hover:bg-gray-50 ${
                            selectedIcon === icon.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 text-gray-600'
                          }`}
                          title={icon.description}
                        >
                          <div className="text-lg mb-1">{icon.label}</div>
                          <div className="text-xs">{icon.value}</div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose an icon that represents your index
                    </p>
                  </div>
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
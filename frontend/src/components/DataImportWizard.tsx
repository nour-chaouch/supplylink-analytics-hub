import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  X,
  Eye,
  Settings,
  Database,
  CheckSquare
} from 'lucide-react';
import { adminAPI } from '../services/api';

// Default file size limit (fallback when backend is not available)
const DEFAULT_FILE_SIZE_MB = 50;

// Helper function to generate default supported formats
const getDefaultSupportedFormats = (maxSizeMB: number = DEFAULT_FILE_SIZE_MB) => [
  { extension: '.json', description: 'JavaScript Object Notation files', maxSize: `${maxSizeMB}MB`, mimetype: 'application/json' },
  { extension: '.csv', description: 'Comma-separated values files', maxSize: `${maxSizeMB}MB`, mimetype: 'text/csv' },
  { extension: '.xlsx', description: 'Microsoft Excel files (modern)', maxSize: `${maxSizeMB}MB`, mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { extension: '.xls', description: 'Microsoft Excel files (legacy)', maxSize: `${maxSizeMB}MB`, mimetype: 'application/vnd.ms-excel' }
];

interface DataImportWizardProps {
  indexName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SupportedFormat {
  extension: string;
  description: string;
  maxSize: string;
  mimetype: string;
}

interface CompatibilityInfo {
  indexName: string;
  exists: boolean;
  hasPredefinedMapping: boolean;
  predefinedFields: string[];
  currentMapping: string[];
  compatibility: {
    description: string;
    recommendedFields?: string[];
    fieldTypes?: Array<{ field: string; type: string }>;
    note?: string;
  };
}

interface FieldAnalysis {
  field: string;
  type: string;
  sampleValues: any[];
  nullable: boolean;
  unique: boolean;
  compatible: boolean;
  recommendedType?: string;
  issues?: string[];
  isPredefinedField?: boolean;
  isAutoConvertible?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compatibility: {
    score: number;
    matchedFields: string[];
    missingFields: string[];
    incompatibleFields: string[];
  };
  fieldAnalysis: FieldAnalysis[];
  totalRecords: number;
  sampleData: any[];
}

const DataImportWizard: React.FC<DataImportWizardProps> = ({ 
  indexName, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<SupportedFormat[]>([]);
  const [compatibilityInfo, setCompatibilityInfo] = useState<CompatibilityInfo | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [progressDetails, setProgressDetails] = useState<{
    processed: number;
    total: number;
    imported: number;
    errors: number;
  } | null>(null);

  const totalSteps = 6;

  // Load supported formats and compatibility info
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, indexName]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load supported formats
      console.log('Loading supported formats...');
      const formatsResponse = await adminAPI.getSupportedFormats();
      console.log('Formats response:', formatsResponse.data);
      
      if (formatsResponse.data.success) {
        setSupportedFormats(formatsResponse.data.data.formats);
        console.log('Supported formats loaded:', formatsResponse.data.data.formats);
      } else {
        console.warn('Failed to load supported formats:', formatsResponse.data.message);
        // Set default formats as fallback
        setSupportedFormats(getDefaultSupportedFormats());
      }

      // Load compatibility info
      console.log('Loading compatibility info for index:', indexName);
      const compatibilityResponse = await adminAPI.getIndexCompatibility(indexName);
      console.log('Compatibility response:', compatibilityResponse.data);
      
      if (compatibilityResponse.data.success) {
        const schemaData = compatibilityResponse.data.data;
        // Transform schema response to compatibility info format
        const transformedCompatibilityInfo = {
          indexName: schemaData.indexName,
          exists: true,
          hasPredefinedMapping: schemaData.hasPredefinedMapping,
          predefinedFields: schemaData.fields ? schemaData.fields.map((f: any) => f.name) : [],
          currentMapping: schemaData.fields ? schemaData.fields.map((f: any) => f.name) : [],
          compatibility: {
            description: schemaData.hasPredefinedMapping 
              ? `Index has ${schemaData.totalFields} predefined fields with specific types`
              : 'Index uses dynamic mapping - new fields will be auto-detected',
            fieldTypes: schemaData.fields ? schemaData.fields.map((f: any) => ({ field: f.name, type: f.type })) : [],
            note: `Total fields: ${schemaData.totalFields || 0}, Required fields: ${schemaData.requiredFields || 0}`
          }
        };
        setCompatibilityInfo(transformedCompatibilityInfo);
        console.log('Compatibility info set:', transformedCompatibilityInfo);
      } else {
        console.warn('Failed to load compatibility info:', compatibilityResponse.data.message);
        // Set a default compatibility info for debugging
        setCompatibilityInfo({
          indexName,
          exists: true,
          hasPredefinedMapping: false,
          predefinedFields: [],
          currentMapping: [],
          compatibility: {
            description: 'Error loading compatibility info. Using dynamic mapping.',
            note: 'This index will use dynamic mapping for all fields.'
          }
        });
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      
      // Set default supported formats on error
      setSupportedFormats(getDefaultSupportedFormats());
      
      // Set default compatibility info on error
      setCompatibilityInfo({
        indexName,
        exists: true,
        hasPredefinedMapping: false,
        predefinedFields: [],
        currentMapping: [],
        compatibility: {
          description: 'Error loading compatibility info. Using dynamic mapping.',
          note: 'This index will use dynamic mapping for all fields.'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      // Auto-advance to next step
      setTimeout(() => setCurrentStep(2), 500);
    }
  };

  const analyzeFieldTypes = (data: any[]): FieldAnalysis[] => {
    if (data.length === 0) return [];

    const fieldAnalysis: FieldAnalysis[] = [];
    const allFields = new Set<string>();
    
    // Collect all unique fields
    data.forEach(record => {
      Object.keys(record).forEach(field => allFields.add(field));
    });

    allFields.forEach(field => {
      // Skip MongoDB-specific fields that shouldn't be analyzed
      const mongoFieldsToSkip = ['_id', '__v', 'createdAt', 'updatedAt'];
      if (mongoFieldsToSkip.includes(field)) {
        return;
      }
      
      const values = data.map(record => record[field]).filter(v => v !== null && v !== undefined);
      const uniqueValues = new Set(values);
      
      // Detect field type
      let detectedType = 'text';
      let recommendedType = 'text';
      const issues: string[] = [];
      
      if (values.length === 0) {
        detectedType = 'null';
        recommendedType = 'text';
        issues.push('All values are null or undefined');
      } else {
        // Check for MongoDB ObjectId
        if (field === '_id' && values.some(v => typeof v === 'object' && v.$oid)) {
          detectedType = 'mongodb_objectid';
          recommendedType = 'keyword';
        }
        // Check for MongoDB Date (both object format and stringified)
        else if (values.some(v => 
          (typeof v === 'object' && v.$date) || 
          (typeof v === 'string' && v.includes('$date'))
        )) {
          detectedType = 'mongodb_date';
          recommendedType = 'date';
        }
        // Check for numbers
        else if (values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))) {
          const numericValues = values.map(v => Number(v));
          if (numericValues.every(v => Number.isInteger(v))) {
            detectedType = 'integer';
            recommendedType = 'integer';
          } else {
            detectedType = 'float';
            recommendedType = 'float';
          }
        }
        // Check for booleans
        else if (values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
          detectedType = 'boolean';
          recommendedType = 'boolean';
        }
        // Check for dates
        else if (values.every(v => {
          if (typeof v === 'string') {
            const date = new Date(v);
            return !isNaN(date.getTime());
          }
          return false;
        })) {
          detectedType = 'date_string';
          recommendedType = 'date';
        }
        // Check for short text (likely keywords)
        else if (values.every(v => typeof v === 'string' && v.length < 50)) {
          detectedType = 'short_text';
          recommendedType = 'keyword';
        }
        // Default to text
        else {
          detectedType = 'text';
          recommendedType = 'text';
        }
      }

      // Helper function to check if types are auto-convertible
      const areTypesAutoConvertible = (expectedType: string, detectedType: string): boolean => {
        // Exact match
        if (expectedType === detectedType) return true;
        
        // Auto-convertible text types (including integer to keyword)
        if ((expectedType === 'text' || expectedType === 'keyword') && 
            (detectedType === 'text' || detectedType === 'keyword' || detectedType === 'short_text' || detectedType === 'integer' || detectedType === 'number')) {
          return true;
        }
        
        // Auto-convertible numeric types  
        if ((expectedType === 'integer' || expectedType === 'long') && 
            (detectedType === 'integer' || detectedType === 'long' || detectedType === 'number')) {
          return true;
        }
        
        if ((expectedType === 'float' || expectedType === 'double') && 
            (detectedType === 'float' || detectedType === 'double' || detectedType === 'number' || detectedType === 'integer')) {
          return true;
        }
        
        // Auto-convertible boolean types
        if (expectedType === 'boolean' && 
            (detectedType === 'boolean' || detectedType === 'text' || detectedType === 'keyword')) {
          return true;
        }
        
        // Auto-convertible date types (including mongodb_date)
        if (expectedType === 'date' && 
            (detectedType === 'date' || detectedType === 'mongodb_date' || detectedType === 'text' || detectedType === 'keyword' || detectedType === 'number')) {
          return true;
        }
        
        return false;
      };

      // Check compatibility with index mapping
      let compatible = true;
      let isPredefinedField = false;
      let expectedType = null;
      let isAutoConvertible = false;
      
      if (compatibilityInfo?.compatibility.fieldTypes) {
        const expectedField = compatibilityInfo?.compatibility?.fieldTypes?.find(f => f.field === field);
        if (expectedField) {
          isPredefinedField = true;
          expectedType = expectedField.type;
          
          // Update recommendedType to match the expected type from index
          recommendedType = expectedType;
          
          // Check if types are auto-convertible
          if (expectedType !== detectedType) {
            if (areTypesAutoConvertible(expectedType, detectedType)) {
              // Types are different but auto-convertible
              compatible = true;
              isAutoConvertible = true;
              issues.push(`Will auto-convert from '${detectedType}' to '${expectedType}'`);
            } else {
              // Types are incompatible and cannot be auto-converted
              compatible = false;
              issues.push(`Expected '${expectedType}' but detected '${detectedType}' - cannot auto-convert`);
            }
          }
        } else {
          // Field not in predefined mapping - will be added with dynamic mapping
          issues.push('Field not in predefined mapping - will use dynamic mapping');
        }
      }

      fieldAnalysis.push({
        field,
        type: detectedType,
        sampleValues: Array.from(uniqueValues).slice(0, 3),
        nullable: values.length < data.length,
        unique: uniqueValues.size === values.length,
        compatible,
        recommendedType,
        issues: issues.length > 0 ? issues : undefined,
        isPredefinedField,
        isAutoConvertible
      });
    });

    return fieldAnalysis.sort((a, b) => {
      // Sort by compatibility first, then by field name
      if (a.compatible !== b.compatible) {
        return a.compatible ? 1 : -1;
      }
      return a.field.localeCompare(b.field);
    });
  };

  const validateFile = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      // Parse file data based on file type
      let parsedData: any[] = [];
      
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        // Parse JSON file
        const text = await selectedFile.text();
        const jsonData = JSON.parse(text);
        parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        // Parse CSV file with better handling of quoted values
        const text = await selectedFile.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          // Simple CSV parser that handles quoted values
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
          parsedData = lines.slice(1).map(line => {
            const values = parseCSVLine(line).map(v => v.replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          }).filter(obj => Object.values(obj).some(v => v !== ''));
        }
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        // For Excel files, we'll need to use a library or send to backend
        // For now, create a mock validation that allows continuation
        parsedData = []; // Empty for now, backend will handle parsing
        
        // Create a validation result that allows Excel files to proceed
        const validationResult: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: ['Excel files will be parsed by the backend during import. Preview is not available.'],
          compatibility: {
            score: 0,
            matchedFields: [],
            missingFields: [],
            incompatibleFields: []
          },
          fieldAnalysis: [],
          totalRecords: 0,
          sampleData: []
        };

        setValidationResult(validationResult);
        setParsedData([]);
        setCurrentStep(3);
        return;
      }

      // Analyze field types and compatibility
      const fieldAnalysis = analyzeFieldTypes(parsedData);
      
      // Create validation result based on parsed data
      const validationResult: ValidationResult = {
        isValid: parsedData.length > 0,
        errors: parsedData.length === 0 ? ['No valid data found in file'] : [],
        warnings: [],
        compatibility: {
          score: 0,
          matchedFields: [],
          missingFields: [],
          incompatibleFields: []
        },
        fieldAnalysis,
        totalRecords: parsedData.length,
        sampleData: parsedData.slice(0, 5)
      };

      // If we have parsed data, check compatibility
      console.log('Checking compatibility with:', compatibilityInfo);
      
      if (parsedData.length > 0 && compatibilityInfo?.compatibility?.fieldTypes && compatibilityInfo?.compatibility?.fieldTypes.length > 0) {
        // Filter out MongoDB-specific fields that shouldn't be considered for compatibility
        const mongoFieldsToSkip = ['_id', '__v', 'createdAt', 'updatedAt'];
        const actualFields = fieldAnalysis
          .map(f => f.field)
          .filter(field => !mongoFieldsToSkip.includes(field));
        const expectedFields = compatibilityInfo?.compatibility?.fieldTypes?.map(ft => ft.field) || [];
        
        console.log('Actual fields:', actualFields);
        console.log('Expected fields:', expectedFields);
        
        let matchedCount = 0;
        let typeCompatibleCount = 0;
        
        expectedFields.forEach(field => {
          if (actualFields.includes(field)) {
            validationResult.compatibility.matchedFields.push(field);
            matchedCount++;
            
            // Check if the field type is also compatible
            const fieldAnalysisItem = fieldAnalysis.find(f => f.field === field);
            if (fieldAnalysisItem && fieldAnalysisItem.compatible) {
              typeCompatibleCount++;
            }
          } else {
            validationResult.compatibility.missingFields.push(field);
          }
        });

        actualFields.forEach(field => {
          if (!expectedFields.includes(field)) {
            validationResult.compatibility.incompatibleFields.push(field);
          }
        });

        // Calculate compatibility score based on both field presence and type compatibility
        // Weight: 70% for field presence, 30% for type compatibility
        const fieldPresenceScore = expectedFields.length > 0 ? (matchedCount / expectedFields.length) * 70 : 0;
        const typeCompatibilityScore = matchedCount > 0 ? (typeCompatibleCount / matchedCount) * 30 : 0;
        
        validationResult.compatibility.score = Math.round(fieldPresenceScore + typeCompatibilityScore);

        console.log('Compatibility calculation:', {
          matchedCount,
          expectedFields: expectedFields.length,
          typeCompatibleCount,
          fieldPresenceScore,
          typeCompatibilityScore,
          finalScore: validationResult.compatibility.score
        });

        // Add warnings based on compatibility
        if (validationResult.compatibility.score < 50) {
          validationResult.warnings.push(`Low compatibility score (${validationResult.compatibility.score}%). Consider using a different index or updating your data structure.`);
        }

        if (validationResult.compatibility.missingFields.length > 0) {
          validationResult.warnings.push(`Missing recommended fields: ${validationResult.compatibility.missingFields.join(', ')}`);
        }

        if (validationResult.compatibility.incompatibleFields.length > 0) {
          validationResult.warnings.push(`Extra fields detected: ${validationResult.compatibility.incompatibleFields.join(', ')}. These will be added with dynamic mapping.`);
        }

        // Add warnings for incompatible field types
        const incompatibleFields = fieldAnalysis.filter(f => !f.compatible);
        if (incompatibleFields.length > 0) {
          validationResult.warnings.push(`${incompatibleFields.length} field(s) have type compatibility issues. Check the field analysis below.`);
        }
      } else if (parsedData.length > 0) {
        // If no predefined mapping, calculate score based on field type compatibility only
        const compatibleFields = fieldAnalysis.filter(f => f.compatible);
        validationResult.compatibility.score = fieldAnalysis.length > 0 
          ? Math.round((compatibleFields.length / fieldAnalysis.length) * 100)
          : 100;
        
        console.log('No predefined mapping - using dynamic mapping score:', {
          compatibleFields: compatibleFields.length,
          totalFields: fieldAnalysis.length,
          score: validationResult.compatibility.score
        });
      }

      setValidationResult(validationResult);
      setParsedData(parsedData);

      if (validationResult.isValid) {
        setCurrentStep(3);
      } else {
        setError(validationResult.errors.join(', '));
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setError(`Failed to parse file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setImportProgress(0);

    try {
      // Move to progress step
      setCurrentStep(5);
      
      // Use the new progress tracking endpoint
      const response = await adminAPI.importElasticsearchDataWithProgress(indexName, selectedFile, 1000);
      
      // Handle Server-Sent Events
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('SSE Data received:', data);
              
              if (data.type === 'start') {
                console.log('Import started:', data);
                setProgressDetails({
                  processed: 0,
                  total: data.total,
                  imported: 0,
                  errors: 0
                });
              } else if (data.type === 'progress') {
                setImportProgress(data.progress);
                setProgressDetails({
                  processed: data.processed,
                  total: data.total,
                  imported: data.imported,
                  errors: data.errors
                });
                console.log(`Progress: ${data.progress}% - Processed: ${data.processed}/${data.total}, Imported: ${data.imported}, Errors: ${data.errors}`);
              } else if (data.type === 'complete') {
                setImportProgress(100);
                setImportResult({
                  success: true,
                  data: {
                    imported: data.imported,
                    errors: data.errors,
                    total: data.total
                  }
                });
                setCurrentStep(6);
                onSuccess();
                break;
              } else if (data.type === 'error') {
                setError(data.error);
                break;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError, 'Line:', line);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Import failed');
      
      // Fallback to regular import if SSE fails
      console.log('SSE failed, falling back to regular import...');
      try {
        const fallbackResponse = await adminAPI.importElasticsearchData(indexName, selectedFile);
        if (fallbackResponse.data.success) {
          setImportResult(fallbackResponse.data);
          setCurrentStep(6);
          onSuccess();
        } else {
          setError(fallbackResponse.data.message);
        }
      } catch (fallbackErr: any) {
        console.error('Fallback import also failed:', fallbackErr);
        setError(fallbackErr.response?.data?.message || 'Import failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setValidationResult(null);
    setParsedData([]);
    setError(null);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (step === currentStep) return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const getStepTitle = (step: number) => {
    const titles = [
      'Select File',
      'Validate Format',
      'Preview Data',
      'Confirm Import',
      'Import Complete'
    ];
    return titles[step - 1];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Data to {indexName}</h2>
            <p className="text-gray-600">Step-by-step data import wizard</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i + 1} className="flex items-center">
                <div className="flex items-center space-x-2">
                  {getStepIcon(i + 1)}
                  <span className={`text-sm font-medium ${
                    i + 1 <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {getStepTitle(i + 1)}
                  </span>
                </div>
                {i < totalSteps - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: File Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select Your Data File</h3>
                <p className="text-gray-600">Choose a file to import into the {indexName} index</p>
              </div>

              {/* Supported Formats */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Supported Formats:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {supportedFormats.map((format) => (
                    <div key={format.extension} className="text-sm text-blue-800">
                      <span className="font-medium">{format.extension}</span> - {format.description} (max {format.maxSize})
                    </div>
                  ))}
                </div>
              </div>

              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <FileText className="h-12 w-12 text-gray-400" />
                  <span className="text-lg font-medium text-gray-700">
                    Click to select file or drag and drop
                  </span>
                  <span className="text-sm text-gray-500">
                    JSON, CSV, or Excel files supported
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-800">File Selected:</span>
                  </div>
                  <p className="text-green-700 mt-1">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Validation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Settings className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Validating File</h3>
                <p className="text-gray-600">Checking file format and compatibility</p>
              </div>

              {selectedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">File Information:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedFile.name}</div>
                    <div><span className="font-medium">Size:</span> {(selectedFile.size / 1024).toFixed(1)} KB</div>
                    <div><span className="font-medium">Type:</span> {selectedFile.type}</div>
                    <div><span className="font-medium">Target Index:</span> {indexName}</div>
                  </div>
                </div>
              )}

              {/* Index Schema Metadata */}
              {compatibilityInfo && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Index Schema: {compatibilityInfo?.indexName || 'Loading...'}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Index Status:</span>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${compatibilityInfo?.exists ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-blue-700">{compatibilityInfo?.exists ? 'Exists' : 'Does not exist'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${compatibilityInfo?.hasPredefinedMapping ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          <span className="text-blue-700">{compatibilityInfo?.hasPredefinedMapping ? 'Predefined mapping' : 'Dynamic mapping'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-blue-800">Field Count:</span>
                      <div className="mt-1 space-y-1">
                        <div className="text-blue-700">Predefined: {compatibilityInfo?.predefinedFields?.length || 0}</div>
                        <div className="text-blue-700">Current: {compatibilityInfo?.currentMapping?.length || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="font-medium text-blue-800">Description:</span>
                    <p className="text-blue-700 text-sm mt-1">{compatibilityInfo?.compatibility?.description || 'Loading...'}</p>
                    {compatibilityInfo?.compatibility?.note && (
                      <p className="text-blue-600 text-xs mt-1 italic">{compatibilityInfo?.compatibility?.note}</p>
                    )}
                  </div>

                  {compatibilityInfo?.compatibility?.recommendedFields && compatibilityInfo?.compatibility?.recommendedFields.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-blue-800">Recommended Fields:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {compatibilityInfo?.compatibility?.recommendedFields?.map((field) => (
                          <span key={field} className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {compatibilityInfo?.compatibility?.fieldTypes && compatibilityInfo?.compatibility?.fieldTypes.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-blue-800">Field Types:</span>
                      <div className="mt-1 space-y-1">
                        {compatibilityInfo?.compatibility?.fieldTypes?.map((fieldType) => (
                          <div key={fieldType.field} className="text-xs text-blue-700">
                            <span className="font-medium">{fieldType.field}</span>: <span className="text-blue-600">{fieldType.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={validateFile}
                  disabled={loading}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckSquare className="h-5 w-5 mr-2" />}
                  Validate File
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Eye className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Preview Data</h3>
                <p className="text-gray-600">Review your data before importing</p>
              </div>

              {/* Validation Results */}
              {validationResult && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-800">Validation Passed</span>
                    </div>
                    <div className="text-sm text-green-700">
                      Compatibility Score: <span className="font-bold">{validationResult.compatibility.score}%</span>
                    </div>
                    {/* Debug info */}
                    <div className="mt-2 text-xs text-green-600 bg-green-100 p-2 rounded">
                      <div>Matched Fields: {validationResult.compatibility.matchedFields.length}/{compatibilityInfo?.compatibility?.fieldTypes?.length || 0}</div>
                      <div>Missing Fields: {validationResult.compatibility.missingFields.length}</div>
                      <div>Extra Fields: {validationResult.compatibility.incompatibleFields.length}</div>
                      <div>Total Fields in Data: {validationResult.fieldAnalysis.length}</div>
                    </div>
                  </div>

                  {validationResult.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold text-yellow-800">Warnings</span>
                      </div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Field Analysis */}
              {validationResult?.fieldAnalysis && validationResult.fieldAnalysis.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Field Analysis & Compatibility:</h4>
                  <div className="space-y-3">
                    {validationResult.fieldAnalysis.map((field) => (
                      <div key={field.field} className={`border rounded-lg p-3 ${
                        field.compatible 
                          ? field.isAutoConvertible 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{field.field}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              field.compatible 
                                ? field.isAutoConvertible 
                                  ? 'bg-blue-200 text-blue-800' 
                                  : 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {field.compatible 
                                ? field.isAutoConvertible 
                                  ? 'Auto-convertible' 
                                  : 'Compatible'
                                : 'Incompatible'}
                            </span>
                            {field.isPredefinedField && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-200 text-blue-800">
                                Predefined
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Detected: <span className="font-medium">{field.type}</span> → 
                            Recommended: <span className="font-medium">{field.recommendedType}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Sample Values:</span>
                            <div className="mt-1 space-y-1">
                              {field.sampleValues.map((value, i) => (
                                <div key={i} className="text-xs bg-white px-2 py-1 rounded border">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">Nullable:</span> 
                                <span className={`ml-1 ${field.nullable ? 'text-orange-600' : 'text-green-600'}`}>
                                  {field.nullable ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Unique:</span> 
                                <span className={`ml-1 ${field.unique ? 'text-green-600' : 'text-gray-600'}`}>
                                  {field.unique ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {field.issues && field.issues.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {field.issues.map((issue, i) => {
                              const isAutoConversion = issue.includes('Will auto-convert');
                              const isWarning = issue.includes('dynamic mapping') || issue.includes('not in predefined mapping');
                              const isError = !isAutoConversion && !isWarning;
                              
                              return (
                                <div key={i} className={`p-2 border rounded text-xs ${
                                  isAutoConversion 
                                    ? 'bg-blue-50 border-blue-200 text-blue-800' 
                                    : isWarning 
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    : 'bg-red-100 border-red-200 text-red-800'
                                }`}>
                                  <span className="font-medium">
                                    {isAutoConversion ? 'Auto-conversion:' : isWarning ? 'Note:' : 'Issue:'}
                                  </span> {issue}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Data Preview:</h4>
                {validationResult?.sampleData && validationResult.sampleData.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(validationResult.sampleData[0]).map((key) => (
                              <th key={key} className="text-left p-2 font-medium">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {validationResult.sampleData.map((row, index) => (
                            <tr key={index} className="border-b">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="p-2 text-xs">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Showing first 5 of {validationResult.totalRecords} records
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Preview not available for this file type</p>
                    <p className="text-xs">Data will be parsed during import</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm Import */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Database className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Confirm Import</h3>
                <p className="text-gray-600">Review import settings and confirm</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Target Index:</span>
                    <p className="text-gray-700">{indexName}</p>
                  </div>
                  <div>
                    <span className="font-medium">File:</span>
                    <p className="text-gray-700">{selectedFile?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Records:</span>
                    <p className="text-gray-700">{parsedData.length}</p>
                  </div>
                  <div>
                    <span className="font-medium">Compatibility:</span>
                    <p className="text-gray-700">{validationResult?.compatibility.score}%</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                  Start Import
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Import Progress */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center">
              <Database className="h-16 w-16 text-blue-500 mx-auto" />
              <h3 className="text-xl font-semibold text-blue-800">Importing Data</h3>
              <p className="text-gray-600">Please wait while your data is being imported...</p>
              
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{Math.round(importProgress)}% complete</span>
                  {progressDetails && (
                    <span>{progressDetails.processed.toLocaleString()} / {progressDetails.total.toLocaleString()} records</span>
                  )}
                </div>
                
                {progressDetails && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="font-medium text-green-800">Imported</div>
                      <div className="text-green-700">{progressDetails.imported.toLocaleString()}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="font-medium text-red-800">Errors</div>
                      <div className="text-red-700">{progressDetails.errors.toLocaleString()}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="font-medium text-blue-800">Total</div>
                      <div className="text-blue-700">{progressDetails.total.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Import Complete */}
          {currentStep === 6 && (
            <div className="space-y-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-green-800">Import Successful!</h3>
              
              {importResult && importResult.data && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Records Imported:</span>
                      <p className="text-green-700">{importResult.data.imported || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">Errors:</span>
                      <p className="text-green-700">{importResult.data.errors || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Records:</span>
                      <p className="text-green-700">{importResult.data.total || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Format:</span>
                      <p className="text-green-700">{selectedFile?.name?.split('.').pop()?.toUpperCase() || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-800">Error:</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="flex space-x-2">
            {currentStep > 1 && currentStep < 5 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {(currentStep === 6 && importResult) ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportWizard;

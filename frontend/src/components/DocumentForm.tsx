import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';

interface FieldSchema {
  name: string;
  type: string;
  inputType: string;
  required: boolean;
  description: string;
  example: string;
  validation: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    step?: number;
  };
  options?: Array<{ value: any; label: string }>;
}

interface IndexSchema {
  indexName: string;
  fields: FieldSchema[];
  hasPredefinedMapping: boolean;
  totalFields: number;
  requiredFields: number;
}

interface DocumentFormProps {
  indexName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (document: any) => void;
  initialData?: any;
  mode: 'create' | 'edit';
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  indexName,
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  mode = 'create'
}) => {
  const [schema, setSchema] = useState<IndexSchema | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  
  // Track initialization to prevent infinite loops
  const initializedRef = useRef<string>('');
  
  // Debug: Log component props only when opening
  if (isOpen) {
    console.log('DocumentForm opened:', { indexName, mode });
  }

  useEffect(() => {
    if (isOpen) {
      // Reset form state when opening
      setFormData({});
      setErrors({});
      setSchema(null);
      initializedRef.current = '';
      loadSchema();
    }
  }, [isOpen, indexName]);

  useEffect(() => {
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) {
      return;
    }

    // Create a unique key for this initialization
    const initKey = `${indexName}-${mode}-${schema.fields.length}`;
    
    // Prevent re-initialization if we've already done it
    if (initializedRef.current === initKey) {
      return;
    }

    console.log('Form initialization - schema loaded, mode:', mode);
    
    if (mode === 'edit' && initialData && Object.keys(initialData).length > 0) {
      // Initialize form with existing data for edit mode
      console.log('Setting form data to initial data:', initialData);
      setFormData({ ...initialData });
    } else {
      // Initialize form with empty data for create mode
      const emptyData: any = {};
      schema.fields.forEach(field => {
        if (field.example && mode === 'create') {
          // Pre-fill with example values for better UX
          if (field.type === 'boolean') {
            emptyData[field.name] = field.example === 'true';
          } else if (field.type === 'integer' || field.type === 'float') {
            emptyData[field.name] = Number(field.example);
          } else if (field.type === 'date') {
            emptyData[field.name] = field.example;
          } else {
            emptyData[field.name] = field.example;
          }
        } else {
          // Set default values based on type
          if (field.type === 'boolean') {
            emptyData[field.name] = false;
          } else if (field.type === 'integer' || field.type === 'float') {
            emptyData[field.name] = '';
          } else {
            emptyData[field.name] = '';
          }
        }
      });
      console.log('Setting form data to empty data:', emptyData);
      setFormData(emptyData);
    }
    
    // Mark as initialized
    initializedRef.current = initKey;
  }, [schema, mode, indexName]); // Stable dependencies only

  const loadSchema = async () => {
    setSchemaLoading(true);
    try {
      const response = await adminAPI.getIndexSchema(indexName);
      console.log('Schema response:', response);
      console.log('Response data:', response?.data);
      console.log('Response data.data:', response?.data?.data);
      
      if (response?.data?.data) {
        // Handle nested response structure
        const schemaData = response.data.data;
        if (!schemaData.fields) {
          schemaData.fields = [];
        }
        setSchema(schemaData);
      } else if (response?.data) {
        // Handle direct response
        const schemaData = response.data;
        if (!schemaData.fields) {
          schemaData.fields = [];
        }
        setSchema(schemaData);
      } else {
        console.error('Invalid schema response structure:', response);
        setSchema(null);
      }
    } catch (error: any) {
      console.error('Failed to load schema:', error);
      setSchema(null);
    } finally {
      setSchemaLoading(false);
    }
  };

  const validateField = (field: FieldSchema, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.name} is required`;
    }

    if (value === '' || value === null || value === undefined) {
      return null; // Skip validation for empty optional fields
    }

    const validation = field.validation;

    if (field.type === 'integer' || field.type === 'float') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field.name} must be a valid number`;
      }
      if (validation.min !== undefined && numValue < validation.min) {
        return `${field.name} must be at least ${validation.min}`;
      }
      if (validation.max !== undefined && numValue > validation.max) {
        return `${field.name} must be at most ${validation.max}`;
      }
    }

    if (field.type === 'keyword' || field.type === 'text') {
      const strValue = String(value);
      if (validation.minLength && strValue.length < validation.minLength) {
        return `${field.name} must be at least ${validation.minLength} characters`;
      }
      if (validation.maxLength && strValue.length > validation.maxLength) {
        return `${field.name} must be at most ${validation.maxLength} characters`;
      }
    }

    if (field.inputType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return `${field.name} must be a valid email address`;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) return false;

    const newErrors: Record<string, string> = {};
    let isValid = true;

    schema.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field if it exists
    if (errors[fieldName]) {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Convert form data to appropriate types
      const processedData: any = {};
      
      if (schema && schema.fields && Array.isArray(schema.fields)) {
        schema.fields.forEach(field => {
          let value = formData[field.name];
          
          // Skip empty optional fields
          if (!field.required && (value === '' || value === null || value === undefined)) {
            return;
          }
          
          // Type conversion
          if (field.type === 'integer') {
            processedData[field.name] = parseInt(value, 10);
          } else if (field.type === 'float') {
            processedData[field.name] = parseFloat(value);
          } else if (field.type === 'boolean') {
            processedData[field.name] = Boolean(value);
          } else if (field.type === 'date') {
            // Convert datetime-local to ISO string
            if (value) {
              processedData[field.name] = new Date(value).toISOString();
            }
          } else {
            processedData[field.name] = value;
          }
        });
      }

      await onSubmit(processedData);
      onClose();
    } catch (error: any) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FieldSchema) => {
    const rawValue = formData[field.name];
    const value = rawValue !== undefined && rawValue !== null ? rawValue : '';
    const error = errors[field.name];
    
    // Only log if there are issues with the field
    if (rawValue === undefined && formData && Object.keys(formData).length > 0) {
      console.log(`Field ${field.name} missing in formData:`, formData);
    }

    const baseClasses = `w-full p-3 border rounded-md ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

    const fieldId = `field-${field.name}`;

    return (
      <div key={field.name} className="space-y-2">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {field.name}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.type && (
            <span className="text-xs text-gray-500 ml-2">({field.type})</span>
          )}
        </label>
        
        {field.description && (
          <p className="text-xs text-gray-600">{field.description}</p>
        )}

        {field.inputType === 'textarea' ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
            rows={3}
            placeholder={field.example || `Enter ${field.name}...`}
          />
        ) : field.inputType === 'select' ? (
          <select
            id={fieldId}
            value={value.toString()}
            onChange={(e) => {
              const selectedValue = field.options?.find(opt => opt.value.toString() === e.target.value)?.value;
              handleFieldChange(field.name, selectedValue);
            }}
            className={baseClasses}
          >
            <option value="">Select {field.name}...</option>
            {field.options?.map(option => (
              <option key={option.value.toString()} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.inputType === 'number' ? (
          <input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
            placeholder={field.example || `Enter ${field.name}...`}
            min={field.validation.min}
            max={field.validation.max}
            step={field.validation.step}
          />
        ) : field.inputType === 'datetime-local' ? (
          <input
            id={fieldId}
            type="datetime-local"
            value={(() => {
              try {
                if (!value) return '';
                const dateValue = new Date(value).toISOString().slice(0, -1);
                console.log(`DateTime field ${field.name} - raw value:`, value, 'formatted:', dateValue);
                return dateValue;
              } catch (e) {
                console.error(`DateTime field ${field.name} formatting error:`, e);
                return '';
              }
            })()}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
          />
        ) : (
          <input
            id={fieldId}
            type={field.inputType}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
            placeholder={field.example || `Enter ${field.name}...`}
            minLength={field.validation.minLength}
            maxLength={field.validation.maxLength}
          />
        )}

        {error && (
          <p className="text-red-500 text-xs">{error}</p>
        )}
        
        {field.example && !error && (
          <p className="text-gray-400 text-xs">Example: {field.example}</p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add New Document' : 'Edit Document'}
            </h2>
            <p className="text-gray-600 mt-1">
              Index: <span className="font-mono">{indexName}</span>
              {schema && (
                <span className="ml-4">
                  {schema.requiredFields} required, {schema.totalFields} total fields
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {schemaLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading schema...</div>
            </div>
          ) : schema ? (
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {schema.fields && schema.fields.length > 0 ? (
                    schema.fields.map(renderField)
                  ) : (
                    <div className="col-span-2 text-center text-gray-500 py-8">
                      No fields found for this index
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  {Object.keys(errors).length > 0 && (
                    <span className="text-red-600">
                      Please fix {Object.keys(errors).length} error(s) before submitting
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : mode === 'create' ? 'Create Document' : 'Update Document'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-lg text-gray-600 mb-2">Failed to load schema</div>
                <button
                  onClick={loadSchema}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentForm;

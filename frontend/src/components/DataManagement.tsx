import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import DocumentForm from './DocumentForm';

interface Document {
  _id: string;
  _source: any;
  _score?: number;
}

interface DocumentData {
  documents: Document[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

interface DataManagementProps {
  indexName: string;
  onClose: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ indexName, onClose }) => {
  const [data, setData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // Bulk operations
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Sort fields
  const [availableSortFields, setAvailableSortFields] = useState<Array<{field: string, label: string, type: string}>>([
    { field: '_score', label: 'Relevance Score', type: 'score' }
  ]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [indexName, currentPage, pageSize, sortField, sortOrder, searchTerm]);

  useEffect(() => {
    loadSortFields();
  }, [indexName]);

  const loadSortFields = async () => {
    try {
      console.log('Loading sort fields for index:', indexName);
      const response = await adminAPI.getSortFields(indexName);
      console.log('Sort fields API response:', response);
      console.log('Response data:', response?.data);
      
      // Handle different response structures
      let sortFields;
      if (response?.data?.data?.sortableFields) {
        // Backend returns { success: true, data: { sortableFields: [...] } }
        sortFields = response.data.data.sortableFields;
      } else if (response?.data?.sortableFields) {
        // Backend returns { sortableFields: [...] }
        sortFields = response.data.sortableFields;
      } else if (Array.isArray(response?.data)) {
        // Backend returns array directly
        sortFields = response.data;
      } else {
        console.warn('Unexpected response structure:', response);
        sortFields = null;
      }
      
      console.log('Extracted sort fields:', sortFields);
      
      if (Array.isArray(sortFields) && sortFields.length > 0) {
        setAvailableSortFields(sortFields);
        console.log('Sort fields loaded successfully:', sortFields.length, 'fields');
      } else {
        console.warn('No valid sort fields found, using fallback');
        throw new Error('Invalid sort fields response - no valid array found');
      }
    } catch (err: any) {
      console.error('Failed to load sort fields:', err);
      console.error('Error details:', err.response?.data);
      
      // Fallback to default sort fields
      const fallbackFields = [
        { field: '_score', label: 'Relevance Score', type: 'score' },
        { field: 'createdAt', label: 'Created At', type: 'date' },
        { field: 'updatedAt', label: 'Updated At', type: 'date' },
        { field: 'scrapedAt', label: 'Scraped At', type: 'date' }
      ];
      
      console.log('Using fallback sort fields:', fallbackFields);
      setAvailableSortFields(fallbackFields);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading documents for index:', indexName, {
        page: currentPage,
        size: pageSize,
        search: searchTerm,
        sortField,
        sortOrder
      });
      
      const response = await adminAPI.getDocuments(indexName, {
        page: currentPage,
        size: pageSize,
        search: searchTerm,
        sortField,
        sortOrder
      });
      
      console.log('Full API response:', response);
      
      if (response?.data?.data) {
        // The API returns { success: true, data: { documents: [], ... } }
        const responseData = response.data.data;
        console.log('Documents response data:', responseData);
        
        // Ensure documents array exists
        if (!responseData.documents) {
          responseData.documents = [];
        }
        if (!Array.isArray(responseData.documents)) {
          console.error('Documents is not an array:', responseData.documents);
          responseData.documents = [];
        }
        setData(responseData);
      } else if (response?.data) {
        // Handle direct data response
        console.log('Direct response data:', response.data);
        const responseData = response.data;
        if (!responseData.documents) {
          responseData.documents = [];
        }
        if (!Array.isArray(responseData.documents)) {
          console.error('Documents is not an array:', responseData.documents);
          responseData.documents = [];
        }
        setData(responseData);
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response data');
      }
    } catch (err: any) {
      console.error('Load documents error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Failed to load documents');
      // Set empty data structure instead of null
      setData({
        documents: [],
        total: 0,
        page: 1,
        size: pageSize,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadDocuments();
  };

  const handleAddDocument = async (document: any) => {
    try {
      console.log('Creating document:', document);
      const response = await adminAPI.createDocument(indexName, document);
      console.log('Document created successfully:', response);
      
      // Immediate refresh since backend now uses refresh=true
      setRefreshing(true);
      await loadDocuments();
      setRefreshing(false);
      console.log('Document list refreshed after create');
    } catch (err: any) {
      console.error('Failed to create document:', err);
      setError(err.response?.data?.message || 'Failed to create document');
      throw err; // Re-throw to let the form handle the error
    }
  };

  const handleEditDocument = async (document: any) => {
    if (!selectedDocument) return;
    
    try {
      console.log('Updating document:', selectedDocument._id, document);
      const response = await adminAPI.updateDocument(indexName, selectedDocument._id, document);
      console.log('Document updated successfully:', response);
      
      setShowEditModal(false);
      setSelectedDocument(null);
      
      // Immediate refresh since backend now uses refresh=true
      setRefreshing(true);
      await loadDocuments();
      setRefreshing(false);
      console.log('Document list refreshed after update');
    } catch (err: any) {
      console.error('Failed to update document:', err);
      setError(err.response?.data?.message || 'Failed to update document');
      throw err; // Re-throw to let the form handle the error
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    const documentIdToDelete = selectedDocument._id;
    
    try {
      console.log('Deleting document:', documentIdToDelete);
      
      // Optimistic update: immediately remove from UI
      setData(prevData => {
        if (!prevData || !prevData.documents) return prevData;
        
        return {
          ...prevData,
          documents: prevData.documents.filter(doc => doc._id !== documentIdToDelete),
          total: Math.max(0, prevData.total - 1)
        };
      });
      
      setShowDeleteModal(false);
      setSelectedDocument(null);
      
      // Make the API call
      const response = await adminAPI.deleteDocument(indexName, documentIdToDelete);
      console.log('Document deleted successfully:', response);
      
      // Refresh to ensure consistency (but UI already updated optimistically)
      setTimeout(async () => {
        await loadDocuments();
        console.log('Document list refreshed after delete for consistency');
      }, 100);
      
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      setError(err.response?.data?.message || 'Failed to delete document');
      
      // Revert optimistic update on error
      console.log('Reverting optimistic delete due to error');
      await loadDocuments();
    }
  };

  const handleBulkDelete = async () => {
    const documentsToDelete = Array.from(selectedDocuments);
    
    try {
      const operations = documentsToDelete.map(id => ({
        action: 'delete' as const,
        documentId: id
      }));
      
      console.log('Bulk deleting documents:', operations);
      
      // Optimistic update: immediately remove from UI
      setData(prevData => {
        if (!prevData || !prevData.documents) return prevData;
        
        return {
          ...prevData,
          documents: prevData.documents.filter(doc => !documentsToDelete.includes(doc._id)),
          total: Math.max(0, prevData.total - documentsToDelete.length)
        };
      });
      
      setShowBulkModal(false);
      setSelectedDocuments(new Set());
      
      // Make the API call
      const response = await adminAPI.bulkDocumentOperations(indexName, operations);
      console.log('Bulk delete completed:', response);
      
      // Refresh to ensure consistency (but UI already updated optimistically)
      setTimeout(async () => {
        await loadDocuments();
        console.log('Document list refreshed after bulk delete for consistency');
      }, 100);
      
    } catch (err: any) {
      console.error('Failed to bulk delete documents:', err);
      setError(err.response?.data?.message || 'Failed to delete documents');
      
      // Revert optimistic update on error
      console.log('Reverting optimistic bulk delete due to error');
      await loadDocuments();
    }
  };

  const toggleDocumentSelection = (documentId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(documentId)) {
      newSelection.delete(documentId);
    } else {
      newSelection.add(documentId);
    }
    setSelectedDocuments(newSelection);
  };

  const selectAllDocuments = () => {
    if (data && data.documents && Array.isArray(data.documents)) {
      const allIds = data.documents.map(doc => doc._id);
      setSelectedDocuments(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  const openEditModal = (document: Document) => {
    setSelectedDocument(document);
    setShowEditModal(true);
  };

  const openDeleteModal = (document: Document) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-7xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Data Management: {indexName}
            </h2>
            <p className="text-gray-600 mt-1">
              View, add, edit, and delete documents
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-md w-64"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </form>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {availableSortFields && availableSortFields.length > 0 ? (
                  availableSortFields.map(field => (
                    <option key={field.field} value={field.field}>
                      {field.label}
                    </option>
                  ))
                ) : (
                  <option value="_score">Relevance Score</option>
                )}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Document
              </button>
              
              {selectedDocuments.size > 0 && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Selected ({selectedDocuments.size})
                </button>
              )}
            </div>
          </div>

          {/* Selection Controls */}
          {data && data.documents && data.documents.length > 0 && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={selectAllDocuments}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {(loading || refreshing) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">
                {refreshing ? 'Refreshing documents...' : 'Loading documents...'}
              </div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {data && !loading && !refreshing && (
            <div className="h-full flex flex-col">
              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={data && data.documents && selectedDocuments.size === data.documents.length && data.documents.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllDocuments();
                            } else {
                              clearSelection();
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data && data.documents && data.documents.map((document) => (
                      <tr key={document._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.has(document._id)}
                            onChange={() => toggleDocumentSelection(document._id)}
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                          {document._id}
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-md">
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(document._source, null, 2)}
                            </pre>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(document)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(document)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t bg-gray-50 px-6 py-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data?.total || 0)} of {data?.total || 0} documents
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {currentPage} of {data?.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(data?.totalPages || 1, prev + 1))}
                      disabled={currentPage === (data?.totalPages || 1)}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Document Form */}
        <DocumentForm
          indexName={indexName}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddDocument}
          mode="create"
        />

        {/* Edit Document Form */}
        <DocumentForm
          indexName={indexName}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditDocument}
          initialData={selectedDocument?._source}
          mode="edit"
        />

        {/* Delete Document Modal */}
        {showDeleteModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-96">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Delete Document</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete document <code className="bg-gray-100 px-2 py-1 rounded">{selectedDocument._id}</code>?
                </p>
                <p className="text-sm text-red-600 mb-6">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-96">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Delete Selected Documents</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete {selectedDocuments.size} selected documents?
                </p>
                <p className="text-sm text-red-600 mb-6">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagement;

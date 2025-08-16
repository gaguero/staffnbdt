import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  category: 'general' | 'department' | 'personal';
  status: 'approved' | 'pending' | 'rejected';
}

const DocumentsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API call
  const documents: Document[] = [
    {
      id: '1',
      name: 'Employee Handbook 2024.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadDate: '2024-01-15',
      category: 'general',
      status: 'approved'
    },
    {
      id: '2',
      name: 'Vacation Policy.docx',
      type: 'DOCX',
      size: '156 KB',
      uploadDate: '2024-01-10',
      category: 'general',
      status: 'approved'
    },
    {
      id: '3',
      name: 'Department Guidelines.pdf',
      type: 'PDF',
      size: '890 KB',
      uploadDate: '2024-01-12',
      category: 'department',
      status: 'approved'
    },
    {
      id: '4',
      name: 'Training Certificate.jpg',
      type: 'JPG',
      size: '245 KB',
      uploadDate: '2024-01-08',
      category: 'personal',
      status: 'pending'
    }
  ];

  const categories = [
    { value: 'all', label: 'All Documents', icon: '📁' },
    { value: 'general', label: 'General', icon: '📋' },
    { value: 'department', label: 'Department', icon: '🏢' },
    { value: 'personal', label: 'Personal', icon: '👤' }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implement file upload API call
      console.log('Uploading file:', file.name);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset input
      event.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'rejected':
        return <span className="badge badge-error">Rejected</span>;
      default:
        return <span className="badge badge-neutral">Unknown</span>;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Documents</h1>
          <p className="text-gray-600">Manage and access your documents</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="btn btn-primary cursor-pointer">
            {isUploading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <span className="mr-2">📤</span>
                Upload Document
              </>
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-warm-gold text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">
            No documents found
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No documents match "${searchTerm}"`
              : 'Upload your first document to get started'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map(document => (
            <div key={document.id} className="card p-4 hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">
                  {getFileIcon(document.type)}
                </div>
                {getStatusBadge(document.status)}
              </div>
              
              <h4 className="font-medium text-charcoal mb-2 line-clamp-2">
                {document.name}
              </h4>
              
              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span>{document.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{document.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded:</span>
                  <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <button className="btn btn-primary btn-sm flex-1">
                  <span className="mr-1">👁️</span>
                  View
                </button>
                <button className="btn btn-outline btn-sm">
                  <span>📥</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-charcoal">Upload Guidelines</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-charcoal mb-2">Supported Formats</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• PDF documents (.pdf)</li>
                <li>• Word documents (.doc, .docx)</li>
                <li>• Excel spreadsheets (.xls, .xlsx)</li>
                <li>• Images (.jpg, .jpeg, .png)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-charcoal mb-2">Requirements</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Maximum file size: 10 MB</li>
                <li>• Files must be virus-free</li>
                <li>• No confidential third-party data</li>
                <li>• Clear, readable document quality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
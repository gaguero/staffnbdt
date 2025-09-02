import React, { useState, useRef, useCallback } from 'react';
import { ObjectFieldDefinition } from '../../../types/concierge';
import toastService from '../../../services/toastService';

interface FileUploadInputProps {
  field: ObjectFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  uploadError?: string;
}

const FileUploadInput: React.FC<FileUploadInputProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const acceptedTypes = field.config?.acceptedTypes || ['*/*'];
  const maxSize = (field.config?.maxSize || 5) * 1024 * 1024; // Convert MB to bytes
  const files: UploadedFile[] = value || [];

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${field.config?.maxSize || 5}MB`;
    }

    // Check file type
    const isTypeAllowed = acceptedTypes.some(type => {
      if (type === '*/*') return true;
      if (type.endsWith('/*')) {
        const category = type.replace('/*', '');
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!isTypeAllowed) {
      return `File type ${file.type} is not allowed. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        toastService.error(`${file.name}: ${validationError}`);
        continue;
      }

      const fileId = `file_${Date.now()}_${i}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
      };

      newFiles.push(uploadedFile);
      setUploading(prev => [...prev, fileId]);

      // Simulate file upload
      const uploadPromise = simulateFileUpload(file, uploadedFile, (progress) => {
        const updatedFiles = [...files, ...newFiles];
        const fileIndex = updatedFiles.findIndex(f => f.id === fileId);
        if (fileIndex !== -1) {
          updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], uploadProgress: progress };
          onChange(updatedFiles);
        }
      });

      uploadPromises.push(uploadPromise);
    }

    // Update state with new files
    onChange([...files, ...newFiles]);

    // Wait for all uploads to complete
    try {
      await Promise.all(uploadPromises);
    } finally {
      setUploading(prev => prev.filter(id => !newFiles.some(f => f.id === id)));
    }
  }, [files, onChange, maxSize, acceptedTypes]);

  const simulateFileUpload = async (
    file: File, 
    uploadedFile: UploadedFile,
    onProgress: (progress: number) => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Create object URL for preview
          const url = URL.createObjectURL(file);
          const updatedFiles = [...files];
          const fileIndex = updatedFiles.findIndex(f => f.id === uploadedFile.id);
          if (fileIndex !== -1) {
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              url,
              uploadProgress: 100,
            };
            onChange(updatedFiles);
          }
          
          toastService.success(`${file.name} uploaded successfully`);
          resolve();
        } else {
          onProgress(progress);
        }
      }, 100);
    });
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onChange(updatedFiles);
    toastService.success('File removed');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc') || type.includes('word')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📋';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📎';
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div>
      <label className="form-label flex items-center">
        📎 {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? openFilePicker : undefined}
      >
        <div className="text-4xl mb-2">📎</div>
        <div className="text-lg font-medium text-gray-700 mb-1">
          {isDragOver ? 'Drop files here' : 'Upload Files'}
        </div>
        <div className="text-sm text-gray-500">
          Drag and drop files here, or click to browse
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Max size: {field.config?.maxSize || 5}MB • 
          Accepted: {acceptedTypes.join(', ')}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length})
          </h4>
          
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center p-3 bg-gray-50 rounded-lg border"
            >
              {/* File Icon/Thumbnail */}
              <div className="flex-shrink-0 mr-3">
                {isImage(file.type) && file.url ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-white rounded border">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {file.type}
                </div>

                {/* Upload Progress */}
                {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${file.uploadProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(file.uploadProgress)}% uploaded
                    </div>
                  </div>
                )}

                {/* Upload Error */}
                {file.uploadError && (
                  <div className="text-xs text-red-600 mt-1">
                    {file.uploadError}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    title="View file"
                  >
                    👁️
                  </a>
                )}
                {!disabled && !uploading.includes(file.id) && (
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    title="Remove file"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-1">
        Upload files by dragging and dropping them above or clicking to browse. 
        Maximum file size: {field.config?.maxSize || 5}MB.
      </p>
    </div>
  );
};

export default FileUploadInput;
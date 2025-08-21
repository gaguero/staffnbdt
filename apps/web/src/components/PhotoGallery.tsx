import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import profileService from '../services/profileService';
import toast from 'react-hot-toast';

export enum PhotoType {
  FORMAL = 'FORMAL',
  CASUAL = 'CASUAL', 
  UNIFORM = 'UNIFORM',
  FUNNY = 'FUNNY'
}

interface PhotoTypeConfig {
  type: PhotoType;
  displayName: string;
  description: string;
  icon: string;
  guidance: string;
  bgColor: string;
  borderColor: string;
}

interface ProfilePhoto {
  id: string;
  userId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  photoType: PhotoType;
  isActive: boolean;
  isPrimary: boolean;
  description?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface UserPhotosResponse {
  photos: ProfilePhoto[];
  photosByType: Record<PhotoType, number>;
  primaryPhoto: ProfilePhoto | null;
}

interface PhotoGalleryProps {
  onPhotoUpdate?: (photoUrl: string) => void;
  onPhotoDelete?: () => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  onPhotoUpdate,
  onPhotoDelete,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userPhotos, setUserPhotos] = useState<UserPhotosResponse | null>(null);
  const [isUploading, setIsUploading] = useState<PhotoType | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoType | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isDragging, setIsDragging] = useState<PhotoType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Photo type configurations with style suggestions
  const photoTypeConfigs: PhotoTypeConfig[] = [
    {
      type: PhotoType.FORMAL,
      displayName: 'Formal',
      description: 'Professional headshot for employee directory',
      icon: '👔',
      guidance: 'Professional attire, neutral background, clear face shot',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      type: PhotoType.CASUAL,
      displayName: 'Casual',
      description: 'Friendly photo for team directory',
      icon: '😊',
      guidance: 'Relaxed pose, casual clothing, friendly expression',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      type: PhotoType.UNIFORM,
      displayName: 'Uniform',
      description: 'In your work attire',
      icon: '👕',
      guidance: 'Complete work uniform, proper grooming, professional pose',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      type: PhotoType.FUNNY,
      displayName: 'Fun',
      description: 'Show your personality!',
      icon: '🎉',
      guidance: 'Creative pose, fun expression, showcase your personality',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a JPG or PNG image file.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  // Load user photos
  const loadUserPhotos = async () => {
    try {
      setIsLoading(true);
      const response = await profileService.getUserPhotos();
      setUserPhotos(response);
    } catch (error) {
      console.error('Failed to load user photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserPhotos();
  }, []);

  const handleFileSelect = useCallback((file: File, photoType: PhotoType) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);
    setSelectedPhotoType(photoType);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCropModal(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, photoType: PhotoType) => {
    e.preventDefault();
    setIsDragging(photoType);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, photoType: PhotoType) => {
    e.preventDefault();
    setIsDragging(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0], photoType);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, photoType: PhotoType) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0], photoType);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  const getCroppedCanvas = (): HTMLCanvasElement | null => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !completedCrop) {
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropWidth = Math.max(completedCrop.width, 50);
      const cropHeight = Math.max(completedCrop.height, 50);

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.clearRect(0, 0, cropWidth, cropHeight);
      
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        cropWidth,
        cropHeight
      );

      return canvas;
    } catch (error) {
      console.error('Canvas cropping error:', error);
      return null;
    }
  };

  const handleCropConfirm = async () => {
    if (!selectedFile || !selectedPhotoType) return;

    try {
      setIsUploading(selectedPhotoType);
      setUploadProgress(0);

      const canvas = getCroppedCanvas();
      if (!canvas) {
        throw new Error('Failed to crop image');
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.9);
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const file = new File([blob], `${selectedPhotoType.toLowerCase()}-photo-${user?.id}.jpg`, { type: 'image/jpeg' });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload the photo with specific type
      const result = await profileService.uploadPhotoByType(selectedPhotoType, file, {
        isPrimary: userPhotos?.primaryPhoto === null, // Make first photo primary
        description: `${selectedPhotoType} photo`
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reload photos
      await loadUserPhotos();
      
      // Update parent component if this is the new primary photo
      if (result.isPrimary && onPhotoUpdate) {
        onPhotoUpdate(`/api/profile/photo/${user?.id}`);
      }

      // Clean up
      setShowCropModal(false);
      setSelectedFile(null);
      setSelectedPhotoType(null);
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      
      toast.success(`${selectedPhotoType} photo uploaded successfully!`);
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploading(null);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async (photoId: string, photoType: PhotoType) => {
    if (!confirm(`Are you sure you want to delete your ${photoType.toLowerCase()} photo?`)) {
      return;
    }

    try {
      setIsUploading(photoType);
      await profileService.deleteSpecificPhoto(photoId);
      
      // Reload photos
      await loadUserPhotos();
      
      // Update parent component if this was the primary photo
      if (onPhotoDelete) {
        onPhotoDelete();
      }
      
      toast.success(`${photoType} photo deleted successfully!`);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete photo');
    } finally {
      setIsUploading(null);
    }
  };

  const handleSetPrimary = async (photoId: string, photoType: PhotoType) => {
    try {
      await profileService.setPrimaryPhoto(photoId);
      
      // Reload photos
      await loadUserPhotos();
      
      // Update parent component
      if (onPhotoUpdate) {
        onPhotoUpdate(`/api/profile/photo/${user?.id}`);
      }
      
      toast.success(`${photoType} photo set as primary!`);
    } catch (error) {
      console.error('Set primary failed:', error);
      toast.error('Failed to set primary photo');
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    setSelectedPhotoType(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const getPhotoForType = (photoType: PhotoType): ProfilePhoto | null => {
    return userPhotos?.photos.find(photo => photo.photoType === photoType) || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" text="Loading photo gallery..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Photo Gallery</h3>
        <p className="text-gray-600">
          Upload up to 4 different types of photos to showcase different aspects of your professional persona
        </p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {photoTypeConfigs.map((config) => {
          const existingPhoto = getPhotoForType(config.type);
          const isCurrentlyUploading = isUploading === config.type;
          const isDragTarget = isDragging === config.type;

          return (
            <div
              key={config.type}
              className={`relative p-6 rounded-xl border-2 border-dashed transition-all duration-200 ${
                isDragTarget
                  ? `${config.borderColor} ${config.bgColor}`
                  : existingPhoto
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-300 hover:border-warm-gold hover:bg-warm-gold/5'
              }`}
              onDragOver={(e) => handleDragOver(e, config.type)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, config.type)}
            >
              {/* Photo Type Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{config.displayName}</h4>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
                {existingPhoto?.isPrimary && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Primary
                  </span>
                )}
              </div>

              {/* Photo Display or Upload Area */}
              {existingPhoto ? (
                <div className="space-y-4">
                  {/* Existing Photo */}
                  <div className="relative">
                    <img
                      src={`/api/profile/photo/${user?.id}/${config.type}`}
                      alt={`${config.displayName} photo`}
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        console.log(`${config.type} photo failed to load`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {isCurrentlyUploading && (
                      <div className="absolute inset-0 rounded-lg bg-black bg-opacity-50 flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Photo Actions */}
                  <div className="flex space-x-2">
                    <input
                      ref={(el) => { fileInputRefs.current[config.type] = el; }}
                      type="file"
                      accept={ALLOWED_TYPES.join(',')}
                      onChange={(e) => handleFileInputChange(e, config.type)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRefs.current[config.type]?.click()}
                      disabled={isCurrentlyUploading}
                      className="flex-1 btn btn-secondary text-sm"
                    >
                      Replace
                    </button>
                    {!existingPhoto.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(existingPhoto.id, config.type)}
                        disabled={isCurrentlyUploading}
                        className="flex-1 btn btn-primary text-sm"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(existingPhoto.id, config.type)}
                      disabled={isCurrentlyUploading}
                      className="btn btn-danger text-sm px-3"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">{config.icon}</div>
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      Add {config.displayName} Photo
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {config.guidance}
                    </p>
                    <input
                      ref={(el) => { fileInputRefs.current[config.type] = el; }}
                      type="file"
                      accept={ALLOWED_TYPES.join(',')}
                      onChange={(e) => handleFileInputChange(e, config.type)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRefs.current[config.type]?.click()}
                      disabled={isCurrentlyUploading}
                      className="btn btn-primary"
                    >
                      {isCurrentlyUploading ? 'Uploading...' : 'Choose Photo'}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      or drag & drop here
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isCurrentlyUploading && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-warm-gold h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Photo Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use good lighting and avoid shadows on your face</li>
          <li>• Look directly at the camera with a natural expression</li>
          <li>• Ensure your face takes up about 50% of the frame</li>
          <li>• Photos should be recent (within the last year)</li>
          <li>• The first photo you upload will be set as your primary photo</li>
        </ul>
      </div>

      {/* Crop Modal */}
      {showCropModal && selectedPhotoType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Crop Your {photoTypeConfigs.find(c => c.type === selectedPhotoType)?.displayName} Photo
                </h3>
                <button
                  onClick={handleCropCancel}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isUploading !== null}
                >
                  ✕
                </button>
              </div>

              {previewUrl && (
                <div className="space-y-4">
                  <div className="relative max-w-md mx-auto">
                    <ReactCrop
                      crop={crop}
                      onChange={(newCrop) => setCrop(newCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      minWidth={50}
                      minHeight={50}
                      keepSelection
                    >
                      <img
                        ref={imageRef}
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full h-auto rounded border"
                        onLoad={() => {
                          console.log('PhotoGallery image loaded for cropping');
                          setImageLoaded(true);
                          const img = imageRef.current;
                          if (img) {
                            const centerCrop: Crop = {
                              unit: '%',
                              width: 50,
                              height: 50,
                              x: 25,
                              y: 25,
                            };
                            setCrop(centerCrop);
                            // Force onComplete to trigger to set completedCrop
                            setTimeout(() => {
                              const pixelCrop: PixelCrop = {
                                unit: 'px',
                                x: (img.width * centerCrop.x) / 100,
                                y: (img.height * centerCrop.y) / 100,
                                width: (img.width * centerCrop.width) / 100,
                                height: (img.height * centerCrop.height) / 100
                              };
                              setCompletedCrop(pixelCrop);
                            }, 100);
                          }
                        }}
                      />
                    </ReactCrop>
                  </div>

                  <div className="text-center text-sm text-gray-600 space-y-1">
                    <p>Drag the corners to adjust the crop area</p>
                    <p>Your photo will be cropped to a square format</p>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleCropConfirm}
                      disabled={isUploading !== null}
                      className="btn btn-primary flex-1"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Uploading...</span>
                        </div>
                      ) : (
                        'Upload Photo'
                      )}
                    </button>
                    <button
                      onClick={handleCropCancel}
                      disabled={isUploading !== null}
                      className="btn btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas for Cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoGallery;
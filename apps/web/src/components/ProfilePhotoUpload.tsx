import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import ImageFallback from './ImageFallback';
import useErrorHandler from '../hooks/useErrorHandler';
import profileService from '../services/profileService';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate?: (photoUrl: string) => void;
  onPhotoDelete?: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoUpdate,
  onPhotoDelete,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const [deleteError, setDeleteError] = useState<Error | null>(null);
  const [imageLoadError, setImageLoadError] = useState<Error | null>(null);
  
  // Error handlers for different operations
  const uploadErrorHandler = useErrorHandler({
    maxRetries: 3,
    retryDelay: 2000,
    exponentialBackoff: true,
    showToast: false, // We'll handle toasts manually for better UX
  });
  
  const deleteErrorHandler = useErrorHandler({
    maxRetries: 2,
    retryDelay: 1000,
    exponentialBackoff: false,
    showToast: false,
  });
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCropModal(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const getCroppedCanvas = (): HTMLCanvasElement | null => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    console.log('ProfilePhotoUpload getCroppedCanvas called with:', {
      canvas: !!canvas,
      image: !!image,
      imageLoaded,
      completedCrop: !!completedCrop,
      cropData: completedCrop
    });
    
    if (!canvas || !image || !completedCrop) {
      console.error('ProfilePhotoUpload Missing required elements for cropping:', {
        canvas: !!canvas,
        image: !!image,
        imageLoaded,
        completedCrop: !!completedCrop
      });
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas 2D context');
      return null;
    }

    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      console.log('Image dimensions:', {
        natural: { width: image.naturalWidth, height: image.naturalHeight },
        displayed: { width: image.width, height: image.height },
        scale: { x: scaleX, y: scaleY }
      });

      // Ensure minimum canvas size
      const cropWidth = Math.max(completedCrop.width, 50);
      const cropHeight = Math.max(completedCrop.height, 50);

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Clear canvas
      ctx.clearRect(0, 0, cropWidth, cropHeight);
      
      // Draw the cropped image
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

      console.log('Canvas cropping successful:', {
        originalSize: { width: image.naturalWidth, height: image.naturalHeight },
        cropArea: completedCrop,
        outputSize: { width: cropWidth, height: cropHeight }
      });

      return canvas;
    } catch (error) {
      console.error('Canvas cropping error:', error);
      return null;
    }
  };

  const handleCropConfirm = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      await uploadErrorHandler.executeWithRetry(async () => {
        const canvas = getCroppedCanvas();
        if (!canvas) {
          const debugInfo = {
            canvas: !!canvasRef.current,
            image: !!imageRef.current,
            imageLoaded,
            completedCrop: !!completedCrop,
            cropData: completedCrop
          };
          console.error('Crop failed with debug info:', debugInfo);
          throw new Error('Failed to process image. Please try selecting the image again.');
        }

        // Convert canvas to blob with error handling
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to process image. The image might be corrupted.'));
            }
          }, 'image/jpeg', 0.9);
        });

        if (!blob) {
          throw new Error('Failed to create image file');
        }

        // Create file from blob
        const file = new File([blob], `profile-photo-${user?.id}.jpg`, { type: 'image/jpeg' });

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        try {
          // Make API call to upload using profileService
          const result = await profileService.uploadProfilePhoto(file);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          // Update parent component
          if (onPhotoUpdate && result.profilePhoto) {
            onPhotoUpdate(result.profilePhoto);
          }

          // Clean up
          setShowCropModal(false);
          setSelectedFile(null);
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
          
          toast.success('Profile photo uploaded successfully!');
          return result;
        } finally {
          clearInterval(progressInterval);
        }
      });
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      setUploadError(uploadError);
      console.error('Upload failed after retries:', uploadError);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteErrorHandler.executeWithRetry(async () => {
        await profileService.deleteProfilePhoto();
        
        // Update parent component
        if (onPhotoDelete) {
          onPhotoDelete();
        }
        
        toast.success('Profile photo removed successfully!');
      });
    } catch (error) {
      const deleteError = error instanceof Error ? error : new Error('Delete failed');
      setDeleteError(deleteError);
      console.error('Delete failed after retries:', deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    setImageLoaded(false);
    setCompletedCrop(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U';

  return (
    <div className="space-y-4">
      {/* Current Photo Display */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          {currentPhotoUrl ? (
            <ImageFallback
              src={currentPhotoUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-sand"
              retryEnabled={true}
              maxRetries={2}
              onError={(error) => {
                console.log('Profile photo failed to load in upload component:', error);
                setImageLoadError(error);
              }}
              fallbackComponent={
                <div className="w-24 h-24 rounded-full bg-warm-gold flex items-center justify-center text-white text-2xl font-bold border-4 border-sand relative">
                  {initials}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                </div>
              }
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-warm-gold flex items-center justify-center text-white text-2xl font-bold border-4 border-sand">
              {initials}
            </div>
          )}
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-charcoal">Profile Photo</h3>
          <p className="text-sm text-gray-600">
            Upload a photo to personalize your profile. Max 5MB, JPG or PNG format.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
              className="btn btn-primary text-sm px-3 py-1"
            >
              {currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {currentPhotoUrl && (
              <button
                onClick={handleDeletePhoto}
                disabled={isUploading || isDeleting}
                className="btn btn-secondary text-sm px-3 py-1"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full">
          <div className="flex justify-between text-sm mb-1">
            <span>
              {uploadErrorHandler.isRetrying
                ? `Retrying... (${uploadErrorHandler.retryCount}/${3})`
                : 'Uploading...'
              }
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                uploadErrorHandler.isRetrying ? 'bg-orange-500' : 'bg-warm-gold'
              }`}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          {uploadErrorHandler.isRetrying && (
            <p className="text-xs text-orange-600 mt-1">
              Connection issue detected, retrying upload...
            </p>
          )}
        </div>
      )}
      
      {/* Upload Error Display */}
      {uploadError && !isUploading && (
        <ErrorDisplay
          error={uploadError}
          title="Upload Failed"
          variant="inline"
          onRetry={() => {
            setUploadError(null);
            handleCropConfirm();
          }}
          onDismiss={() => setUploadError(null)}
        />
      )}
      
      {/* Delete Error Display */}
      {deleteError && !isDeleting && (
        <ErrorDisplay
          error={deleteError}
          title="Delete Failed"
          variant="inline"
          onRetry={() => {
            setDeleteError(null);
            handleDeletePhoto();
          }}
          onDismiss={() => setDeleteError(null)}
        />
      )}
      
      {/* Image Load Error Display */}
      {imageLoadError && (
        <ErrorDisplay
          error={imageLoadError}
          title="Image Load Failed"
          variant="inline"
          onDismiss={() => setImageLoadError(null)}
        />
      )}

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-warm-gold bg-sand bg-opacity-20'
            : 'border-gray-300 hover:border-warm-gold'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="text-4xl">📸</div>
          <p className="text-lg font-medium text-charcoal">
            Drag & drop your photo here
          </p>
          <p className="text-sm text-gray-600">
            or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-warm-gold hover:underline font-medium"
            >
              browse files
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Supports JPG, PNG • Max 5MB
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-charcoal">
                  Crop Your Photo
                </h3>
                <button
                  onClick={handleCropCancel}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isUploading}
                >
                  ✕
                </button>
              </div>

              {previewUrl && (
                <div className="space-y-4">
                  {/* Interactive Crop Component */}
                  <div className="relative max-w-md mx-auto">
                    <ReactCrop
                      crop={crop}
                      onChange={(newCrop) => {
                        console.log('Crop changing:', newCrop);
                        setCrop(newCrop);
                      }}
                      onComplete={(c) => {
                        console.log('Crop completed:', c);
                        setCompletedCrop(c);
                      }}
                      aspect={1}
                      minWidth={50}
                      minHeight={50}
                      keepSelection
                      ruleOfThirds
                    >
                      <img
                        ref={imageRef}
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full h-auto rounded border"
                        onLoad={() => {
                          console.log('Image loaded for cropping');
                          setImageLoaded(true);
                          // Initialize crop to center square
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

                  {/* Crop Instructions */}
                  <div className="text-center text-sm text-gray-600 space-y-1">
                    <p>Drag the corners to adjust the crop area</p>
                    <p>Your photo will be cropped to a square format</p>
                    <p>Make sure your face is clearly visible within the selection</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleCropConfirm}
                      disabled={isUploading}
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
                      disabled={isUploading}
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

export default ProfilePhotoUpload;
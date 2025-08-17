import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import profileService from '../services/profileService';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate?: (photoUrl: string) => void;
  onPhotoDelete?: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoUpdate,
  onPhotoDelete,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (!canvas || !image || !completedCrop) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return canvas;
  };

  const handleCropConfirm = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const canvas = getCroppedCanvas();
      if (!canvas) {
        throw new Error('Failed to crop image');
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const file = new File([blob], `profile-photo-${user?.id}.jpg`, { type: 'image/jpeg' });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

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
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }

    try {
      setIsDeleting(true);

      await profileService.deleteProfilePhoto();

      // Update parent component
      if (onPhotoDelete) {
        onPhotoDelete();
      }

    } catch (error) {
      console.error('Delete failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
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
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-sand"
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
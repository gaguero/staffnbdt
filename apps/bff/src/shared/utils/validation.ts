import { BadRequestException } from '@nestjs/common';

export const validateFileType = (
  mimeType: string,
  allowedTypes: string[],
): void => {
  if (!allowedTypes.includes(mimeType)) {
    throw new BadRequestException(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    );
  }
};

export const validateFileSize = (
  size: number,
  maxSizeInBytes: number,
): void => {
  if (size > maxSizeInBytes) {
    const maxSizeInMB = maxSizeInBytes / (1024 * 1024);
    throw new BadRequestException(
      `File size exceeds maximum allowed size of ${maxSizeInMB}MB`,
    );
  }
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const generateUniqueFilename = (
  originalName: string,
  userId?: string,
): string => {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalName);
  const prefix = userId ? `${userId}_` : '';
  return `${prefix}${timestamp}_${sanitized}`;
};
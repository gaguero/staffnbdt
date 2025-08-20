import { MulterModuleOptions } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const profilePhotoConfig: MulterModuleOptions = {
  storage: memoryStorage(), // Use memory storage instead of disk storage
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = extname(file.originalname).toLowerCase();
    
    console.log('📁 Profile photo file validation:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension,
    });
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.error('❌ Invalid file type for profile photo:', {
        mimetype: file.mimetype,
        extension: fileExtension,
        allowed: { mimes: allowedMimes, extensions: allowedExtensions },
      });
      cb(new BadRequestException('Only JPEG and PNG files are allowed for profile photos'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Only allow one file at a time
  },
};

export const idDocumentConfig: MulterModuleOptions = {
  storage: memoryStorage(), // Use memory storage instead of disk storage
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'application/pdf'
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = extname(file.originalname).toLowerCase();
    
    console.log('📁 ID document file validation:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension,
    });
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.error('❌ Invalid file type for ID document:', {
        mimetype: file.mimetype,
        extension: fileExtension,
        allowed: { mimes: allowedMimes, extensions: allowedExtensions },
      });
      cb(new BadRequestException('Only JPEG, PNG, and PDF files are allowed for ID documents'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1, // Only allow one file at a time
  },
};
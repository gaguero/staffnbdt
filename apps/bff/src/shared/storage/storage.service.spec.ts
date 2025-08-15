import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService, FileUploadOptions, FileMetadata } from './storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream, ReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable, Transform } from 'stream';

// Mock all fs modules
jest.mock('fs/promises');
jest.mock('fs');
jest.mock('stream/promises');
jest.mock('path');

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;
  
  const mockConfigService = {
    get: jest.fn(),
  };

  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;
  const mockCreateReadStream = createReadStream as jest.MockedFunction<typeof createReadStream>;
  const mockCreateWriteStream = createWriteStream as jest.MockedFunction<typeof createWriteStream>;
  const mockPipeline = pipeline as jest.MockedFunction<typeof pipeline>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Default config values
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'STORAGE_PATH':
          return '/test/storage';
        case 'MAX_FILE_SIZE':
          return '10485760'; // 10MB
        case 'ALLOWED_FILE_TYPES':
          return 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi';
        default:
          return undefined;
      }
    });

    // Mock path operations
    mockPath.join.mockImplementation((...paths) => paths.join('/'));
    mockPath.dirname.mockImplementation((filePath) => filePath.split('/').slice(0, -1).join('/'));
    mockPath.extname.mockImplementation((filePath) => {
      const parts = filePath.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });
    mockPath.basename.mockImplementation((filePath) => filePath.split('/').pop() || '');
    mockPath.relative.mockImplementation((from, to) => to.replace(from, '').replace(/^\//, ''));

    // Mock fs operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(Buffer.from('test file content'));
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.copyFile.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({
      size: 1024,
      isDirectory: () => false,
      isFile: () => true,
    } as any);
    mockFs.readdir.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should use default storage path when not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'STORAGE_PATH') return undefined;
        if (key === 'MAX_FILE_SIZE') return '10485760';
        if (key === 'ALLOWED_FILE_TYPES') return 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi';
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<StorageService>(StorageService);
      expect(newService).toBeDefined();
    });

    it('should create storage directories on initialization', () => {
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/documents/general', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/documents/departments', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/documents/users', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/payslips', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/training/materials', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/training/submissions', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/temp', { recursive: true });
    });
  });

  describe('generateFileKey', () => {
    it('should generate a unique file key with prefix', () => {
      const key = service.generateFileKey('documents', 'test.pdf');
      
      expect(key).toMatch(/^documents\/\d+-[a-f0-9]+-test\.pdf$/);
    });

    it('should generate a unique file key with userId', () => {
      const key = service.generateFileKey('documents', 'test.pdf', 'user123');
      
      expect(key).toMatch(/^documents\/user123\/\d+-[a-f0-9]+-test\.pdf$/);
    });

    it('should sanitize file names', () => {
      const key = service.generateFileKey('documents', 'test file with spaces & special chars!.pdf');
      
      expect(key).toMatch(/^documents\/\d+-[a-f0-9]+-test_file_with_spaces___special_chars_\.pdf$/);
    });
  });

  describe('saveFile', () => {
    const testBuffer = Buffer.from('test file content');
    const options: FileUploadOptions & { key: string } = {
      key: 'documents/test.pdf',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
    };

    it('should save a file successfully', async () => {
      const result = await service.saveFile(testBuffer, options);

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/documents', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith('/test/storage/documents/test.pdf', testBuffer);
      expect(result).toEqual({
        key: 'documents/test.pdf',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        size: testBuffer.length,
        path: '/test/storage/documents/test.pdf',
      });
    });

    it('should reject files that exceed maximum size', async () => {
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB

      await expect(service.saveFile(largeBuffer, options)).rejects.toThrow(
        'File size exceeds maximum allowed size of 10485760 bytes'
      );
    });

    it('should reject files with disallowed extensions', async () => {
      const badOptions = { ...options, fileName: 'test.exe' };

      await expect(service.saveFile(testBuffer, badOptions)).rejects.toThrow(
        'File type .exe is not allowed'
      );
    });

    it('should handle uppercase file extensions', async () => {
      const upperCaseOptions = { ...options, fileName: 'test.PDF' };

      await expect(service.saveFile(testBuffer, upperCaseOptions)).resolves.toBeDefined();
    });
  });

  describe('saveFileStream', () => {
    const options: FileUploadOptions & { key: string } = {
      key: 'documents/stream-test.pdf',
      fileName: 'stream-test.pdf',
      mimeType: 'application/pdf',
    };

    it('should save a file stream successfully', async () => {
      const mockStream = new Readable({
        read() {
          this.push('test content');
          this.push(null);
        }
      });

      const mockWriteStream = {
        write: jest.fn(),
        end: jest.fn(),
      };
      mockCreateWriteStream.mockReturnValue(mockWriteStream as any);
      mockPipeline.mockResolvedValue(undefined);

      const result = await service.saveFileStream(mockStream, options);

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/documents', { recursive: true });
      expect(mockCreateWriteStream).toHaveBeenCalledWith('/test/storage/documents/stream-test.pdf');
      expect(mockPipeline).toHaveBeenCalled();
      expect(result.key).toBe('documents/stream-test.pdf');
    });

    it('should reject streams with disallowed file types', async () => {
      const mockStream = new Readable({
        read() {
          this.push('test content');
          this.push(null);
        }
      });

      const badOptions = { ...options, fileName: 'malware.exe' };

      await expect(service.saveFileStream(mockStream, badOptions)).rejects.toThrow(
        'File type .exe is not allowed'
      );
    });
  });

  describe('getFile', () => {
    it('should retrieve a file successfully', async () => {
      const mockBuffer = Buffer.from('file content');
      mockFs.readFile.mockResolvedValue(mockBuffer);

      const result = await service.getFile('documents/test.pdf');

      expect(mockFs.readFile).toHaveBeenCalledWith('/test/storage/documents/test.pdf');
      expect(result).toBe(mockBuffer);
    });

    it('should throw error when file not found', async () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      await expect(service.getFile('nonexistent.pdf')).rejects.toThrow('File not found');
    });

    it('should propagate other filesystem errors', async () => {
      const error = new Error('Permission denied');
      mockFs.readFile.mockRejectedValue(error);

      await expect(service.getFile('documents/test.pdf')).rejects.toThrow('Permission denied');
    });
  });

  describe('createReadStream', () => {
    it('should create a read stream', () => {
      const mockStream = {} as ReadStream;
      mockCreateReadStream.mockReturnValue(mockStream);

      const result = service.createReadStream('documents/test.pdf');

      expect(mockCreateReadStream).toHaveBeenCalledWith('/test/storage/documents/test.pdf');
      expect(result).toBe(mockStream);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      await service.deleteFile('documents/test.pdf');

      expect(mockFs.unlink).toHaveBeenCalledWith('/test/storage/documents/test.pdf');
    });

    it('should handle file not found gracefully', async () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(error);

      await expect(service.deleteFile('nonexistent.pdf')).resolves.toBeUndefined();
    });

    it('should throw error for other filesystem issues', async () => {
      const error = new Error('Permission denied');
      mockFs.unlink.mockRejectedValue(error);

      await expect(service.deleteFile('documents/test.pdf')).rejects.toThrow('Failed to delete file');
    });
  });

  describe('copyFile', () => {
    it('should copy a file successfully', async () => {
      await service.copyFile('documents/source.pdf', 'documents/backup/source.pdf');

      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/storage/documents/backup', { recursive: true });
      expect(mockFs.copyFile).toHaveBeenCalledWith(
        '/test/storage/documents/source.pdf',
        '/test/storage/documents/backup/source.pdf'
      );
    });

    it('should throw error when copy fails', async () => {
      const error = new Error('Copy failed');
      mockFs.copyFile.mockRejectedValue(error);

      await expect(service.copyFile('source.pdf', 'dest.pdf')).rejects.toThrow('Failed to copy file');
    });
  });

  describe('checkFileExists', () => {
    it('should return true when file exists', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await service.checkFileExists('documents/test.pdf');

      expect(mockFs.access).toHaveBeenCalledWith('/test/storage/documents/test.pdf');
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await service.checkFileExists('nonexistent.pdf');

      expect(result).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    it('should return file metadata', async () => {
      const mockStats = {
        size: 2048,
        isDirectory: () => false,
        isFile: () => true,
      };
      mockFs.stat.mockResolvedValue(mockStats as any);

      const result = await service.getFileMetadata('documents/test.pdf');

      expect(mockFs.stat).toHaveBeenCalledWith('/test/storage/documents/test.pdf');
      expect(result).toEqual({
        key: 'documents/test.pdf',
        fileName: 'test.pdf',
        size: 2048,
        path: '/test/storage/documents/test.pdf',
      });
    });

    it('should throw error when file not found', async () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      mockFs.stat.mockRejectedValue(error);

      await expect(service.getFileMetadata('nonexistent.pdf')).rejects.toThrow('File not found');
    });
  });

  describe('listFiles', () => {
    it('should list files in a directory', async () => {
      const mockEntries = [
        { name: 'file1.pdf', isDirectory: () => false },
        { name: 'file2.txt', isDirectory: () => false },
        { name: 'subfolder', isDirectory: () => true },
      ];
      
      const mockSubEntries = [
        { name: 'file3.doc', isDirectory: () => false },
      ];

      mockFs.readdir
        .mockResolvedValueOnce(mockEntries as any)
        .mockResolvedValueOnce(mockSubEntries as any);

      mockPath.relative
        .mockReturnValueOnce('documents/file1.pdf')
        .mockReturnValueOnce('documents/file2.txt')
        .mockReturnValueOnce('documents/subfolder/file3.doc');

      const result = await service.listFiles('documents');

      expect(result).toEqual([
        'documents/file1.pdf',
        'documents/file2.txt', 
        'documents/subfolder/file3.doc'
      ]);
    });

    it('should handle empty directories', async () => {
      const error = new Error('Directory not found');
      mockFs.readdir.mockRejectedValue(error);

      const result = await service.listFiles('empty');

      expect(result).toEqual([]);
    });
  });

  describe('generatePresignedUploadUrl', () => {
    it('should return deprecated warning and mock response', async () => {
      const options = { key: 'documents/test.pdf' };
      
      const result = await service.generatePresignedUploadUrl(options);

      expect(result).toEqual({
        uploadUrl: '/api/documents/upload',
        downloadUrl: '/api/files/serve/documents/test.pdf',
        key: 'documents/test.pdf',
      });
    });
  });

  describe('generatePresignedDownloadUrl', () => {
    it('should return serving endpoint URL', async () => {
      const result = await service.generatePresignedDownloadUrl('documents/test.pdf');

      expect(result).toBe('/api/files/serve/documents%2Ftest.pdf');
    });

    it('should encode URL components properly', async () => {
      const result = await service.generatePresignedDownloadUrl('documents/file with spaces.pdf');

      expect(result).toBe('/api/files/serve/documents%2Ffile%20with%20spaces.pdf');
    });
  });

  describe('error handling in initialization', () => {
    it('should handle directory creation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<StorageService>(StorageService);
      expect(newService).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });
});
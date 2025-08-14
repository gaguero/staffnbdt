import { createConnection, Socket } from 'net';
import { Logger } from './logger.service';

export interface ScanResult {
  clean: boolean;
  virus?: string;
  error?: string;
}

export class AntivirusService {
  private readonly logger = new Logger('AntivirusService');
  private readonly host: string;
  private readonly port: number;
  private readonly timeout: number;

  constructor() {
    this.host = process.env.CLAMAV_HOST || 'localhost';
    this.port = parseInt(process.env.CLAMAV_PORT || '3310');
    this.timeout = 30000; // 30 seconds timeout
  }

  async scanBuffer(buffer: Buffer, filename?: string): Promise<ScanResult> {
    try {
      // If ClamAV is not configured or not available, skip scanning
      if (!this.isClamAVConfigured()) {
        this.logger.warn('ClamAV not configured, skipping virus scan');
        return { clean: true };
      }

      const socket = createConnection(this.port, this.host);
      
      return new Promise<ScanResult>((resolve, reject) => {
        let response = '';
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error('ClamAV scan timeout'));
        }, this.timeout);

        socket.on('connect', () => {
          this.logger.debug('Connected to ClamAV daemon');
          
          // Send INSTREAM command
          socket.write('zINSTREAM\0');
          
          // Send file size (4 bytes, big endian)
          const sizeBuffer = Buffer.allocUnsafe(4);
          sizeBuffer.writeUInt32BE(buffer.length, 0);
          socket.write(sizeBuffer);
          
          // Send file content
          socket.write(buffer);
          
          // Send zero-length chunk to indicate end of stream
          const endBuffer = Buffer.allocUnsafe(4);
          endBuffer.writeUInt32BE(0, 0);
          socket.write(endBuffer);
        });

        socket.on('data', (data) => {
          response += data.toString();
        });

        socket.on('end', () => {
          clearTimeout(timer);
          this.processClamAVResponse(response, filename)
            .then(resolve)
            .catch(reject);
        });

        socket.on('error', (error) => {
          clearTimeout(timer);
          this.logger.error('ClamAV connection error:', error);
          reject(error);
        });
      });

    } catch (error) {
      this.logger.error('Virus scan failed:', error, { filename });
      
      // In case of error, we'll allow the file but log the issue
      // This prevents the system from breaking if ClamAV is temporarily unavailable
      return {
        clean: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    try {
      if (!this.isClamAVConfigured()) {
        this.logger.warn('ClamAV not configured, skipping virus scan');
        return { clean: true };
      }

      const socket = createConnection(this.port, this.host);
      
      return new Promise<ScanResult>((resolve, reject) => {
        let response = '';
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error('ClamAV scan timeout'));
        }, this.timeout);

        socket.on('connect', () => {
          this.logger.debug('Connected to ClamAV daemon');
          socket.write(`zSCAN ${filePath}\0`);
        });

        socket.on('data', (data) => {
          response += data.toString();
        });

        socket.on('end', () => {
          clearTimeout(timer);
          this.processClamAVResponse(response, filePath)
            .then(resolve)
            .catch(reject);
        });

        socket.on('error', (error) => {
          clearTimeout(timer);
          this.logger.error('ClamAV connection error:', error);
          reject(error);
        });
      });

    } catch (error) {
      this.logger.error('Virus scan failed:', error, { filePath });
      
      return {
        clean: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.isClamAVConfigured()) {
        return false;
      }

      const socket = createConnection(this.port, this.host);
      
      return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
          socket.destroy();
          resolve(false);
        }, 5000); // 5 second timeout for ping

        socket.on('connect', () => {
          socket.write('zPING\0');
        });

        socket.on('data', (data) => {
          clearTimeout(timer);
          const response = data.toString().trim();
          socket.end();
          resolve(response === 'PONG');
        });

        socket.on('error', () => {
          clearTimeout(timer);
          resolve(false);
        });
      });

    } catch (error) {
      this.logger.debug('ClamAV ping failed:', error);
      return false;
    }
  }

  async getVersion(): Promise<string | null> {
    try {
      if (!this.isClamAVConfigured()) {
        return null;
      }

      const socket = createConnection(this.port, this.host);
      
      return new Promise<string | null>((resolve) => {
        let response = '';
        const timer = setTimeout(() => {
          socket.destroy();
          resolve(null);
        }, 5000);

        socket.on('connect', () => {
          socket.write('zVERSION\0');
        });

        socket.on('data', (data) => {
          response += data.toString();
        });

        socket.on('end', () => {
          clearTimeout(timer);
          resolve(response.trim());
        });

        socket.on('error', () => {
          clearTimeout(timer);
          resolve(null);
        });
      });

    } catch (error) {
      this.logger.debug('ClamAV version check failed:', error);
      return null;
    }
  }

  private async processClamAVResponse(response: string, filename?: string): Promise<ScanResult> {
    const cleanResponse = response.trim();
    
    this.logger.debug('ClamAV response:', { response: cleanResponse, filename });

    if (cleanResponse.includes('OK')) {
      return { clean: true };
    }

    if (cleanResponse.includes('FOUND')) {
      // Extract virus name from response
      const virusMatch = cleanResponse.match(/: (.+) FOUND/);
      const virus = virusMatch ? virusMatch[1] : 'Unknown virus';
      
      this.logger.warn('Virus detected:', { virus, filename });
      
      return {
        clean: false,
        virus,
      };
    }

    if (cleanResponse.includes('ERROR')) {
      const error = cleanResponse.replace('ERROR: ', '');
      this.logger.error('ClamAV scan error:', { error, filename });
      
      return {
        clean: true, // Allow file on error to prevent system breakage
        error,
      };
    }

    // Unknown response
    this.logger.warn('Unknown ClamAV response:', { response: cleanResponse, filename });
    
    return {
      clean: true,
      error: `Unknown ClamAV response: ${cleanResponse}`,
    };
  }

  private isClamAVConfigured(): boolean {
    return !!(process.env.CLAMAV_HOST && process.env.CLAMAV_PORT);
  }

  // Helper method for common file type checking
  isFileTypeAllowed(mimeType: string, allowedTypes?: string[]): boolean {
    const defaultAllowedTypes = (process.env.ALLOWED_FILE_TYPES || 
      'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,txt,csv,mp4,mov,avi'
    ).split(',');

    const allowedMimeTypes = (allowedTypes || defaultAllowedTypes).map(type => {
      // Convert file extensions to MIME types
      const mimeTypeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
      };

      return mimeTypeMap[type.toLowerCase()] || type;
    });

    return allowedMimeTypes.includes(mimeType);
  }

  isFileSizeAllowed(size: number, maxSize?: number): boolean {
    const maxFileSize = maxSize || parseInt(process.env.MAX_FILE_SIZE || '50000000'); // 50MB default
    return size <= maxFileSize;
  }
}
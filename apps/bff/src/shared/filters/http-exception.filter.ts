import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Get detailed error message
    let errorMessage = exception.message;
    let validationErrors = null;
    
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // Handle validation errors
      if ('message' in exceptionResponse && Array.isArray(exceptionResponse.message)) {
        validationErrors = exceptionResponse.message;
        errorMessage = 'Validation failed';
      } else if ('message' in exceptionResponse) {
        errorMessage = exceptionResponse.message as string;
      }
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
      ...(validationErrors && { validationErrors }),
      error: exceptionResponse,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `HTTP ${status} Error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} Error: ${exception.message}`,
        `${request.method} ${request.url}`,
      );
    }

    // Ensure we always return JSON
    response.setHeader('Content-Type', 'application/json');
    response.status(status).json(errorResponse);
  }
}

// Global exception filter for non-HTTP exceptions
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If it's already an HTTP exception, let the HTTP exception filter handle it
    if (exception instanceof HttpException) {
      return;
    }

    // Handle Multer errors specifically
    if (exception instanceof MulterError) {
      let status = HttpStatus.BAD_REQUEST;
      let message = 'File upload error';

      switch (exception.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File too large';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected file field';
          break;
        case 'LIMIT_PART_COUNT':
          message = 'Too many parts';
          break;
        case 'LIMIT_FIELD_KEY':
          message = 'Field name too long';
          break;
        case 'LIMIT_FIELD_VALUE':
          message = 'Field value too long';
          break;
        case 'LIMIT_FIELD_COUNT':
          message = 'Too many fields';
          break;
        default:
          message = exception.message || 'File upload error';
      }

      this.logger.warn(
        `Multer error (${exception.code}): ${exception.message}`,
        `${request.method} ${request.url}`,
      );

      const errorResponse = {
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message,
        error: {
          code: exception.code,
          message: exception.message,
        },
      };

      response.setHeader('Content-Type', 'application/json');
      response.status(status).json(errorResponse);
      return;
    }

    this.logger.error(
      `Unhandled exception: ${exception}`,
      exception instanceof Error ? exception.stack : 'No stack trace',
      `${request.method} ${request.url}`,
    );

    const errorResponse = {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? String(exception) : 'Internal server error',
    };

    response.setHeader('Content-Type', 'application/json');
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}
import winston from 'winston';
import { format } from 'winston';

export class Logger {
  private readonly logger: winston.Logger;
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const logObject = {
            timestamp,
            level,
            context: this.context,
            message,
            ...(stack && { stack }),
            ...(Object.keys(meta).length > 0 && { meta }),
          };
          return JSON.stringify(logObject);
        })
      ),
      transports: [
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            })
          ),
        }),
      ],
    });

    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5,
          tailable: true,
        })
      );

      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5,
          tailable: true,
        })
      );
    }
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const errorMeta = {
      ...meta,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
      ...(error && typeof error === 'object' && !(error instanceof Error) && { error }),
      ...(error && typeof error === 'string' && { error }),
    };

    this.logger.error(message, errorMeta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }
}
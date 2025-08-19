import { LogLevel } from '@nestjs/common';

/**
 * Environment-based logging configuration
 * CRITICAL: This prevents excessive logging that was hitting Railway's 500 logs/sec limit
 */
export class LoggingConfig {
  private static readonly LOG_LEVELS: Record<string, LogLevel[]> = {
    // Production: Only errors and warnings to minimize log volume
    production: ['error', 'warn'],
    
    // Development: Full logging for debugging
    development: ['error', 'warn', 'log', 'debug', 'verbose'],
    
    // Test: Minimal logging to avoid noise
    test: ['error', 'warn'],
    
    // Staging: Similar to production but with logs
    staging: ['error', 'warn', 'log'],
  };

  /**
   * Get appropriate log levels based on NODE_ENV
   */
  static getLogLevels(): LogLevel[] {
    const env = process.env.NODE_ENV || 'development';
    return this.LOG_LEVELS[env] || this.LOG_LEVELS.development;
  }

  /**
   * Get winston log level based on environment
   */
  static getWinstonLogLevel(): string {
    const env = process.env.NODE_ENV || 'development';
    
    // Use LOG_LEVEL env var if provided, otherwise use environment defaults
    if (process.env.LOG_LEVEL) {
      return process.env.LOG_LEVEL;
    }

    switch (env) {
      case 'production':
        return 'warn'; // Only warnings and errors
      case 'staging':
        return 'info';
      case 'test':
        return 'warn';
      default:
        return 'debug'; // Development
    }
  }

  /**
   * Check if debug logging is enabled
   */
  static isDebugEnabled(): boolean {
    return this.getLogLevels().includes('debug');
  }

  /**
   * Check if file logging should be enabled (disabled in production to reduce I/O)
   */
  static shouldUseFileLogging(): boolean {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'production' && env !== 'test';
  }
}
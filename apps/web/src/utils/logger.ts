/**
 * Production-safe logging utility
 */

interface Logger {
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

const isDevelopment = import.meta.env.DEV;

const createLogger = (): Logger => {
  return {
    error: (message: string, ...args: unknown[]) => {
      console.error(`[ERROR] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[WARN] ${message}`, ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        console.info(`[INFO] ${message}`, ...args);
      }
    },
    debug: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        console.log(`[DEBUG] ${message}`, ...args);
      }
    }
  };
};

export const logger = createLogger();

/**
 * Log API requests in development only
 */
export const logApiRequest = (method: string, url: string, data?: unknown) => {
  if (isDevelopment) {
    logger.debug(`API ${method.toUpperCase()} ${url}`, data);
  }
};

/**
 * Log API responses in development only  
 */
export const logApiResponse = (url: string, data?: unknown) => {
  if (isDevelopment) {
    logger.debug(`API Response ${url}`, data);
  }
};

/**
 * Log API errors (always logged)
 */
export const logApiError = (url: string, error: unknown) => {
  logger.error(`API Error ${url}`, error);
};
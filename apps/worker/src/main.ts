import 'reflect-metadata';
import { config } from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { WorkerApplication } from './worker-application';
import { Logger } from './services/logger.service';

// Load environment variables
config();

const logger = new Logger('Main');

async function bootstrap() {
  try {
    // Create Express app for health checks
    const app = express();
    const port = process.env.PORT || 3001;

    // Security middleware
    app.use(helmet());
    app.use(compression());
    app.use(express.json({ limit: '10mb' }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '0.0.0'
      });
    });

    // Metrics endpoint (for monitoring)
    app.get('/metrics', (req, res) => {
      res.json({
        jobs: {
          // Will be populated by WorkerApplication
        },
        queues: {
          // Will be populated by WorkerApplication
        }
      });
    });

    // Start the worker application
    const workerApp = new WorkerApplication();
    await workerApp.start();

    // Start HTTP server
    app.listen(port, () => {
      logger.info(`Worker server listening on port ${port}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        await workerApp.stop();
        logger.info('Worker application stopped successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start worker application:', error);
    process.exit(1);
  }
}

bootstrap();
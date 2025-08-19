import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { LoggingConfig } from './config/logging.config';
import { LoggerService } from './shared/logger/logger.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Set LOG_LEVEL environment variable if not set
  if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = LoggingConfig.getWinstonLogLevel();
  }
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: LoggingConfig.getLogLevels(),
      bufferLogs: true, // Buffer logs until custom logger is ready (NestJS v11 requirement)
    });
    
    // Wait for app to fully initialize before setting custom logger
    const customLogger = app.get(LoggerService);
    app.useLogger(customLogger);

    const configService = app.get(ConfigService);
    const port = configService.get('PORT') || 3000;
    const nodeEnv = configService.get('NODE_ENV') || 'development';

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }));
    
    app.use(compression());

    // CORS configuration for Railway deployment
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://frontend-production-55d3.up.railway.app', // Explicit frontend URL
      ...(configService.get('FRONTEND_URL') ? [configService.get('FRONTEND_URL')] : []),
    ];
    
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Check if origin is a Railway app
        if (origin.endsWith('.railway.app')) {
          return callback(null, true);
        }
        
        // Reject other origins
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'X-Organization-Id',
        'X-Property-Id',
        'x-organization-id',
        'x-property-id'
      ],
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global prefix for API routes
    app.setGlobalPrefix('api');

    // Swagger documentation (only in development)
    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Nayara HR Portal API')
        .setDescription('Backend API for Nayara Bocas del Toro HR Portal')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      
      logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
    }

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: nodeEnv,
      });
    });

    await app.listen(port, '0.0.0.0');
    
    logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
    logger.log(`🌍 Environment: ${nodeEnv}`);
    logger.log(`💾 Database: ${configService.get('DATABASE_URL') ? 'Connected' : 'Not configured'}`);
    
  } catch (error) {
    // Enhanced error logging for better debugging
    logger.error('Failed to start application:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    
    // Fallback console logging for production debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('Bootstrap failed - Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
        port: process.env.PORT,
        nodeVersion: process.version,
      });
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
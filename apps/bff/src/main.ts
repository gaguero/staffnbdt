import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Debug DATABASE_URL at startup
  console.log('=== Environment Check at Startup ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    const masked = url.replace(/:([^@]+)@/, ':****@');
    console.log('DATABASE_URL format:', masked);
  } else {
    console.log('⚠️  DATABASE_URL is not set!');
  }
  console.log('=====================================');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get('PORT') || 3000;
    const nodeEnv = configService.get('NODE_ENV') || 'development';

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }));
    
    app.use(compression());

    // CORS configuration for Railway deployment
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://*.railway.app',
        ...(configService.get('FRONTEND_URL') ? [configService.get('FRONTEND_URL')] : []),
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
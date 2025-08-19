import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;
  private databaseAvailable: boolean;

  constructor() {
    // Explicitly pass DATABASE_URL to avoid build-time baking issues
    const databaseUrl = process.env.DATABASE_URL;
    
    // Super call must be first for TypeScript/NestJS v11 compatibility
    if (!databaseUrl) {
      console.warn('DATABASE_URL not set, database features will be disabled');
      super({
        datasources: {
          db: {
            url: 'postgresql://dummy:dummy@localhost:5432/dummy'
          }
        },
        log: [],
      });
    } else {
      // Parse connection string to add connection pool settings
      const url = new URL(databaseUrl);
      url.searchParams.set('connection_limit', '10');
      url.searchParams.set('pool_timeout', '10');
      
      super({
        datasources: {
          db: {
            url: url.toString(),
          },
        },
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
      });
    }
    
    // Initialize properties after super() call
    this.logger = new Logger(PrismaService.name);
    this.databaseAvailable = !!databaseUrl;
  }

  async onModuleInit() {
    if (!this.databaseAvailable) {
      this.logger.warn('Skipping database connection - DATABASE_URL not set');
      return;
    }
    
    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      
      // Don't throw in production - let the app start and handle gracefully
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn('Database connection failed, retrying in 5 seconds...');
        // Schedule retry without blocking startup
        setTimeout(() => this.retryConnection(), 5000);
      } else {
        throw error;
      }
    }
  }

  private async retryConnection() {
    if (!this.databaseAvailable) return;
    
    try {
      await this.$connect();
      this.logger.log('Database reconnected successfully');
    } catch (error) {
      this.logger.error('Database retry failed:', error);
      // Schedule another retry
      setTimeout(() => this.retryConnection(), 10000);
    }
  }

  async onModuleDestroy() {
    if (this.databaseAvailable) {
      await this.$disconnect();
      this.logger.log('Disconnected from database');
    }
  }

  /**
   * Check if database is available for operations
   */
  isDatabaseAvailable(): boolean {
    return this.databaseAvailable;
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Clean in reverse order of dependencies
    await this.auditLog.deleteMany();
    await this.notification.deleteMany();
    await this.commercialBenefit.deleteMany();
    await this.enrollment.deleteMany();
    await this.trainingSession.deleteMany();
    await this.vacation.deleteMany();
    await this.payslip.deleteMany();
    await this.document.deleteMany();
    await this.user.deleteMany();
    await this.department.deleteMany();
  }
}
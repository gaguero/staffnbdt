import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Debug DATABASE_URL before calling super
    console.log('=== PrismaService Constructor ===');
    console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      const masked = url.replace(/:([^@]+)@/, ':****@');
      console.log('DATABASE_URL value:', masked);
    }
    console.log('================================');
    
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
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
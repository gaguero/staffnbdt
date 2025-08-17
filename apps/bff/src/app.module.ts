import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Core modules
import { DatabaseModule } from './shared/database/database.module';
import { LoggerModule } from './shared/logger/logger.module';
import { AuditModule } from './shared/audit/audit.module';
import { StorageModule } from './shared/storage/storage.module';

// Guards, filters, and interceptors
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { CoreModule } from './modules/core/core.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FilesModule } from './modules/files/files.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { VacationModule } from './modules/vacation/vacation.module';
import { TrainingModule } from './modules/training/training.module';
import { BenefitsModule } from './modules/benefits/benefits.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProfileModule } from './modules/profile/profile.module';
import { InvitationsModule } from './modules/invitations/invitations.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: parseInt(configService.get('THROTTLE_TTL', '60000')), // 1 minute
          limit: parseInt(configService.get('THROTTLE_LIMIT', '100')), // 100 requests
        },
      ],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,
    LoggerModule,
    AuditModule,
    StorageModule,

    // Feature modules
    AuthModule,
    CoreModule,
    UsersModule,
    DepartmentsModule,
    DocumentsModule,
    FilesModule,
    PayrollModule,
    VacationModule,
    TrainingModule,
    BenefitsModule,
    NotificationsModule,
    ProfileModule,
    InvitationsModule,
  ],
  controllers: [],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
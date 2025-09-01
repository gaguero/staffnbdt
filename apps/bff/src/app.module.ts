import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
// Removed ScheduleModule due to crypto module unavailability in Railway environment
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Core modules
import { DatabaseModule } from './shared/database/database.module';
import { LoggerModule } from './shared/logger/logger.module';
import { AuditModule } from './shared/audit/audit.module';
import { StorageModule } from './shared/storage/storage.module';
import { SharedModule } from './shared/shared.module';
import { TenantModule } from './shared/tenant/tenant.module';

// Guards, filters, and interceptors
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { HttpExceptionFilter, GlobalExceptionFilter } from './shared/filters/http-exception.filter';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { TenantInterceptor } from './shared/tenant/tenant.interceptor';

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
import { PermissionModule } from './modules/permissions/permission.module';
import { OrganizationModule } from './modules/organizations/organization.module';
import { PropertyModule } from './modules/properties/property.module';
import { BrandingModule } from './modules/branding/branding.module';
import { AdminModule } from './modules/admin/admin.module';
import { UnitsModule } from './modules/units/units.module';
import { GuestsModule } from './modules/guests/guests.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { RolesModule } from './modules/roles/roles.module';
import { ModuleRegistryModule } from './modules/module-registry/module-registry.module';
import { ConciergeModule } from './modules/concierge/concierge.module';
import { VendorsModule } from './modules/vendors/vendors.module';

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

    // Task scheduling removed due to crypto module issues in Railway
    // Manual scheduling implemented in individual services

    // Core modules
    DatabaseModule,
    LoggerModule,
    AuditModule,
    StorageModule,
    SharedModule,
    TenantModule,

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
    PermissionModule,
    OrganizationModule,
    PropertyModule,
    BrandingModule,
    AdminModule,
    UnitsModule,
    GuestsModule,
    ReservationsModule,
    RolesModule,
    ModuleRegistryModule,
    ConciergeModule,
    VendorsModule,
  ],
  controllers: [],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global filters (order matters: GlobalExceptionFilter should be first to catch all, then HttpExceptionFilter for HTTP-specific)
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global interceptors (order matters: TenantInterceptor should run before AuditInterceptor)
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
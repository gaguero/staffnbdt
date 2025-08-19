import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { JwtPayload } from '../../modules/auth/auth.service';
import { TenantService } from './tenant.service';
import { LoggingConfig } from '../../config/logging.config';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantService: TenantService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Skip tenant context for non-authenticated routes
    if (!request.user) {
      // Only log in debug mode to prevent excessive logging
      if (LoggingConfig.isDebugEnabled()) {
        this.safeLog('debug', 'Skipping tenant context injection for unauthenticated request');
      }
      return next.handle();
    }

    const user = request.user;
    const jwtPayload = user as JwtPayload;

    // Only log tenant context setup in debug mode
    if (LoggingConfig.isDebugEnabled()) {
      this.safeLog('debug', `Setting tenant context for user: ${jwtPayload.email}`);
    }

    try {
      // Extract tenant information from JWT payload
      let organizationId = jwtPayload.organizationId;
      let propertyId = jwtPayload.propertyId;

      // If user doesn't have tenant info in JWT, try to get from database
      if (!organizationId || !propertyId) {
        // This is important to log as it indicates potential JWT issues
        this.safeLog('warn', `User ${jwtPayload.email} missing tenant info in JWT, fetching from database`);
        const tenantContext = await this.tenantService.getTenantFromUser(jwtPayload.sub);
        
        if (!tenantContext) {
          // This is important to log as it indicates user setup issues
          this.safeLog('warn', `No tenant context found for user ${jwtPayload.email}, using default tenant`);
          const defaultTenant = await this.tenantService.getDefaultTenant();
          organizationId = defaultTenant.organization.id;
          propertyId = defaultTenant.property.id;
        } else {
          organizationId = tenantContext.organization.id;
          propertyId = tenantContext.property.id;
        }
      }

      // Set tenant context for this request (this also sets it on the request object)
      await this.tenantContextService.setTenantContext({
        userId: jwtPayload.sub,
        organizationId,
        propertyId,
        departmentId: jwtPayload.departmentId,
        userRole: jwtPayload.role,
      }, request);

      // Only log success in debug mode to prevent log spam
      if (LoggingConfig.isDebugEnabled()) {
        this.safeLog('debug', `Tenant context set successfully for ${jwtPayload.email}`);
      }
    } catch (error) {
      // Always log errors as they indicate real issues
      this.safeLog('error', `Failed to set tenant context for user ${jwtPayload.email}: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to validate tenant access');
    }

    return next.handle();
  }

  /**
   * Safe logging method that handles undefined logger gracefully
   * Now respects log level configuration to prevent excessive logging
   */
  private safeLog(level: 'debug' | 'log' | 'warn' | 'error', message: string, ...optionalParams: any[]): void {
    try {
      if (this.logger && typeof this.logger[level] === 'function') {
        this.logger[level](message, ...optionalParams);
      } else if (level === 'error' || level === 'warn') {
        // Only fallback to console for important messages (errors/warnings)
        // This prevents debug/log fallbacks from causing excessive logging
        console[level](`[TenantInterceptor] ${message}`, ...optionalParams);
      }
    } catch (error) {
      // Ultimate fallback - only for critical errors
      if (level === 'error') {
        console.error(`[TenantInterceptor] ${message}`, ...optionalParams);
      }
    }
  }
}
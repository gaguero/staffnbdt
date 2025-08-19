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
      this.safeLog('debug', 'Skipping tenant context injection for unauthenticated request');
      return next.handle();
    }

    const user = request.user;
    const jwtPayload = user as JwtPayload;

    this.safeLog('debug', `Setting tenant context for user: ${jwtPayload.email}, org: ${jwtPayload.organizationId}, property: ${jwtPayload.propertyId}`);

    try {
      // Extract tenant information from JWT payload
      let organizationId = jwtPayload.organizationId;
      let propertyId = jwtPayload.propertyId;

      // If user doesn't have tenant info in JWT, try to get from database
      if (!organizationId || !propertyId) {
        this.safeLog('warn', `User ${jwtPayload.email} missing tenant info in JWT, fetching from database`);
        const tenantContext = await this.tenantService.getTenantFromUser(jwtPayload.sub);
        
        if (!tenantContext) {
          // If no tenant context found, get default tenant
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

      this.safeLog('debug', `Tenant context set successfully for ${jwtPayload.email}`);
    } catch (error) {
      this.safeLog('error', `Failed to set tenant context for user ${jwtPayload.email}: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to validate tenant access');
    }

    return next.handle();
  }

  /**
   * Safe logging method that handles undefined logger gracefully
   */
  private safeLog(level: 'debug' | 'log' | 'warn' | 'error', message: string, ...optionalParams: any[]): void {
    try {
      if (this.logger && typeof this.logger[level] === 'function') {
        this.logger[level](message, ...optionalParams);
      } else {
        // Fallback to console if logger is not available
        console[level === 'debug' ? 'log' : level](`[TenantInterceptor] ${message}`, ...optionalParams);
      }
    } catch (error) {
      // Ultimate fallback
      console.log(`[TenantInterceptor] ${message}`, ...optionalParams);
    }
  }
}
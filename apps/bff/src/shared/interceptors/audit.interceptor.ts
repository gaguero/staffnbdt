import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditOptions || auditOptions.skipAudit) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUser = request.user;

    if (!user) {
      return next.handle();
    }

    const entityId = this.extractEntityId(request, auditOptions);
    const oldData = request.body;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];
    const actingOrg = request.headers['x-organization-id'] || request.headers['x-org-id'];
    const actingProp = request.headers['x-property-id'] || request.headers['x-prop-id'];
    const actingAs = request.headers['x-acting-as'] || (user.role === 'PLATFORM_ADMIN' ? 'platform-admin' : undefined);

    return next.handle().pipe(
      tap((response) => {
        // Log the audit entry asynchronously
        setImmediate(() => {
          this.auditService.log({
            userId: user.id,
            action: auditOptions.action,
            entity: auditOptions.entity,
            entityId: entityId || 'unknown',
            oldData,
            newData: response,
            ipAddress,
            userAgent,
          });
        });
      }),
    );
  }

  private extractEntityId(request: any, auditOptions: AuditOptions): string | null {
    // Try to extract entity ID from various sources
    return (
      request.params?.id ||
      request.params?.[`${auditOptions.entity.toLowerCase()}Id`] ||
      request.body?.id ||
      null
    );
  }
}
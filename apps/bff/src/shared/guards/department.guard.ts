import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';

@Injectable()
export class DepartmentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: CurrentUser = request.user;
    
    if (!user) {
      return false;
    }

    // Superadmins can access everything
    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    // Department admins can only access their own department
    if (user.role === Role.DEPARTMENT_ADMIN) {
      const targetDepartmentId = this.extractDepartmentId(request);
      
      if (targetDepartmentId && user.departmentId !== targetDepartmentId) {
        throw new ForbiddenException('Access denied: insufficient department permissions');
      }
    }

    // Staff can only access their own resources
    if (user.role === Role.STAFF) {
      const targetUserId = this.extractUserId(request);
      
      if (targetUserId && user.id !== targetUserId) {
        throw new ForbiddenException('Access denied: can only access own resources');
      }
    }

    return true;
  }

  private extractDepartmentId(request: any): string | null {
    // Try to extract department ID from various sources
    return (
      request.params?.departmentId ||
      request.body?.departmentId ||
      request.query?.departmentId ||
      null
    );
  }

  private extractUserId(request: any): string | null {
    // Try to extract user ID from various sources
    return (
      request.params?.userId ||
      request.params?.id ||
      request.body?.userId ||
      request.query?.userId ||
      null
    );
  }
}
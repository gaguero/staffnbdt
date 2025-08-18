import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../shared/database/prisma.service';
import { Role } from '@prisma/client';
import { applySoftDelete } from '../../../shared/utils/soft-delete';

export const USER_ACCESS_KEY = 'userAccess';
export const UserAccess = (operation: 'view' | 'edit' | 'delete' | 'create') =>
  SetMetadata(USER_ACCESS_KEY, operation);

@Injectable()
export class UserAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const operation = this.reflector.getAllAndOverride<string>(USER_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!operation) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const currentUser = request.user;
    const targetUserId = request.params.id;

    if (!currentUser) {
      return false;
    }

    // Superadmins can access everything
    if (currentUser.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Handle different operations
    switch (operation) {
      case 'create':
        // Only superadmins can create users
        return currentUser.role === Role.PLATFORM_ADMIN;

      case 'view':
        return this.canViewUser(currentUser, targetUserId);

      case 'edit':
        return this.canEditUser(currentUser, targetUserId);

      case 'delete':
        // Only superadmins can delete users
        return currentUser.role === Role.PLATFORM_ADMIN;

      default:
        return false;
    }
  }

  private async canViewUser(currentUser: any, targetUserId: string): Promise<boolean> {
    // Staff can only view themselves
    if (currentUser.role === Role.STAFF) {
      return currentUser.id === targetUserId;
    }

    // Department admin can view users in their department
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      if (currentUser.id === targetUserId) {
        return true;
      }

      const targetUser = await this.prisma.user.findFirst({
        where: applySoftDelete({ where: { id: targetUserId } }).where,
        select: { departmentId: true },
      });

      if (!targetUser) {
        throw new ForbiddenException('User not found');
      }

      return targetUser.departmentId === currentUser.departmentId;
    }

    return false;
  }

  private async canEditUser(currentUser: any, targetUserId: string): Promise<boolean> {
    // Staff can only edit themselves
    if (currentUser.role === Role.STAFF) {
      return currentUser.id === targetUserId;
    }

    // Department admin can edit users in their department (except other admins)
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      if (currentUser.id === targetUserId) {
        return true;
      }

      const targetUser = await this.prisma.user.findFirst({
        where: applySoftDelete({ where: { id: targetUserId } }).where,
        select: { departmentId: true, role: true },
      });

      if (!targetUser) {
        throw new ForbiddenException('User not found');
      }

      // Cannot edit users from other departments
      if (targetUser.departmentId !== currentUser.departmentId) {
        return false;
      }

      // Cannot edit other admins
      if (targetUser.role === Role.PLATFORM_ADMIN || targetUser.role === Role.DEPARTMENT_ADMIN) {
        return false;
      }

      return true;
    }

    return false;
  }
}
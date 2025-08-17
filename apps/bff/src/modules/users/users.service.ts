import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { applySoftDelete } from '../../shared/utils/soft-delete';
import { CreateUserDto, UpdateUserDto, UserFilterDto, ChangeRoleDto, ChangeStatusDto, ChangeDepartmentDto, BulkImportDto, BulkImportResultDto, BulkImportUserDto } from './dto';
import { UserWithDepartment, UserStats, UserPermissions } from './interfaces';
import { User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    currentUser: User,
  ): Promise<UserWithDepartment> {
    // Only superadmins can create users
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can create users');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Validate department assignment rules
    this.validateDepartmentAssignment(createUserDto.role, createUserDto.departmentId);

    // Validate department exists if provided
    if (createUserDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: createUserDto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Department not found');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        organizationId: currentUser.organizationId, // Inherit from current user
        propertyId: currentUser.propertyId, // Inherit from current user
        emergencyContact: createUserDto.emergencyContact || null,
      },
      include: {
        department: true,
      },
    });

    // Log user creation
    await this.auditService.logCreate(currentUser.id, 'User', user.id, user);

    return user;
  }

  async findAll(
    filterDto: UserFilterDto,
    currentUser: User,
  ): Promise<PaginatedResponse<UserWithDepartment>> {
    const { limit, offset, role, departmentId, search, includeInactive } = filterDto;

    // Build where clause based on user role and filters
    let whereClause: any = {};

    // Apply soft delete filtering conditionally
    // When includeInactive is true, include both active and inactive users
    // When includeInactive is false, only include active users (exclude deleted)
    console.log('UsersService.findAll - includeInactive type:', typeof includeInactive, 'value:', includeInactive);
    
    // The Transform decorator in DTO should have already converted to boolean
    const includeDeleted = includeInactive === true;
    console.log('UsersService.findAll - includeDeleted:', includeDeleted);
    
    const queryWithSoftDelete = applySoftDelete({ where: whereClause }, includeDeleted);
    console.log('UsersService.findAll - queryWithSoftDelete:', JSON.stringify(queryWithSoftDelete, null, 2));
    whereClause = queryWithSoftDelete.where || {};

    // Apply role-based filtering
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      // Department admins can only see users in their department
      whereClause.departmentId = currentUser.departmentId;
    } else if (currentUser.role === Role.STAFF) {
      // Staff can only see themselves
      whereClause.id = currentUser.id;
    }

    // Apply additional filters
    if (role) {
      whereClause.role = role;
    }

    if (departmentId) {
      // Ensure department admin can't access other departments
      if (currentUser.role === Role.DEPARTMENT_ADMIN && currentUser.departmentId !== departmentId) {
        throw new ForbiddenException('Cannot access users from other departments');
      }
      whereClause.departmentId = departmentId;
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('UsersService.findAll - final whereClause:', JSON.stringify(whereClause, null, 2));
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        include: {
          department: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    console.log('UsersService.findAll - found users:', users.length, 'total:', total);
    console.log('UsersService.findAll - users:', users.map(u => ({ id: u.id, email: u.email, deletedAt: u.deletedAt })));

    return new PaginatedResponse(users, total, limit, offset);
  }

  async findOne(id: string, currentUser: User): Promise<UserWithDepartment> {
    // Check access permissions
    if (currentUser.role === Role.STAFF && currentUser.id !== id) {
      throw new ForbiddenException('Can only access your own profile');
    }

    const user = await this.prisma.user.findFirst({
      where: applySoftDelete({ where: { id } }).where,
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Department admin can only see users in their department
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      user.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot access users from other departments');
    }

    // Log user view for sensitive operations
    if (currentUser.id !== id) {
      await this.auditService.logView(currentUser.id, 'User', id);
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<UserWithDepartment> {
    const existingUser = await this.findOne(id, currentUser);

    // Permission checks
    if (currentUser.role === Role.STAFF && currentUser.id !== id) {
      throw new ForbiddenException('Can only update your own profile');
    }

    // Staff users can only update certain fields
    if (currentUser.role === Role.STAFF) {
      const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'emergencyContact', 'profilePhoto'];
      const attemptedFields = Object.keys(updateUserDto);
      const forbiddenFields = attemptedFields.filter(field => !allowedFields.includes(field));
      
      if (forbiddenFields.length > 0) {
        throw new ForbiddenException(`Staff users cannot update: ${forbiddenFields.join(', ')}`);
      }
    }

    // Department admin cannot change roles or move users to other departments
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      if (updateUserDto.role && updateUserDto.role !== existingUser.role) {
        throw new ForbiddenException('Department admins cannot change user roles');
      }
      
      if (updateUserDto.departmentId && updateUserDto.departmentId !== currentUser.departmentId) {
        throw new ForbiddenException('Cannot move users to other departments');
      }
    }

    // Validate department assignment if role is being changed
    if (updateUserDto.role) {
      this.validateDepartmentAssignment(
        updateUserDto.role,
        updateUserDto.departmentId || existingUser.departmentId,
      );
    }

    // Validate department exists if provided
    if (updateUserDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateUserDto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Department not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        emergencyContact: updateUserDto.emergencyContact || existingUser.emergencyContact,
      },
      include: {
        department: true,
      },
    });

    // Log user update
    await this.auditService.logUpdate(
      currentUser.id,
      'User',
      id,
      existingUser,
      updatedUser,
    );

    return updatedUser;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    // Only superadmins can delete users
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can delete users');
    }

    // Cannot delete self
    if (currentUser.id === id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: applySoftDelete({ where: { id } }).where,
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Log user deletion
    await this.auditService.logDelete(currentUser.id, 'User', id, existingUser);
  }

  async restore(id: string, currentUser: User): Promise<UserWithDepartment> {
    // Only superadmins can restore users
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can restore users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        department: true,
      },
    });

    // Log user restoration
    await this.auditService.log({
      userId: currentUser.id,
      action: 'RESTORE',
      entity: 'User',
      entityId: id,
      newData: restoredUser,
    });

    return restoredUser;
  }

  async permanentDelete(id: string, currentUser: User): Promise<void> {
    // Only superadmins can permanently delete users
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can permanently delete users');
    }

    // Cannot delete self
    if (currentUser.id === id) {
      throw new BadRequestException('Cannot permanently delete your own account');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Can only permanently delete users that are already soft-deleted (inactive)
    if (!existingUser.deletedAt) {
      throw new BadRequestException('Can only permanently delete inactive users. Please deactivate the user first.');
    }

    // Check for related data that would prevent deletion
    // Check for audit logs, payslips, etc. that reference this user
    const [auditLogCount, payslipCount, vacationCount, enrollmentCount, notificationCount] = await Promise.all([
      this.prisma.auditLog.count({ where: { userId: id } }),
      this.prisma.payslip.count({ where: { userId: id } }),
      this.prisma.vacation.count({ where: { userId: id } }),
      this.prisma.enrollment.count({ where: { userId: id } }),
      this.prisma.notification.count({ where: { userId: id } }),
    ]);

    if (auditLogCount > 0 || payslipCount > 0 || vacationCount > 0 || enrollmentCount > 0 || notificationCount > 0) {
      throw new BadRequestException(
        'Cannot permanently delete user with existing records (audit logs, payslips, vacations, enrollments, or notifications). ' +
        'Consider keeping the user deactivated for data integrity.'
      );
    }

    // Log the permanent deletion before deleting
    await this.auditService.logDelete(currentUser.id, 'User', id, existingUser);

    // Perform hard delete from database
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getUsersByDepartment(departmentId: string, currentUser: User): Promise<UserWithDepartment[]> {
    // Check permissions
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      currentUser.departmentId !== departmentId
    ) {
      throw new ForbiddenException('Cannot access users from other departments');
    }

    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff cannot access department user lists');
    }

    return this.prisma.user.findMany({
      where: applySoftDelete({ where: { departmentId } }).where,
      include: {
        department: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  async getUserStats(currentUser: User): Promise<UserStats> {
    // Only superadmins and department admins can view stats
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff cannot access user statistics');
    }

    // Base where clause for department scoping
    let baseWhereClause: any = {};
    
    // Department admins only see their department
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      baseWhereClause.departmentId = currentUser.departmentId;
    }

    // Get counts including all users (active + inactive) for total
    const totalWhereClause = applySoftDelete({ where: baseWhereClause }, true).where || {};
    
    // Get counts excluding deleted users for active stats
    const activeWhereClause = applySoftDelete({ where: baseWhereClause }, false).where || {};

    const [total, active, byRole, byDepartment] = await Promise.all([
      // Total count includes both active and inactive users
      this.prisma.user.count({ where: totalWhereClause }),
      // Active count excludes deleted users
      this.prisma.user.count({ where: activeWhereClause }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: activeWhereClause, // Use active for role breakdown
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['departmentId'],
        where: activeWhereClause, // Use active for department breakdown
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active, // Calculate inactive count
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<Role, number>),
      byDepartment: byDepartment.reduce((acc, item) => {
        if (item.departmentId) {
          acc[item.departmentId] = item._count;
        }
        return acc;
      }, {}),
    };
  }

  async changeRole(
    id: string,
    changeRoleDto: ChangeRoleDto,
    currentUser: User,
  ): Promise<UserWithDepartment> {
    // Only superadmins can change roles
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can change user roles');
    }

    // Cannot change own role
    if (currentUser.id === id) {
      throw new BadRequestException('Cannot change your own role');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: applySoftDelete({ where: { id } }).where,
      include: {
        department: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Validate the new role assignment
    this.validateDepartmentAssignment(changeRoleDto.role, existingUser.departmentId);

    // Prevent orphaning departments - check if this is the last admin of a department
    if (
      existingUser.role === Role.DEPARTMENT_ADMIN &&
      changeRoleDto.role !== Role.DEPARTMENT_ADMIN &&
      existingUser.departmentId
    ) {
        const hasOtherAdmins = await this.validateDepartmentAdminRemoval(
        existingUser.departmentId,
        id,
      );

      if (!hasOtherAdmins) {
        throw new BadRequestException(
          'Cannot change role - this user is the last admin of their department',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        role: changeRoleDto.role,
        // If changing to SUPERADMIN, remove department assignment
        departmentId: changeRoleDto.role === Role.SUPERADMIN ? null : existingUser.departmentId,
      },
      include: {
        department: true,
      },
    });

    // Log role change
    await this.auditService.logUpdate(
      currentUser.id,
      'User',
      id,
      { role: existingUser.role },
      { role: updatedUser.role },
    );

    return updatedUser;
  }

  async changeStatus(
    id: string,
    changeStatusDto: ChangeStatusDto,
    currentUser: User,
  ): Promise<UserWithDepartment> {
    // Only superadmins and department admins can change status
    if (currentUser.role !== Role.SUPERADMIN && currentUser.role !== Role.DEPARTMENT_ADMIN) {
      throw new ForbiddenException('Only admins can change user status');
    }

    // Cannot change own status
    if (currentUser.id === id) {
      throw new BadRequestException('Cannot change your own status');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { id }, // Don't apply soft delete filter here to find inactive users
      include: {
        department: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Department admin can only change status of users in their department
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      existingUser.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot change status of users from other departments');
    }

    // Department admin cannot change status of other admins
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      (existingUser.role === Role.SUPERADMIN || existingUser.role === Role.DEPARTMENT_ADMIN)
    ) {
      throw new ForbiddenException('Department admins cannot change status of other admins');
    }

    // Prevent orphaning departments - check if this is the last admin of a department
    if (
      !changeStatusDto.isActive &&
      existingUser.role === Role.DEPARTMENT_ADMIN &&
      existingUser.departmentId
    ) {
      const hasOtherAdmins = await this.validateDepartmentAdminRemoval(
        existingUser.departmentId,
        id,
      );

      if (!hasOtherAdmins) {
        throw new BadRequestException(
          'Cannot deactivate - this user is the last active admin of their department',
        );
      }
    }

    const currentStatus = !existingUser.deletedAt;
    
    // If status is not changing, return current user
    if (currentStatus === changeStatusDto.isActive) {
      return existingUser;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: changeStatusDto.isActive ? null : new Date(),
      },
      include: {
        department: true,
      },
    });

    // Log status change
    await this.auditService.logUpdate(
      currentUser.id,
      'User',
      id,
      { isActive: currentStatus },
      { isActive: changeStatusDto.isActive },
    );

    return updatedUser;
  }

  async changeDepartment(
    id: string,
    changeDepartmentDto: ChangeDepartmentDto,
    currentUser: User,
  ): Promise<UserWithDepartment> {
    // Only superadmins and department admins can change departments
    if (currentUser.role !== Role.SUPERADMIN && currentUser.role !== Role.DEPARTMENT_ADMIN) {
      throw new ForbiddenException('Only admins can change user departments');
    }

    // Cannot change own department
    if (currentUser.id === id) {
      throw new BadRequestException('Cannot change your own department');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { id }, // Don't apply soft delete filter here to find inactive users
      include: {
        department: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Department admin can only change departments for users in their department
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      existingUser.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot change department for users from other departments');
    }

    // Validate new department exists
    const newDepartment = await this.prisma.department.findUnique({
      where: { id: changeDepartmentDto.departmentId },
    });

    if (!newDepartment) {
      throw new BadRequestException('Target department not found');
    }

    // Validate department assignment rules
    this.validateDepartmentAssignment(existingUser.role, changeDepartmentDto.departmentId);

    // Prevent orphaning departments - check if this is the last admin of a department
    if (
      existingUser.role === Role.DEPARTMENT_ADMIN &&
      existingUser.departmentId
    ) {
      const hasOtherAdmins = await this.validateDepartmentAdminRemoval(
        existingUser.departmentId,
        id,
      );

      if (!hasOtherAdmins) {
        throw new BadRequestException(
          'Cannot change department - this user is the last admin of their current department',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        departmentId: changeDepartmentDto.departmentId,
      },
      include: {
        department: true,
      },
    });

    // Log department change
    await this.auditService.logUpdate(
      currentUser.id,
      'User',
      id,
      { departmentId: existingUser.departmentId },
      { departmentId: updatedUser.departmentId },
    );

    return updatedUser;
  }

  async removeFromDepartment(
    id: string,
    currentUser: User,
  ): Promise<UserWithDepartment> {
    // Only superadmins and department admins can remove from departments
    if (currentUser.role !== Role.SUPERADMIN && currentUser.role !== Role.DEPARTMENT_ADMIN) {
      throw new ForbiddenException('Only admins can remove users from departments');
    }

    // Cannot change own department
    if (currentUser.id === id) {
      throw new BadRequestException('Cannot remove yourself from a department');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { id }, // Don't apply soft delete filter here to find inactive users
      include: {
        department: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Department admin can only remove users from their department
    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      existingUser.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot remove users from other departments');
    }

    // Cannot remove users with roles that require departments
    if (existingUser.role === Role.STAFF || existingUser.role === Role.DEPARTMENT_ADMIN) {
      throw new BadRequestException(
        `Cannot remove ${existingUser.role.replace('_', ' ')} users from departments - they must belong to a department`,
      );
    }

    // If user doesn't have a department, nothing to do
    if (!existingUser.departmentId) {
      return existingUser;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        departmentId: null,
      },
      include: {
        department: true,
      },
    });

    // Log department removal
    await this.auditService.logUpdate(
      currentUser.id,
      'User',
      id,
      { departmentId: existingUser.departmentId },
      { departmentId: null },
    );

    return updatedUser;
  }

  /**
   * Get user permissions for the current user context
   * This helps frontend determine what actions are available
   */
  async getUserPermissions(
    targetUserId: string,
    currentUser: User,
  ): Promise<UserPermissions> {
    const isSuperAdmin = currentUser.role === Role.SUPERADMIN;
    const isDepartmentAdmin = currentUser.role === Role.DEPARTMENT_ADMIN;
    const isSelf = currentUser.id === targetUserId;

    // Default permissions
    const permissions = {
      canView: false,
      canEdit: false,
      canDelete: false,
      canChangeRole: false,
      canChangeStatus: false,
    };

    // Superadmins can do everything
    if (isSuperAdmin) {
      permissions.canView = true;
      permissions.canEdit = true;
      permissions.canDelete = targetUserId !== currentUser.id; // Cannot delete self
      permissions.canChangeRole = targetUserId !== currentUser.id; // Cannot change own role
      permissions.canChangeStatus = targetUserId !== currentUser.id; // Cannot change own status
      return permissions;
    }

    // Get target user info for department validation
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId },
      select: { departmentId: true, role: true },
    });

    if (!targetUser) {
      return permissions;
    }

    // Staff users can only view/edit themselves
    if (currentUser.role === Role.STAFF) {
      if (isSelf) {
        permissions.canView = true;
        permissions.canEdit = true;
      }
      return permissions;
    }

    // Department admin permissions
    if (isDepartmentAdmin) {
      const sameOrOwnDepartment = targetUser.departmentId === currentUser.departmentId;
      const isTargetAdmin = targetUser.role === Role.SUPERADMIN || targetUser.role === Role.DEPARTMENT_ADMIN;

      if (sameOrOwnDepartment) {
        permissions.canView = true;
        
        if (isSelf || !isTargetAdmin) {
          permissions.canEdit = true;
          permissions.canChangeStatus = !isSelf;
        }
      }
    }

    return permissions;
  }

  /**
   * Validate if a department can have its last admin removed
   * Prevents orphaned departments
   */
  private async validateDepartmentAdminRemoval(
    departmentId: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const adminCount = await this.prisma.user.count({
      where: applySoftDelete({
        where: {
          departmentId,
          role: Role.DEPARTMENT_ADMIN,
          id: excludeUserId ? { not: excludeUserId } : undefined,
        },
      }).where,
    });

    return adminCount > 0;
  }

  /**
   * Check if a user can be assigned to a department based on their role
   */
  private validateDepartmentAssignment(role: Role, departmentId?: string): void {
    // STAFF and DEPARTMENT_ADMIN must have a department
    if ((role === Role.STAFF || role === Role.DEPARTMENT_ADMIN) && !departmentId) {
      throw new BadRequestException(`${role.replace('_', ' ')} users must be assigned to a department`);
    }

    // SUPERADMIN cannot have a department
    if (role === Role.SUPERADMIN && departmentId) {
      throw new BadRequestException('Superadmins cannot be assigned to a specific department');
    }
  }

  /**
   * Get a clean user object with department info
   */
  private formatUserResponse(user: any): UserWithDepartment {
    return {
      ...user,
      department: user.department || undefined,
    };
  }

  /**
   * Bulk import users from array
   */
  async bulkImport(
    bulkImportDto: BulkImportDto,
    currentUser: User,
  ): Promise<BulkImportResultDto> {
    // Only superadmins can bulk import users
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can bulk import users');
    }

    const result: BulkImportResultDto = {
      successCount: 0,
      failureCount: 0,
      successful: [],
      failed: [],
    };

    // Validate all departments first
    const departmentIds = [...new Set(bulkImportDto.users
      .filter(u => u.departmentId)
      .map(u => u.departmentId))];
    
    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
    });
    
    const validDepartmentIds = new Set(departments.map(d => d.id));

    // Process each user
    for (let i = 0; i < bulkImportDto.users.length; i++) {
      const userData = bulkImportDto.users[i];
      const row = i + 1;

      try {
        // Validate department
        if (userData.departmentId && !validDepartmentIds.has(userData.departmentId)) {
          throw new Error(`Department ${userData.departmentId} not found`);
        }

        // Validate department assignment rules
        this.validateDepartmentAssignment(userData.role, userData.departmentId);

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          throw new Error(`User with email ${userData.email} already exists`);
        }

        // If validate only, skip creation
        if (bulkImportDto.validateOnly) {
          result.successful.push({
            row,
            email: userData.email,
            status: 'Valid',
          });
          result.successCount++;
          continue;
        }

        // Create user
        const user = await this.prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            departmentId: userData.departmentId,
            position: userData.position,
            hireDate: userData.hireDate ? new Date(userData.hireDate) : undefined,
            phoneNumber: userData.phoneNumber,
            emergencyContact: userData.emergencyContact,
          },
          include: {
            department: true,
          },
        });

        // TODO: Create invitation if requested via invitation service
        // This should be handled by a separate invitation service method

        // Log user creation
        await this.auditService.logCreate(currentUser.id, 'User', user.id, user);

        result.successful.push(user);
        result.successCount++;
      } catch (error) {
        result.failed.push({
          row,
          email: userData.email,
          error: error.message || 'Unknown error',
        });
        result.failureCount++;
      }
    }

    // Log bulk import operation
    await this.auditService.log({
      userId: currentUser.id,
      action: 'BULK_IMPORT',
      entity: 'User',
      entityId: 'bulk',
      newData: {
        total: bulkImportDto.users.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      },
    });

    return result;
  }

  /**
   * Process CSV file for bulk import
   */
  async processCsvImport(
    csvData: string,
    validateOnly: boolean,
    sendInvitations: boolean,
    currentUser: User,
  ): Promise<BulkImportResultDto> {
    // Parse CSV data, filtering out empty lines and comment lines
    const lines = csvData.split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'));
    
    if (lines.length < 2) {
      throw new BadRequestException('CSV file must contain headers and at least one data row');
    }

    // Extract headers and normalize them (case-insensitive)
    const rawHeaders = lines[0].split(',').map(h => h.trim());
    const headers = rawHeaders.map(h => h.toLowerCase());
    
    // Create header map for case-insensitive lookup
    const headerMap = new Map<string, number>();
    headers.forEach((header, index) => {
      // Normalize common variations
      const normalized = header
        .toLowerCase()
        .replace(/\s+/g, '') // Remove spaces
        .replace('_', ''); // Remove underscores
      
      headerMap.set(normalized, index);
      headerMap.set(header, index); // Also keep original lowercase
    });

    // Define required headers with multiple accepted variations
    const requiredHeaderVariations = {
      email: ['email', 'emailaddress', 'e-mail'],
      firstname: ['firstname', 'first_name', 'fname', 'first'],
      lastname: ['lastname', 'last_name', 'lname', 'last'],
      role: ['role', 'userrole', 'user_role'],
    };

    // Check for required headers
    const missingHeaders: string[] = [];
    const foundHeaders = new Map<string, number>();
    
    for (const [key, variations] of Object.entries(requiredHeaderVariations)) {
      let found = false;
      for (const variation of variations) {
        const normalized = variation.replace(/\s+/g, '').replace('_', '');
        if (headerMap.has(normalized)) {
          foundHeaders.set(key, headerMap.get(normalized)!);
          found = true;
          break;
        }
      }
      if (!found) {
        missingHeaders.push(key);
      }
    }
    
    if (missingHeaders.length > 0) {
      throw new BadRequestException(`Missing required headers: ${missingHeaders.join(', ')}. Headers found: ${rawHeaders.join(', ')}`);
    }

    // Optional headers with variations
    const optionalHeaderVariations = {
      departmentid: ['departmentid', 'department_id', 'department', 'dept'],
      position: ['position', 'jobtitle', 'job_title', 'title'],
      phonenumber: ['phonenumber', 'phone_number', 'phone', 'mobile'],
      hiredate: ['hiredate', 'hire_date', 'startdate', 'start_date'],
    };

    // Find optional headers
    for (const [key, variations] of Object.entries(optionalHeaderVariations)) {
      for (const variation of variations) {
        const normalized = variation.replace(/\s+/g, '').replace('_', '');
        if (headerMap.has(normalized)) {
          foundHeaders.set(key, headerMap.get(normalized)!);
          break;
        }
      }
    }

    // Parse data rows
    const users: BulkImportUserDto[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        throw new BadRequestException(`Row ${i + 1} has incorrect number of columns`);
      }

      const user: BulkImportUserDto = {
        email: values[foundHeaders.get('email')!],
        firstName: values[foundHeaders.get('firstname')!],
        lastName: values[foundHeaders.get('lastname')!],
        role: values[foundHeaders.get('role')!].toUpperCase() as Role,
        departmentId: foundHeaders.has('departmentid') ? values[foundHeaders.get('departmentid')!] || undefined : undefined,
        position: foundHeaders.has('position') ? values[foundHeaders.get('position')!] || undefined : undefined,
        phoneNumber: foundHeaders.has('phonenumber') ? values[foundHeaders.get('phonenumber')!] || undefined : undefined,
        hireDate: foundHeaders.has('hiredate') ? values[foundHeaders.get('hiredate')!] || undefined : undefined,
        sendInvitation: sendInvitations,
      };

      // Validate role (case-insensitive)
      if (!Object.values(Role).includes(user.role)) {
        throw new BadRequestException(`Row ${i + 1}: Invalid role "${user.role}". Valid roles are: ${Object.values(Role).join(', ')}`);
      }

      users.push(user);
    }

    // Process bulk import
    return this.bulkImport(
      {
        users,
        validateOnly,
      },
      currentUser,
    );
  }

  /**
   * Export users to CSV format
   */
  async exportUsers(
    filterDto: UserFilterDto,
    currentUser: User,
  ): Promise<string> {
    // Get users based on permissions
    const result = await this.findAll(
      { ...filterDto, limit: 10000, offset: 0 }, // Export all matching users
      currentUser,
    );

    // Build CSV headers
    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Role',
      'Department',
      'Position',
      'Phone Number',
      'Hire Date',
      'Status',
      'Created At',
    ];

    // Build CSV rows
    const rows = result.data.map(user => [
      user.email,
      user.firstName,
      user.lastName,
      user.role,
      user.department?.name || '',
      user.position || '',
      user.phoneNumber || '',
      user.hireDate ? new Date(user.hireDate).toISOString().split('T')[0] : '',
      user.deletedAt ? 'Inactive' : 'Active',
      new Date(user.createdAt).toISOString().split('T')[0],
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Log export operation
    await this.auditService.log({
      userId: currentUser.id,
      action: 'EXPORT',
      entity: 'User',
      entityId: 'export',
      newData: {
        count: result.data.length,
        filters: filterDto,
      },
    });

    return csvContent;
  }
}
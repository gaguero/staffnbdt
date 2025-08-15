import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { applySoftDelete } from '../../shared/utils/soft-delete';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto';
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
  ): Promise<User> {
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
  ): Promise<PaginatedResponse<User>> {
    const { limit, offset, role, departmentId, search } = filterDto;

    // Build where clause based on user role and filters
    let whereClause: any = applySoftDelete({ where: {} }).where || {};

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

    return new PaginatedResponse(users, total, limit, offset);
  }

  async findOne(id: string, currentUser: User): Promise<User> {
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
  ): Promise<User> {
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

  async restore(id: string, currentUser: User): Promise<User> {
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

  async getUsersByDepartment(departmentId: string, currentUser: User): Promise<User[]> {
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

  async getUserStats(currentUser: User): Promise<any> {
    // Only superadmins and department admins can view stats
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff cannot access user statistics');
    }

    const whereClause = applySoftDelete({ where: {} }).where || {};
    
    // Department admins only see their department
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      whereClause.departmentId = currentUser.departmentId;
    }

    const [total, byRole, byDepartment] = await Promise.all([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: whereClause,
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['departmentId'],
        where: whereClause,
        _count: true,
      }),
    ]);

    return {
      total,
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {}),
      byDepartment: byDepartment.reduce((acc, item) => {
        if (item.departmentId) {
          acc[item.departmentId] = item._count;
        }
        return acc;
      }, {}),
    };
  }
}
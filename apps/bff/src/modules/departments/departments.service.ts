import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';
import { User, Department, Role } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
    currentUser: User,
  ): Promise<Department> {
    // Only superadmins can create departments
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can create departments');
    }

    // Check if department with same name already exists
    const existingDepartment = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });

    if (existingDepartment) {
      throw new BadRequestException('Department with this name already exists');
    }

    // Validate manager exists if provided
    if (createDepartmentDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createDepartmentDto.managerId },
      });
      if (!manager) {
        throw new BadRequestException('Manager not found');
      }
    }

    const department = await this.prisma.department.create({
      data: {
        name: createDepartmentDto.name,
        description: createDepartmentDto.description,
        location: createDepartmentDto.location,
        budget: createDepartmentDto.budget,
        managerId: createDepartmentDto.managerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
          },
        },
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
            trainingSessions: true,
            documents: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    // Log department creation
    await this.auditService.logCreate(currentUser.id, 'Department', department.id, department);

    return department;
  }

  async findAll(currentUser: User): Promise<Department[]> {
    // Department admins can only see their own department
    let whereClause = {};
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      whereClause = { id: currentUser.departmentId };
    }

    const departments = await this.prisma.department.findMany({
      where: whereClause,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
          },
        },
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
            trainingSessions: true,
            documents: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return departments;
  }

  async findOne(id: string, currentUser: User): Promise<Department> {
    // Department admins can only see their own department
    if (currentUser.role === Role.DEPARTMENT_ADMIN && currentUser.departmentId !== id) {
      throw new ForbiddenException('Cannot access other departments');
    }

    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
            hireDate: true,
            phoneNumber: true,
          },
        },
        trainingSessions: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            isActive: true,
          },
        },
        documents: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            description: true,
            fileSize: true,
            mimeType: true,
            uploadedBy: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
            trainingSessions: true,
            documents: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Log department view for sensitive operations
    await this.auditService.logView(currentUser.id, 'Department', id);

    return department;
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
    currentUser: User,
  ): Promise<Department> {
    // Only superadmins can update departments
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can update departments');
    }

    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException('Department not found');
    }

    // Check if another department with the same name exists
    if (updateDepartmentDto.name && updateDepartmentDto.name !== existingDepartment.name) {
      const duplicateDepartment = await this.prisma.department.findUnique({
        where: { name: updateDepartmentDto.name },
      });

      if (duplicateDepartment) {
        throw new BadRequestException('Department with this name already exists');
      }
    }

    // Validate manager exists if provided
    if (updateDepartmentDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateDepartmentDto.managerId },
      });
      if (!manager) {
        throw new BadRequestException('Manager not found');
      }
    }

    const updatedDepartment = await this.prisma.department.update({
      where: { id },
      data: {
        name: updateDepartmentDto.name,
        description: updateDepartmentDto.description,
        location: updateDepartmentDto.location,
        budget: updateDepartmentDto.budget,
        managerId: updateDepartmentDto.managerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            position: true,
          },
        },
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
            trainingSessions: true,
            documents: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    // Log department update
    await this.auditService.logUpdate(
      currentUser.id,
      'Department',
      id,
      existingDepartment,
      updatedDepartment,
    );

    return updatedDepartment;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    // Only superadmins can delete departments
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can delete departments');
    }

    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          where: { deletedAt: null },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check if department has active users
    if (department.users.length > 0) {
      throw new BadRequestException(
        'Cannot delete department with active users. Please reassign or remove users first.',
      );
    }

    await this.prisma.department.delete({
      where: { id },
    });

    // Log department deletion
    await this.auditService.logDelete(currentUser.id, 'Department', id, department);
  }

  async getDepartmentStats(id: string, currentUser: User): Promise<any> {
    // Department admins can only see their own department stats
    if (currentUser.role === Role.DEPARTMENT_ADMIN && currentUser.departmentId !== id) {
      throw new ForbiddenException('Cannot access other department statistics');
    }

    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const [
      totalUsers,
      usersByRole,
      recentHires,
      documentsCount,
      vacationRequests,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { departmentId: id, deletedAt: null },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { departmentId: id, deletedAt: null },
        _count: true,
      }),
      this.prisma.user.count({
        where: {
          departmentId: id,
          deletedAt: null,
          hireDate: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      }),
      this.prisma.document.count({
        where: { departmentId: id, deletedAt: null },
      }),
      this.prisma.vacation.count({
        where: {
          user: { departmentId: id, deletedAt: null },
          status: 'PENDING',
        },
      }),
    ]);

    return {
      totalUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {}),
      recentHires,
      documentsCount,
      pendingVacationRequests: vacationRequests,
    };
  }

  async getOverallStats(currentUser: User): Promise<any> {
    // Only superadmins can see overall stats
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can view overall statistics');
    }

    const [
      totalDepartments,
      departmentsWithManagers,
      totalUsers,
      usersByDepartment,
      totalTrainingSessions,
      totalDocuments,
      totalBudget,
      recentActivity,
    ] = await Promise.all([
      this.prisma.department.count(),
      this.prisma.department.count({
        where: { managerId: { not: null } },
      }),
      this.prisma.user.count({
        where: { deletedAt: null },
      }),
      this.prisma.department.findMany({
        select: {
          id: true,
          name: true,
          budget: true,
          _count: {
            select: {
              users: {
                where: { deletedAt: null },
              },
              trainingSessions: true,
              documents: {
                where: { deletedAt: null },
              },
            },
          },
        },
      }),
      this.prisma.trainingSession.count(),
      this.prisma.document.count({
        where: { deletedAt: null },
      }),
      this.prisma.department.aggregate({
        _sum: {
          budget: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          entity: 'Department',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const departmentBreakdown = usersByDepartment.map(dept => ({
      id: dept.id,
      name: dept.name,
      budget: dept.budget,
      userCount: dept._count.users,
      trainingCount: dept._count.trainingSessions,
      documentCount: dept._count.documents,
    }));

    return {
      totalDepartments,
      departmentsWithManagers,
      departmentsWithoutManagers: totalDepartments - departmentsWithManagers,
      totalUsers,
      totalTrainingSessions,
      totalDocuments,
      totalBudget: totalBudget._sum.budget || 0,
      departmentBreakdown,
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        departmentId: activity.entityId,
        user: `${activity.user.firstName} ${activity.user.lastName}`,
        timestamp: activity.createdAt,
      })),
    };
  }

  async searchDepartments(query: string, currentUser: User): Promise<Department[]> {
    // Department admins can only search their own department
    let whereClause: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      whereClause.id = currentUser.departmentId;
    }

    return this.prisma.department.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 10, // Limit search results
    });
  }
}
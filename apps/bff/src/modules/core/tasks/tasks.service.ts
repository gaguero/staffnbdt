import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    const taskData: any = {
      ...createTaskDto,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
    };

    return this.prisma.task.create({
      data: taskData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(filters?: TaskFilterDto) {
    const where: any = {};

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters?.taskType) {
      where.taskType = filters.taskType;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.relatedEntity) {
      where.relatedEntity = filters.relatedEntity;
    }

    if (filters?.relatedId) {
      where.relatedId = filters.relatedId;
    }

    if (filters?.dueDateFrom) {
      where.dueDate = {
        gte: new Date(filters.dueDateFrom),
      };
    }

    if (filters?.dueDateTo) {
      where.dueDate = {
        ...where.dueDate,
        lte: new Date(filters.dueDateTo),
      };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.task.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // URGENT, HIGH, MEDIUM, LOW
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        completedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id); // Check if task exists

    const updateData: any = { ...updateTaskDto };

    // Convert date string to Date object if provided
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string, completedBy?: string) {
    await this.findOne(id); // Check if task exists

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (completedBy) {
        updateData.completedBy = completedBy;
      }
    } else if (status === 'IN_PROGRESS') {
      // Clear completion data if moving back to in progress
      updateData.completedAt = null;
      updateData.completedBy = null;
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async assignTask(id: string, assignedToId: string, assignedBy: string) {
    await this.findOne(id); // Check if task exists

    // Verify the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${assignedToId} not found`);
    }

    return this.prisma.task.update({
      where: { id },
      data: { 
        assignedToId,
        status: 'PENDING', // Reset to pending when reassigned
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const task = await this.findOne(id);

    if (['IN_PROGRESS', 'COMPLETED'].includes(task.status)) {
      throw new BadRequestException(
        'Cannot delete tasks that are in progress or completed',
      );
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async getTasksByUser(userId: string, propertyId?: string) {
    const where: any = {
      assignedToId: userId,
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  async getTasksByDepartment(departmentId: string) {
    return this.prisma.task.findMany({
      where: {
        departmentId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  async getOverdueTasks(propertyId?: string) {
    const where: any = {
      dueDate: {
        lt: new Date(),
      },
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getTaskStatistics(propertyId: string) {
    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      this.prisma.task.count({
        where: { propertyId },
      }),
      this.prisma.task.count({
        where: { propertyId, status: 'PENDING' },
      }),
      this.prisma.task.count({
        where: { propertyId, status: 'IN_PROGRESS' },
      }),
      this.prisma.task.count({
        where: { propertyId, status: 'COMPLETED' },
      }),
      this.prisma.task.count({
        where: {
          propertyId,
          dueDate: { lt: new Date() },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  async createTaskForEntity(
    entityType: string,
    entityId: string,
    taskData: Omit<CreateTaskDto, 'relatedEntity' | 'relatedId'>,
  ) {
    return this.create({
      ...taskData,
      relatedEntity: entityType,
      relatedId: entityId,
    });
  }
}
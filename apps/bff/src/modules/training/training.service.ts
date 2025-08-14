import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { User, TrainingSession, Enrollment, Role } from '@prisma/client';

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(limit = 10, offset = 0): Promise<PaginatedResponse<TrainingSession>> {
    const [sessions, total] = await Promise.all([
      this.prisma.trainingSession.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.trainingSession.count({ where: { isActive: true } }),
    ]);

    return new PaginatedResponse(sessions, total, limit, offset);
  }

  async findOne(id: string): Promise<TrainingSession> {
    const session = await this.prisma.trainingSession.findFirst({
      where: { id, isActive: true },
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    return session;
  }

  async enroll(sessionId: string, currentUser: User): Promise<Enrollment> {
    const session = await this.findOne(sessionId);
    
    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_sessionId: {
          userId: currentUser.id,
          sessionId,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('Already enrolled in this training session');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId: currentUser.id,
        sessionId,
        progress: {},
      },
    });

    await this.auditService.logCreate(currentUser.id, 'Enrollment', enrollment.id, enrollment);
    return enrollment;
  }

  async getUserEnrollments(userId: string, currentUser: User): Promise<Enrollment[]> {
    // Users can only see their own enrollments
    if (currentUser.role === Role.STAFF && currentUser.id !== userId) {
      throw new ForbiddenException('Can only access your own enrollments');
    }

    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            passingScore: true,
            duration: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProgress(
    enrollmentId: string,
    progress: any,
    currentUser: User,
  ): Promise<Enrollment> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.userId !== currentUser.id) {
      throw new ForbiddenException('Can only update your own progress');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress },
    });
  }
}
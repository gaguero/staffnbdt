import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditLogData {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldData: data.oldData,
          newData: data.newData,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Log audit failures but don't throw to avoid breaking the main operation
      console.error('Failed to create audit log:', error);
    }
  }

  async logCreate(
    userId: string,
    entity: string,
    entityId: string,
    newData: any,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CREATE',
      entity,
      entityId,
      newData,
      ...metadata,
    });
  }

  async logUpdate(
    userId: string,
    entity: string,
    entityId: string,
    oldData: any,
    newData: any,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE',
      entity,
      entityId,
      oldData,
      newData,
      ...metadata,
    });
  }

  async logDelete(
    userId: string,
    entity: string,
    entityId: string,
    oldData: any,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DELETE',
      entity,
      entityId,
      oldData,
      ...metadata,
    });
  }

  async logView(
    userId: string,
    entity: string,
    entityId: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    await this.log({
      userId,
      action: 'VIEW',
      entity,
      entityId,
      ...metadata,
    });
  }
}
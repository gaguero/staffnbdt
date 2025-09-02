import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../services/logger.service';

export interface SLAEnforcementJobData {
  organizationId: string;
  propertyId: string;
}

export class ConciergeSLAProcessor {
  private readonly logger = new Logger('ConciergeSLAProcessor');

  constructor(private readonly prisma: PrismaClient) {}

  async process(job: Job<SLAEnforcementJobData>): Promise<{ overdueCount: number }> {
    const { organizationId, propertyId } = job.data;
    const now = new Date();

    this.logger.info('Checking concierge SLA overdue', { organizationId, propertyId });

    // Find open objects past due
    const overdue = await this.prisma.conciergeObject.findMany({
      where: {
        organizationId,
        propertyId,
        status: 'open',
        dueAt: { lte: now },
      },
      select: { id: true },
    });

    // Log for now; event emission will be handled by API or a future event bridge
    this.logger.info('SLA overdue found', { count: overdue.length, organizationId, propertyId });
    return { overdueCount: overdue.length };
  }
}



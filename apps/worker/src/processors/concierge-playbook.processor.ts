import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../services/logger.service';

export interface PlaybookExecutionJobData {
  playbookId: string;
  organizationId: string;
  propertyId: string;
  trigger: string;
  triggerData?: Record<string, unknown>;
}

export class ConciergePlaybookProcessor {
  private readonly logger = new Logger('ConciergePlaybookProcessor');

  constructor(private readonly prisma: PrismaClient) {}

  async process(job: Job<PlaybookExecutionJobData>): Promise<{ createdObjects: number }> {
    const { playbookId, organizationId, propertyId } = job.data;
    this.logger.info('Executing playbook', { playbookId, organizationId, propertyId });

    const playbook = await this.prisma.playbook.findFirst({
      where: { id: playbookId, organizationId, propertyId, isActive: true },
    });
    if (!playbook) {
      this.logger.warn('Playbook not found or inactive', { playbookId });
      return { createdObjects: 0 };
    }

    // Minimal stub: assume actions contains required object types
    let createdObjects = 0;
    try {
      const actions: any[] = Array.isArray(playbook.actions) ? (playbook.actions as any) : [];
      for (const action of actions) {
        if (action.type === 'create_object' && action.payload?.type) {
          await this.prisma.conciergeObject.create({
            data: {
              organizationId,
              propertyId,
              type: action.payload.type,
              status: 'open',
              dueAt: action.payload.dueAt ? new Date(action.payload.dueAt) : null,
            },
          });
          createdObjects++;
        }
      }
    } catch (error) {
      this.logger.error('Playbook execution error', error, { playbookId });
    }

    return { createdObjects };
  }
}



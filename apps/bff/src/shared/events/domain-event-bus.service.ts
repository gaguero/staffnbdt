import { Injectable, Logger } from '@nestjs/common';

export interface DomainEvent<T = any> {
  type: string;
  payload: T;
  tenant: {
    organizationId: string;
    propertyId?: string | null;
  };
  correlationId?: string;
  timestamp: string;
}

@Injectable()
export class DomainEventBus {
  private readonly logger = new Logger(DomainEventBus.name);

  async emit<T = any>(event: DomainEvent<T>): Promise<void> {
    // Stub: integrate with real event store/bus as needed
    this.logger.log(`Event emitted: ${event.type}`, event as any);
  }
}



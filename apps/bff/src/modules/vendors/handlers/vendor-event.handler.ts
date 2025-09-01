import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../../shared/events/domain-event-bus.service';
import { VendorNotificationProcessor, VendorConfirmationData } from '../processors/vendor-notification.processor';

@Injectable()
export class VendorEventHandler {
  private readonly logger = new Logger(VendorEventHandler.name);

  constructor(
    private readonly notificationProcessor: VendorNotificationProcessor,
  ) {}

  async handleEvent(event: DomainEvent<any>): Promise<void> {
    try {
      switch (event.type) {
        case 'vendor.portal.notification.requested':
          await this.handlePortalNotification(event);
          break;
        case 'vendor.portal.expiry.check.scheduled':
          await this.handleExpiryCheck(event);
          break;
        default:
          this.logger.debug(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event ${event.type}:`, error);
      // Don't rethrow to prevent event processing failures
    }
  }

  private async handlePortalNotification(event: DomainEvent): Promise<void> {
    const data: VendorConfirmationData = {
      vendorId: event.payload.vendorId,
      linkId: event.payload.linkId,
      channel: event.payload.channel,
      portalUrl: event.payload.portalUrl,
      vendorName: event.payload.vendorName,
      vendorEmail: event.payload.vendorEmail,
      expiresAt: event.payload.expiresAt,
      objectId: event.payload.objectId,
      objectType: event.payload.objectType,
      tenant: event.tenant ? {
        organizationId: event.tenant.organizationId,
        propertyId: event.tenant.propertyId || ''
      } : undefined,
    };

    await this.notificationProcessor.sendConfirmation(data);
  }

  private async handleExpiryCheck(event: DomainEvent): Promise<void> {
    await this.notificationProcessor.handlePortalExpiry();
  }
}
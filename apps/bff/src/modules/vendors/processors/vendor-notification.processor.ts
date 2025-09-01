import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { DomainEventBus } from '../../../shared/events/domain-event-bus.service';
import { VendorsService } from '../vendors.service';

@Injectable()
export class VendorNotificationProcessor {
  private readonly logger = new Logger(VendorNotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
    private readonly vendorsService: VendorsService,
  ) {}

  /**
   * Send vendor confirmation notification
   */
  async sendConfirmation(data: VendorConfirmationData): Promise<void> {
    try {
      const { vendorId, linkId, channel, portalUrl, vendorName, vendorEmail, expiresAt } = data;

      this.logger.log(`Sending ${channel} confirmation to vendor: ${vendorName}`);

      switch (channel) {
        case 'email':
          await this.sendEmailConfirmation(data);
          break;
        case 'sms':
          await this.sendSMSConfirmation(data);
          break;
        case 'whatsapp':
          await this.sendWhatsAppConfirmation(data);
          break;
        default:
          this.logger.warn(`Unknown notification channel: ${channel}`);
          return;
      }

      // Log the notification attempt
      await this.prisma.auditLog.create({
        data: {
          userId: 'system-notification',
          action: 'VENDOR_NOTIFICATION_SENT',
          entity: 'VendorLink',
          entityId: linkId,
          newData: {
            channel,
            vendorId,
            vendorName,
            portalUrl,
            expiresAt,
          },
          propertyId: data.tenant?.propertyId || null,
        },
      });

      this.logger.log(`${channel} notification sent successfully to ${vendorName}`);

    } catch (error) {
      this.logger.error(`Error sending ${data.channel} notification:`, error);
      throw error;
    }
  }

  /**
   * Handle portal link expiry notifications and cleanup
   */
  async handlePortalExpiry(): Promise<void> {
    try {
      const expiringLinks = await this.vendorsService.findExpiringLinks();

      this.logger.log(`Found ${expiringLinks.length} expiring vendor links`);

      for (const link of expiringLinks) {
        // Send reminder notification
        await this.eventBus.emit({
          type: 'vendor.portal.expiry.reminder',
          payload: {
            linkId: link.id,
            vendorId: link.vendorId,
            vendorName: link.vendor.name,
            vendorEmail: link.vendor.email,
            expiresAt: link.expiresAt?.toISOString(),
            objectId: link.objectId,
            objectType: link.objectType,
          },
          tenant: {
            organizationId: link.vendor.organizationId,
            propertyId: link.vendor.propertyId,
          },
          correlationId: `expiry-reminder-${link.id}`,
          timestamp: new Date().toISOString(),
        });

        // Auto-decline if past expiry and still pending
        if (link.expiresAt && link.expiresAt < new Date() && link.status === 'pending') {
          await this.prisma.vendorLink.update({
            where: { id: link.id },
            data: {
              status: 'expired',
            },
          });

          await this.eventBus.emit({
            type: 'vendor.link.expired',
            payload: {
              linkId: link.id,
              vendorId: link.vendorId,
              vendorName: link.vendor.name,
              objectId: link.objectId,
              objectType: link.objectType,
              expiredAt: new Date().toISOString(),
            },
            tenant: {
              organizationId: link.vendor.organizationId,
              propertyId: link.vendor.propertyId,
            },
            correlationId: `auto-expire-${link.id}`,
            timestamp: new Date().toISOString(),
          });

          this.logger.log(`Auto-expired vendor link: ${link.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error handling portal expiry:', error);
      throw error;
    }
  }

  private async sendEmailConfirmation(data: VendorConfirmationData): Promise<void> {
    // Email sending logic would go here
    // This is a placeholder for actual email service integration
    
    const emailData = {
      to: data.vendorEmail,
      subject: `Vendor Confirmation Required - ${data.vendorName}`,
      template: 'vendor-confirmation',
      variables: {
        vendorName: data.vendorName,
        portalUrl: data.portalUrl,
        expiresAt: data.expiresAt,
        objectType: data.objectType || 'request',
        objectId: data.objectId || 'N/A',
      },
    };

    // Emit email event for actual email service to handle
    await this.eventBus.emit({
      type: 'email.send.requested',
      payload: emailData,
      tenant: data.tenant,
      correlationId: `vendor-email-${data.linkId}`,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Email confirmation queued for: ${data.vendorEmail}`);
  }

  private async sendSMSConfirmation(data: VendorConfirmationData): Promise<void> {
    // SMS sending logic would go here
    // This is a placeholder for actual SMS service integration

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: data.vendorId },
      select: { phone: true },
    });

    if (!vendor?.phone) {
      this.logger.warn(`No phone number found for vendor: ${data.vendorName}`);
      return;
    }

    const smsData = {
      to: vendor.phone,
      message: `Hi ${data.vendorName}, you have a new confirmation request. Please visit: ${data.portalUrl} (expires: ${new Date(data.expiresAt).toLocaleDateString()})`,
    };

    // Emit SMS event for actual SMS service to handle
    await this.eventBus.emit({
      type: 'sms.send.requested',
      payload: smsData,
      tenant: data.tenant,
      correlationId: `vendor-sms-${data.linkId}`,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`SMS confirmation queued for: ${vendor.phone}`);
  }

  private async sendWhatsAppConfirmation(data: VendorConfirmationData): Promise<void> {
    // WhatsApp sending logic would go here
    // This is a placeholder for actual WhatsApp service integration

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: data.vendorId },
      select: { phone: true },
    });

    if (!vendor?.phone) {
      this.logger.warn(`No phone number found for vendor: ${data.vendorName}`);
      return;
    }

    const whatsappData = {
      to: vendor.phone,
      template: 'vendor_confirmation',
      variables: {
        vendorName: data.vendorName,
        portalUrl: data.portalUrl,
        expirationDate: new Date(data.expiresAt).toLocaleDateString(),
      },
    };

    // Emit WhatsApp event for actual WhatsApp service to handle
    await this.eventBus.emit({
      type: 'whatsapp.send.requested',
      payload: whatsappData,
      tenant: data.tenant,
      correlationId: `vendor-whatsapp-${data.linkId}`,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`WhatsApp confirmation queued for: ${vendor.phone}`);
  }

  /**
   * Process batch notifications for multiple vendors
   */
  async processBatchNotifications(notifications: VendorConfirmationData[]): Promise<void> {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendConfirmation(notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.log(`Batch notification results: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
      
      this.logger.error('Batch notification errors:', errors);
    }
  }
}

export interface VendorConfirmationData {
  vendorId: string;
  linkId: string;
  channel: 'email' | 'sms' | 'whatsapp';
  portalUrl: string;
  vendorName: string;
  vendorEmail: string;
  expiresAt: string;
  objectId?: string;
  objectType?: string;
  tenant?: {
    organizationId: string;
    propertyId: string;
  };
}
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { InvitationEmailData } from '../interfaces';
import { createInvitationEmailTemplate } from '../templates/invitation.template';

@Injectable()
export class InvitationEmailService {
  private readonly logger = new Logger(InvitationEmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Configure nodemailer based on environment
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT', '587')),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendInvitation(data: InvitationEmailData): Promise<void> {
    try {
      const template = createInvitationEmailTemplate(data);
      
      const mailOptions = {
        from: this.configService.get('FROM_EMAIL') || 'hr@hoteloperationshub.com',
        to: data.email,
        subject: template.subject,
        html: template.html,
        // Add text version for better deliverability
        text: this.createTextVersion(data),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Invitation email sent to ${data.email} for role ${data.role}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${data.email}:`, error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  }

  async sendInvitationReminder(data: InvitationEmailData): Promise<void> {
    try {
      const template = this.createReminderTemplate(data);
      
      const mailOptions = {
        from: this.configService.get('FROM_EMAIL') || 'hr@hoteloperationshub.com',
        to: data.email,
        subject: template.subject,
        html: template.html,
        text: this.createReminderTextVersion(data),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Invitation reminder sent to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation reminder to ${data.email}:`, error);
      throw new Error(`Failed to send invitation reminder: ${error.message}`);
    }
  }

  private createTextVersion(data: InvitationEmailData): string {
    const roleDisplayNames = {
      SUPERADMIN: 'Super Administrator',
      DEPARTMENT_ADMIN: 'Department Administrator',
      STAFF: 'Staff Member',
    };

    return `
Welcome to Hotel Operations Hub!

${data.inviterName} has invited you to join Hotel Operations Hub.

Role: ${roleDisplayNames[data.role] || data.role}
${data.departmentName ? `Department: ${data.departmentName}` : ''}
Invited by: ${data.inviterName}
Email: ${data.email}

${data.message ? `Personal Message: ${data.message}` : ''}

To accept this invitation and set up your account, visit:
${data.invitationUrl}

This invitation will expire in ${data.expiryDays} days.

If you have any questions, please contact HR.

This is an automated message from Hotel Operations Hub.
    `.trim();
  }

  private createReminderTemplate(data: InvitationEmailData) {
    const subject = `Reminder: Your Hotel Operations Hub Invitation is Waiting`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #AA8E67, #7C8E67); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Hotel Operations Hub</h1>
          <p style="margin: 10px 0 0 0;">Staff Invitation Reminder</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #4A4A4A; margin-top: 0;">Don't forget to accept your invitation!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            You were invited to join Hotel Operations Hub by ${data.inviterName}, 
            but we noticed you haven't accepted your invitation yet.
          </p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            ⏰ This invitation expires soon!
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invitationUrl}" 
               style="background: linear-gradient(135deg, #AA8E67, #7C8E67); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Accept Invitation Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            If you have any questions, please contact HR or your department administrator.
          </p>
        </div>
        
        <div style="background-color: #F5EBD7; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; font-size: 12px; color: #999;">
            This is an automated reminder from Hotel Operations Hub.
          </p>
        </div>
      </div>
    `;

    return { subject, html };
  }

  private createReminderTextVersion(data: InvitationEmailData): string {
    return `
Reminder: Your Hotel Operations Hub Invitation is Waiting

Don't forget to accept your invitation to join Hotel Operations Hub!

You were invited by ${data.inviterName}, but we noticed you haven't accepted your invitation yet.

To accept this invitation and set up your account, visit:
${data.invitationUrl}

This invitation expires soon!

If you have any questions, please contact HR.
    `.trim();
  }
}
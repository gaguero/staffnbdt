import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Configure nodemailer based on environment
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendMagicLink(email: string, firstName: string, magicLink: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('FROM_EMAIL') || 'noreply@nayara.com',
        to: email,
        subject: 'Your Nayara HR Portal Magic Link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4A4A4A;">Welcome back, ${firstName}!</h1>
            <p>Click the link below to securely access your Nayara HR Portal:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" 
                 style="background-color: #AA8E67; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access HR Portal
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 15 minutes for security reasons.
            </p>
            <p style="color: #666; font-size: 12px;">
              If you didn't request this link, please ignore this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Magic link sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send magic link to ${email}:`, error);
      // In production, you might want to throw an error or retry
    }
  }

  async sendPasswordReset(email: string, firstName: string, resetLink: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('FROM_EMAIL') || 'noreply@nayara.com',
        to: email,
        subject: 'Reset Your Nayara HR Portal Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4A4A4A;">Password Reset Request</h1>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password for the Nayara HR Portal.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #AA8E67; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour for security reasons.
            </p>
            <p style="color: #666; font-size: 12px;">
              If you didn't request this reset, please ignore this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('FROM_EMAIL') || 'noreply@nayara.com',
        to: email,
        subject: 'Welcome to Nayara HR Portal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4A4A4A;">Welcome to Nayara, ${firstName}!</h1>
            <p>Your account has been created successfully. You can now access the HR Portal to:</p>
            <ul>
              <li>View and download important documents</li>
              <li>Access your payslips</li>
              <li>Request vacation time</li>
              <li>Complete training modules</li>
              <li>Explore commercial benefits</li>
            </ul>
            <p>If you have any questions, please contact HR.</p>
            <p style="color: #666; font-size: 12px;">
              This is an automated message from the Nayara HR Portal.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
    }
  }
}
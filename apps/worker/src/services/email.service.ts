import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import { Logger } from './logger.service';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface TemplateData {
  [key: string]: any;
}

export class EmailService {
  private readonly logger = new Logger('EmailService');
  private readonly transporter: nodemailer.Transporter;
  private readonly templatesPath: string;
  private readonly compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.templatesPath = join(__dirname, '../templates');

    // Configure email transporter
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter configuration error:', error);
      } else {
        this.logger.info('Email transporter ready');
      }
    });

    // Precompile commonly used templates
    this.precompileTemplates();
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@nayara.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

    } catch (error) {
      this.logger.error('Failed to send email:', error, {
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  async sendTemplatedEmail(
    templateName: string,
    to: string | string[],
    data: TemplateData,
    attachments?: EmailOptions['attachments']
  ): Promise<void> {
    try {
      const template = await this.renderTemplate(templateName, data);
      
      await this.sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments,
      });

    } catch (error) {
      this.logger.error(`Failed to send templated email ${templateName}:`, error, {
        templateName,
        to,
      });
      throw error;
    }
  }

  private async renderTemplate(templateName: string, data: TemplateData): Promise<EmailTemplate> {
    try {
      let template = this.compiledTemplates.get(templateName);
      
      if (!template) {
        const templatePath = join(this.templatesPath, `${templateName}.hbs`);
        
        if (!existsSync(templatePath)) {
          throw new Error(`Template ${templateName} not found at ${templatePath}`);
        }

        const templateContent = readFileSync(templatePath, 'utf-8');
        template = Handlebars.compile(templateContent);
        this.compiledTemplates.set(templateName, template);
      }

      const rendered = template(data);
      
      // Parse the rendered content to extract subject and body
      const subjectMatch = rendered.match(/{{!-- subject: (.*?) --}}/);
      const subject = subjectMatch ? subjectMatch[1] : `Nayara HR Portal - ${templateName}`;
      
      // Remove subject comment from HTML
      const html = rendered.replace(/{{!-- subject: .*? --}}/g, '').trim();
      
      // Generate text version (basic HTML to text conversion)
      const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

      return { subject, html, text };

    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      throw error;
    }
  }

  private precompileTemplates(): void {
    const commonTemplates = [
      'payslip-generated',
      'vacation-approved',
      'vacation-rejected',
      'training-completed',
      'document-uploaded',
      'password-reset',
      'account-created',
    ];

    commonTemplates.forEach(templateName => {
      const templatePath = join(this.templatesPath, `${templateName}.hbs`);
      
      if (existsSync(templatePath)) {
        try {
          const templateContent = readFileSync(templatePath, 'utf-8');
          const compiled = Handlebars.compile(templateContent);
          this.compiledTemplates.set(templateName, compiled);
          this.logger.debug(`Precompiled template: ${templateName}`);
        } catch (error) {
          this.logger.warn(`Failed to precompile template ${templateName}:`, error);
        }
      }
    });
  }

  // Helper methods for common email types
  async sendWelcomeEmail(to: string, userData: { firstName: string; lastName: string; email: string }): Promise<void> {
    await this.sendTemplatedEmail('account-created', to, userData);
  }

  async sendPasswordResetEmail(to: string, resetData: { firstName: string; resetLink: string }): Promise<void> {
    await this.sendTemplatedEmail('password-reset', to, resetData);
  }

  async sendPayslipNotification(
    to: string, 
    payslipData: { firstName: string; period: string; downloadLink: string }
  ): Promise<void> {
    await this.sendTemplatedEmail('payslip-generated', to, payslipData);
  }

  async sendVacationApprovalNotification(
    to: string,
    vacationData: { 
      firstName: string; 
      type: string; 
      startDate: string; 
      endDate: string; 
      approvedBy: string;
    }
  ): Promise<void> {
    await this.sendTemplatedEmail('vacation-approved', to, vacationData);
  }

  async sendVacationRejectionNotification(
    to: string,
    vacationData: {
      firstName: string;
      type: string;
      startDate: string;
      endDate: string;
      rejectedReason: string;
    }
  ): Promise<void> {
    await this.sendTemplatedEmail('vacation-rejected', to, vacationData);
  }

  async sendTrainingCompletionNotification(
    to: string,
    trainingData: {
      firstName: string;
      trainingTitle: string;
      score: number;
      certificateUrl?: string;
    }
  ): Promise<void> {
    await this.sendTemplatedEmail('training-completed', to, trainingData);
  }
}
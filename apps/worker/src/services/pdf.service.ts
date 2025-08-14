import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import { Logger } from './logger.service';

export interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export interface PayslipData {
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: string;
    employeeId: string;
  };
  payslip: {
    period: string;
    grossSalary: number;
    netSalary: number;
    currency: string;
    deductions: Record<string, number>;
  };
  company: {
    name: string;
    address: string;
    logo?: string;
  };
  generatedAt: Date;
}

export interface CertificateData {
  participant: {
    firstName: string;
    lastName: string;
  };
  training: {
    title: string;
    completedAt: Date;
    score: number;
    duration: number;
  };
  company: {
    name: string;
    logo?: string;
  };
}

export class PDFService {
  private readonly logger = new Logger('PDFService');
  private browser: Browser | null = null;
  private readonly templatesPath: string;
  private readonly compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.templatesPath = join(__dirname, '../templates/pdf');
    this.initializeHandlebarsHelpers();
    this.precompileTemplates();
  }

  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-translate',
        ],
      });

      this.logger.info('Puppeteer browser initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer browser:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.info('Puppeteer browser closed');
    }
  }

  async generatePDFFromHTML(
    html: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    let page: Page | null = null;

    try {
      page = await this.browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 1200, height: 800 });

      // Set content
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Default PDF options
      const pdfOptions: PDFOptions = {
        format: options.format || 'A4',
        printBackground: true,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
          ...options.margin,
        },
      };

      const pdf = await page.pdf(pdfOptions);
      
      this.logger.debug('PDF generated successfully');

      return Buffer.from(pdf);

    } catch (error) {
      this.logger.error('Failed to generate PDF:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async generatePayslip(data: PayslipData, options?: PDFGenerationOptions): Promise<Buffer> {
    try {
      const html = await this.renderTemplate('payslip', data);
      
      const defaultOptions: PDFGenerationOptions = {
        format: 'A4',
        orientation: 'portrait',
        displayHeaderFooter: true,
        footerTemplate: `
          <div style="font-size: 10px; padding: 10px; width: 100%; text-align: center;">
            Generated on {{date}} | Confidential Document
          </div>
        `,
      };

      return this.generatePDFFromHTML(html, { ...defaultOptions, ...options });

    } catch (error) {
      this.logger.error('Failed to generate payslip PDF:', error, {
        employeeId: data.employee.employeeId,
        period: data.payslip.period,
      });
      throw error;
    }
  }

  async generateTrainingCertificate(data: CertificateData, options?: PDFGenerationOptions): Promise<Buffer> {
    try {
      const html = await this.renderTemplate('certificate', data);
      
      const defaultOptions: PDFGenerationOptions = {
        format: 'A4',
        orientation: 'landscape',
        margin: {
          top: '10px',
          right: '10px',
          bottom: '10px',
          left: '10px',
        },
      };

      return this.generatePDFFromHTML(html, { ...defaultOptions, ...options });

    } catch (error) {
      this.logger.error('Failed to generate certificate PDF:', error, {
        participant: `${data.participant.firstName} ${data.participant.lastName}`,
        training: data.training.title,
      });
      throw error;
    }
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    try {
      let template = this.compiledTemplates.get(templateName);
      
      if (!template) {
        const templatePath = join(this.templatesPath, `${templateName}.hbs`);
        
        if (!existsSync(templatePath)) {
          throw new Error(`PDF template ${templateName} not found at ${templatePath}`);
        }

        const templateContent = readFileSync(templatePath, 'utf-8');
        template = Handlebars.compile(templateContent);
        this.compiledTemplates.set(templateName, template);
      }

      return template(data);

    } catch (error) {
      this.logger.error(`Failed to render PDF template ${templateName}:`, error);
      throw error;
    }
  }

  private precompileTemplates(): void {
    const templates = ['payslip', 'certificate'];

    templates.forEach(templateName => {
      const templatePath = join(this.templatesPath, `${templateName}.hbs`);
      
      if (existsSync(templatePath)) {
        try {
          const templateContent = readFileSync(templatePath, 'utf-8');
          const compiled = Handlebars.compile(templateContent);
          this.compiledTemplates.set(templateName, compiled);
          this.logger.debug(`Precompiled PDF template: ${templateName}`);
        } catch (error) {
          this.logger.warn(`Failed to precompile PDF template ${templateName}:`, error);
        }
      }
    });
  }

  private initializeHandlebarsHelpers(): void {
    // Currency formatting helper
    Handlebars.registerHelper('currency', function(amount: number, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    // Date formatting helper
    Handlebars.registerHelper('formatDate', function(date: Date, format = 'short') {
      const options: Intl.DateTimeFormatOptions = {};
      
      switch (format) {
        case 'long':
          options.year = 'numeric';
          options.month = 'long';
          options.day = 'numeric';
          break;
        case 'short':
        default:
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
          break;
      }

      return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
    });

    // Mathematical operations helper
    Handlebars.registerHelper('add', function(a: number, b: number) {
      return a + b;
    });

    Handlebars.registerHelper('subtract', function(a: number, b: number) {
      return a - b;
    });

    Handlebars.registerHelper('multiply', function(a: number, b: number) {
      return a * b;
    });

    Handlebars.registerHelper('divide', function(a: number, b: number) {
      return b !== 0 ? a / b : 0;
    });

    // Percentage helper
    Handlebars.registerHelper('percentage', function(value: number, total: number) {
      return total !== 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
    });

    // Conditional helpers
    Handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });

    Handlebars.registerHelper('gt', function(a: number, b: number) {
      return a > b;
    });

    Handlebars.registerHelper('lt', function(a: number, b: number) {
      return a < b;
    });

    this.logger.debug('Handlebars helpers initialized');
  }
}
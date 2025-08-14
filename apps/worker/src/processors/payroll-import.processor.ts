import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { z } from 'zod';
import { Logger } from '../services/logger.service';
import { StorageService } from '../services/storage.service';
import { EmailService } from '../services/email.service';

// Validation schema for CSV payroll data
const PayrollRowSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  email: z.string().email('Invalid email format'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  grossSalary: z.string().transform(val => parseFloat(val)).pipe(
    z.number().min(0, 'Gross salary must be non-negative')
  ),
  netSalary: z.string().transform(val => parseFloat(val)).pipe(
    z.number().min(0, 'Net salary must be non-negative')
  ),
  currency: z.string().default('USD'),
  // Deductions as individual columns
  socialSecurity: z.string().optional().transform(val => val ? parseFloat(val) : 0),
  incomeTax: z.string().optional().transform(val => val ? parseFloat(val) : 0),
  healthInsurance: z.string().optional().transform(val => val ? parseFloat(val) : 0),
  pension: z.string().optional().transform(val => val ? parseFloat(val) : 0),
  otherDeductions: z.string().optional().transform(val => val ? parseFloat(val) : 0),
});

type PayrollRow = z.infer<typeof PayrollRowSchema>;

export interface PayrollImportJobData {
  fileKey: string;
  uploadedBy: string;
  batchId: string;
  dryRun: boolean;
}

export interface PayrollImportResult {
  success: boolean;
  processedRows: number;
  validRows: number;
  errors: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
  batchId: string;
}

export class PayrollImportProcessor {
  private readonly logger = new Logger('PayrollImportProcessor');

  constructor(
    private readonly prisma: PrismaClient,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService
  ) {}

  async process(job: Job<PayrollImportJobData>): Promise<PayrollImportResult> {
    const { fileKey, uploadedBy, batchId, dryRun } = job.data;
    
    this.logger.info('Starting payroll import', {
      fileKey,
      uploadedBy,
      batchId,
      dryRun,
    });

    try {
      // Update job progress
      await job.progress(10);

      // Download CSV file
      const csvBuffer = await this.storageService.downloadFile(fileKey);
      const csvData = csvBuffer.toString('utf-8');

      await job.progress(20);

      // Parse and validate CSV data
      const { validRows, errors } = await this.parseAndValidateCsv(csvData);
      
      await job.progress(50);

      this.logger.info('CSV validation completed', {
        totalRows: validRows.length + errors.length,
        validRows: validRows.length,
        errorRows: errors.length,
        batchId,
      });

      // If dry run, return validation results without processing
      if (dryRun) {
        await job.progress(100);
        
        return {
          success: true,
          processedRows: 0,
          validRows: validRows.length,
          errors,
          batchId,
        };
      }

      // Process valid rows
      let processedRows = 0;
      if (validRows.length > 0) {
        processedRows = await this.processValidRows(validRows, batchId, job);
      }

      await job.progress(90);

      // Send notification email to uploader
      await this.sendImportNotification(uploadedBy, {
        batchId,
        processedRows,
        validRows: validRows.length,
        errorRows: errors.length,
        success: true,
      });

      await job.progress(100);

      this.logger.info('Payroll import completed', {
        batchId,
        processedRows,
        validRows: validRows.length,
        errorRows: errors.length,
      });

      return {
        success: true,
        processedRows,
        validRows: validRows.length,
        errors,
        batchId,
      };

    } catch (error) {
      this.logger.error('Payroll import failed:', error, { batchId });

      // Send error notification
      try {
        await this.sendImportNotification(uploadedBy, {
          batchId,
          processedRows: 0,
          validRows: 0,
          errorRows: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      } catch (notificationError) {
        this.logger.error('Failed to send error notification:', notificationError);
      }

      throw error;
    }
  }

  private async parseAndValidateCsv(csvData: string): Promise<{
    validRows: PayrollRow[];
    errors: Array<{ row: number; data: any; errors: string[] }>;
  }> {
    const validRows: PayrollRow[] = [];
    const errors: Array<{ row: number; data: any; errors: string[] }> = [];
    
    return new Promise((resolve, reject) => {
      let rowIndex = 0;
      
      Readable.from(csvData)
        .pipe(csv({ skipEmptyLines: true }))
        .on('data', (row) => {
          rowIndex++;
          
          try {
            // Validate row data
            const validatedRow = PayrollRowSchema.parse(row);
            
            // Additional business logic validation
            const businessErrors = this.validateBusinessRules(validatedRow);
            
            if (businessErrors.length > 0) {
              errors.push({
                row: rowIndex,
                data: row,
                errors: businessErrors,
              });
            } else {
              validRows.push(validatedRow);
            }
            
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push({
                row: rowIndex,
                data: row,
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
              });
            } else {
              errors.push({
                row: rowIndex,
                data: row,
                errors: [error instanceof Error ? error.message : String(error)],
              });
            }
          }
        })
        .on('end', () => {
          resolve({ validRows, errors });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private validateBusinessRules(row: PayrollRow): string[] {
    const errors: string[] = [];

    // Check if net salary is reasonable compared to gross salary
    if (row.netSalary > row.grossSalary) {
      errors.push('Net salary cannot be greater than gross salary');
    }

    // Calculate expected deductions
    const totalDeductions = 
      row.socialSecurity + 
      row.incomeTax + 
      row.healthInsurance + 
      row.pension + 
      row.otherDeductions;

    const expectedNetSalary = row.grossSalary - totalDeductions;
    const tolerance = 0.01; // $0.01 tolerance for rounding

    if (Math.abs(expectedNetSalary - row.netSalary) > tolerance) {
      errors.push(
        `Net salary calculation mismatch. Expected: ${expectedNetSalary.toFixed(2)}, Got: ${row.netSalary.toFixed(2)}`
      );
    }

    // Validate period format and range
    const [year, month] = row.period.split('-').map(Number);
    const currentYear = new Date().getFullYear();
    
    if (year < 2020 || year > currentYear + 1) {
      errors.push(`Invalid year in period: ${year}`);
    }
    
    if (month < 1 || month > 12) {
      errors.push(`Invalid month in period: ${month}`);
    }

    return errors;
  }

  private async processValidRows(
    validRows: PayrollRow[],
    batchId: string,
    job: Job
  ): Promise<number> {
    let processedCount = 0;
    const progressStep = 30 / validRows.length; // Allocate 30% progress for processing
    
    for (const row of validRows) {
      try {
        // Find user by employee ID or email
        const user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: row.employeeId },
              { email: row.email },
            ],
            deletedAt: null,
          },
        });

        if (!user) {
          this.logger.warn(`User not found for payroll row`, {
            employeeId: row.employeeId,
            email: row.email,
            batchId,
          });
          continue;
        }

        // Prepare deductions object
        const deductions = {
          socialSecurity: row.socialSecurity,
          incomeTax: row.incomeTax,
          healthInsurance: row.healthInsurance,
          pension: row.pension,
          otherDeductions: row.otherDeductions,
        };

        // Upsert payslip (update if exists, create if not)
        await this.prisma.payslip.upsert({
          where: {
            userId_period: {
              userId: user.id,
              period: row.period,
            },
          },
          update: {
            grossSalary: row.grossSalary,
            netSalary: row.netSalary,
            currency: row.currency,
            deductions,
            importBatch: batchId,
          },
          create: {
            userId: user.id,
            period: row.period,
            grossSalary: row.grossSalary,
            netSalary: row.netSalary,
            currency: row.currency,
            deductions,
            importBatch: batchId,
          },
        });

        processedCount++;
        
        // Update progress
        const currentProgress = 50 + (processedCount * progressStep);
        await job.progress(Math.min(currentProgress, 80));

      } catch (error) {
        this.logger.error('Failed to process payroll row:', error, {
          employeeId: row.employeeId,
          period: row.period,
          batchId,
        });
        // Continue processing other rows
      }
    }

    return processedCount;
  }

  private async sendImportNotification(
    uploadedBy: string,
    result: {
      batchId: string;
      processedRows: number;
      validRows: number;
      errorRows: number;
      success: boolean;
      error?: string;
    }
  ): Promise<void> {
    try {
      // Get uploader details
      const uploader = await this.prisma.user.findUnique({
        where: { id: uploadedBy },
        select: { email: true, firstName: true, lastName: true },
      });

      if (!uploader) {
        this.logger.warn('Uploader not found for notification', { uploadedBy });
        return;
      }

      const templateData = {
        uploaderName: `${uploader.firstName} ${uploader.lastName}`,
        batchId: result.batchId,
        success: result.success,
        processedRows: result.processedRows,
        validRows: result.validRows,
        errorRows: result.errorRows,
        error: result.error,
        timestamp: new Date().toISOString(),
      };

      const template = result.success ? 'payroll-import-success' : 'payroll-import-error';
      
      await this.emailService.sendTemplatedEmail(
        template,
        uploader.email,
        templateData
      );

    } catch (error) {
      this.logger.error('Failed to send import notification:', error, {
        uploadedBy,
        batchId: result.batchId,
      });
    }
  }
}
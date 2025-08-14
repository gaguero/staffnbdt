import { PrismaClient } from '@prisma/client';
import { QueueManager } from './queues/queue-manager';
import { PayrollImportProcessor } from './processors/payroll-import.processor';
import { PayslipGenerationProcessor } from './processors/payslip-generation.processor';
import { EmailNotificationProcessor } from './processors/email-notification.processor';
import { TrainingGradingProcessor } from './processors/training-grading.processor';
import { FileProcessingProcessor } from './processors/file-processing.processor';
import { VacationNotificationProcessor } from './processors/vacation-notification.processor';
import { Logger } from './services/logger.service';
import { EmailService } from './services/email.service';
import { StorageService } from './services/storage.service';
import { PDFService } from './services/pdf.service';
import { AntivirusService } from './services/antivirus.service';

export class WorkerApplication {
  private readonly logger = new Logger('WorkerApplication');
  private readonly prisma: PrismaClient;
  private readonly queueManager: QueueManager;
  private readonly emailService: EmailService;
  private readonly storageService: StorageService;
  private readonly pdfService: PDFService;
  private readonly antivirusService: AntivirusService;

  // Processors
  private readonly payrollImportProcessor: PayrollImportProcessor;
  private readonly payslipGenerationProcessor: PayslipGenerationProcessor;
  private readonly emailNotificationProcessor: EmailNotificationProcessor;
  private readonly trainingGradingProcessor: TrainingGradingProcessor;
  private readonly fileProcessingProcessor: FileProcessingProcessor;
  private readonly vacationNotificationProcessor: VacationNotificationProcessor;

  constructor() {
    this.logger.info('Initializing Worker Application...');

    // Initialize database connection
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Initialize services
    this.emailService = new EmailService();
    this.storageService = new StorageService();
    this.pdfService = new PDFService();
    this.antivirusService = new AntivirusService();

    // Initialize queue manager
    this.queueManager = new QueueManager();

    // Initialize processors
    this.payrollImportProcessor = new PayrollImportProcessor(
      this.prisma,
      this.storageService,
      this.emailService
    );

    this.payslipGenerationProcessor = new PayslipGenerationProcessor(
      this.prisma,
      this.pdfService,
      this.storageService
    );

    this.emailNotificationProcessor = new EmailNotificationProcessor(
      this.prisma,
      this.emailService
    );

    this.trainingGradingProcessor = new TrainingGradingProcessor(
      this.prisma,
      this.emailService
    );

    this.fileProcessingProcessor = new FileProcessingProcessor(
      this.prisma,
      this.storageService,
      this.antivirusService
    );

    this.vacationNotificationProcessor = new VacationNotificationProcessor(
      this.prisma,
      this.emailService
    );
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting Worker Application...');

      // Connect to database
      await this.prisma.$connect();
      this.logger.info('Database connected');

      // Initialize queue manager
      await this.queueManager.initialize();
      this.logger.info('Queue manager initialized');

      // Register processors
      await this.registerProcessors();
      this.logger.info('All processors registered');

      this.logger.info('Worker Application started successfully');
    } catch (error) {
      this.logger.error('Failed to start Worker Application:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping Worker Application...');

      // Close queue connections
      await this.queueManager.close();
      this.logger.info('Queue manager closed');

      // Disconnect from database
      await this.prisma.$disconnect();
      this.logger.info('Database disconnected');

      this.logger.info('Worker Application stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping Worker Application:', error);
      throw error;
    }
  }

  private async registerProcessors(): Promise<void> {
    // Register payroll import processor
    await this.queueManager.registerProcessor(
      'payroll-import',
      this.payrollImportProcessor.process.bind(this.payrollImportProcessor)
    );

    // Register payslip generation processor
    await this.queueManager.registerProcessor(
      'payslip-generation',
      this.payslipGenerationProcessor.process.bind(this.payslipGenerationProcessor)
    );

    // Register email notification processor
    await this.queueManager.registerProcessor(
      'email-notification',
      this.emailNotificationProcessor.process.bind(this.emailNotificationProcessor)
    );

    // Register training grading processor
    await this.queueManager.registerProcessor(
      'training-grading',
      this.trainingGradingProcessor.process.bind(this.trainingGradingProcessor)
    );

    // Register file processing processor
    await this.queueManager.registerProcessor(
      'file-processing',
      this.fileProcessingProcessor.process.bind(this.fileProcessingProcessor)
    );

    // Register vacation notification processor
    await this.queueManager.registerProcessor(
      'vacation-notification',
      this.vacationNotificationProcessor.process.bind(this.vacationNotificationProcessor)
    );

    this.logger.info('All processors registered successfully');
  }

  // Getter methods for health checks and metrics
  get queues() {
    return this.queueManager.getQueueStatus();
  }

  get database() {
    return this.prisma;
  }
}
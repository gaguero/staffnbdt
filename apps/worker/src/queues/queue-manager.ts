import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'ioredis';
import { Logger } from '../services/logger.service';

export interface QueueJob<T = any> {
  data: T;
  opts?: JobOptions;
}

export interface ProcessorFunction<T = any> {
  (job: Job<T>): Promise<any>;
}

export class QueueManager {
  private readonly logger = new Logger('QueueManager');
  private readonly redis: Redis;
  private readonly queues: Map<string, Queue> = new Map();
  private readonly defaultJobOptions: JobOptions;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    // Default job options
    this.defaultJobOptions = {
      attempts: parseInt(process.env.MAX_JOB_ATTEMPTS || '3'),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.JOB_RETRY_DELAY || '5000'),
      },
      removeOnComplete: 50, // Keep last 50 completed jobs
      removeOnFail: 100,    // Keep last 100 failed jobs
    };

    // Redis connection event handlers
    this.redis.on('connect', () => {
      this.logger.info('Redis connected');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      this.logger.info('Queue manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize queue manager:', error);
      throw error;
    }
  }

  async registerProcessor<T>(
    queueName: string,
    processor: ProcessorFunction<T>,
    concurrency = 1
  ): Promise<void> {
    try {
      const queue = this.getOrCreateQueue(queueName);
      
      queue.process(concurrency, async (job: Job<T>) => {
        this.logger.info(`Processing job ${job.id} from queue ${queueName}`, {
          jobId: job.id,
          queueName,
          data: job.data,
        });

        const startTime = Date.now();
        
        try {
          const result = await processor(job);
          const duration = Date.now() - startTime;
          
          this.logger.info(`Job ${job.id} completed successfully in ${duration}ms`, {
            jobId: job.id,
            queueName,
            duration,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          this.logger.error(`Job ${job.id} failed after ${duration}ms:`, error, {
            jobId: job.id,
            queueName,
            duration,
            error: error instanceof Error ? error.message : String(error),
          });

          throw error;
        }
      });

      // Queue event handlers
      queue.on('completed', (job, result) => {
        this.logger.debug(`Job ${job.id} completed`, { jobId: job.id, result });
      });

      queue.on('failed', (job, error) => {
        this.logger.error(`Job ${job.id} failed:`, error, {
          jobId: job.id,
          attempts: job.attemptsMade,
          data: job.data,
        });
      });

      queue.on('stalled', (job) => {
        this.logger.warn(`Job ${job.id} stalled`, { jobId: job.id });
      });

      this.logger.info(`Registered processor for queue: ${queueName} with concurrency: ${concurrency}`);
    } catch (error) {
      this.logger.error(`Failed to register processor for queue ${queueName}:`, error);
      throw error;
    }
  }

  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    try {
      const queue = this.getOrCreateQueue(queueName);
      const jobOptions = { ...this.defaultJobOptions, ...options };
      
      const job = await queue.add(jobName, data, jobOptions);
      
      this.logger.info(`Job ${job.id} added to queue ${queueName}`, {
        jobId: job.id,
        queueName,
        jobName,
      });

      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${queueName}:`, error);
      throw error;
    }
  }

  async addBulkJobs<T>(
    queueName: string,
    jobs: Array<{ name: string; data: T; opts?: JobOptions }>
  ): Promise<Job<T>[]> {
    try {
      const queue = this.getOrCreateQueue(queueName);
      
      const jobsWithOptions = jobs.map(job => ({
        ...job,
        opts: { ...this.defaultJobOptions, ...job.opts },
      }));

      const createdJobs = await queue.addBulk(jobsWithOptions);
      
      this.logger.info(`Added ${createdJobs.length} jobs to queue ${queueName}`);

      return createdJobs;
    } catch (error) {
      this.logger.error(`Failed to add bulk jobs to queue ${queueName}:`, error);
      throw error;
    }
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      this.logger.info(`Queue ${queueName} paused`);
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      this.logger.info(`Queue ${queueName} resumed`);
    }
  }

  async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    };
  }

  getQueueStatus() {
    const status: Record<string, any> = {};
    
    for (const [name, queue] of this.queues) {
      status[name] = {
        isPaused: queue.isPaused(),
        name: queue.name,
      };
    }

    return status;
  }

  private getOrCreateQueue(queueName: string): Queue {
    let queue = this.queues.get(queueName);
    
    if (!queue) {
      queue = new Bull(queueName, {
        redis: {
          host: this.redis.options.host,
          port: this.redis.options.port,
          password: this.redis.options.password,
          db: this.redis.options.db || 0,
        },
        defaultJobOptions: this.defaultJobOptions,
      });

      this.queues.set(queueName, queue);
      this.logger.info(`Created new queue: ${queueName}`);
    }

    return queue;
  }

  async close(): Promise<void> {
    try {
      // Close all queues
      for (const [name, queue] of this.queues) {
        await queue.close();
        this.logger.info(`Queue ${name} closed`);
      }

      // Close Redis connection
      this.redis.disconnect();
      this.logger.info('Redis connection closed');
    } catch (error) {
      this.logger.error('Error closing queue manager:', error);
      throw error;
    }
  }
}
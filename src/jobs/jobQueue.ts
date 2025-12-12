import { storage } from '@forge/api';

/**
 * Job Status
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Job Priority
 */
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Job Type
 */
export type JobType =
  | 'analyze_incident'
  | 'generate_report'
  | 'detect_patterns'
  | 'cleanup_old_data'
  | 'sync_external_api'
  | 'send_notification';

/**
 * Job Definition
 */
export interface Job {
  id: string;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  payload: Record<string, any>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
}

/**
 * Job Queue Configuration
 */
export interface JobQueueConfig {
  maxConcurrentJobs: number;
  defaultMaxAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * Background Job Queue
 * Async processing for long-running tasks
 */
export class JobQueue {
  private static readonly STORAGE_KEY = 'job-queue';
  private static readonly CONFIG: JobQueueConfig = {
    maxConcurrentJobs: 3,
    defaultMaxAttempts: 3,
    retryDelay: 5000,
  };

  /**
   * Add a job to the queue
   */
  static async enqueue(
    type: JobType,
    payload: Record<string, any>,
    priority: JobPriority = 'normal',
    maxAttempts?: number
  ): Promise<string> {
    try {
      const job: Job = {
        id: `job-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type,
        priority,
        status: 'pending',
        payload,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: maxAttempts || this.CONFIG.defaultMaxAttempts,
      };

      const queue: Job[] = (await storage.get(this.STORAGE_KEY)) || [];
      queue.push(job);

      // Sort by priority
      const sortedQueue = this.sortByPriority(queue);
      await storage.set(this.STORAGE_KEY, sortedQueue);

      console.warn(`[Job Queue] 📥 Enqueued job: ${job.id} (${type}, priority: ${priority})`);
      return job.id;
    } catch (error) {
      console.error('[Job Queue] ❌ Failed to enqueue job:', error);
      throw error;
    }
  }

  /**
   * Process next available job
   */
  static async processNext(): Promise<Job | null> {
    try {
      const queue: Job[] = (await storage.get(this.STORAGE_KEY)) || [];

      // Get currently running jobs
      const runningJobs = queue.filter((j) => j.status === 'running').length;

      if (runningJobs >= this.CONFIG.maxConcurrentJobs) {
        console.warn('[Job Queue] ⏸️  Max concurrent jobs reached');
        return null;
      }

      // Find next pending job
      const nextJob = queue.find((j) => j.status === 'pending');

      if (!nextJob) {
        return null;
      }

      // Mark as running
      nextJob.status = 'running';
      nextJob.startedAt = new Date().toISOString();
      nextJob.attempts++;

      await storage.set(this.STORAGE_KEY, queue);

      console.warn(`[Job Queue] 🔄 Processing job: ${nextJob.id} (${nextJob.type})`);

      try {
        // Execute job
        const result = await this.executeJob(nextJob);

        // Mark as completed
        nextJob.status = 'completed';
        nextJob.completedAt = new Date().toISOString();
        nextJob.result = result;

        await storage.set(this.STORAGE_KEY, queue);

        console.warn(`[Job Queue] ✅ Completed job: ${nextJob.id}`);
        return nextJob;
      } catch (error) {
        // Handle job failure
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        nextJob.error = errorMessage;

        if (nextJob.attempts >= nextJob.maxAttempts) {
          nextJob.status = 'failed';
          console.error(`[Job Queue] ❌ Job failed after ${nextJob.attempts} attempts: ${nextJob.id}`);
        } else {
          nextJob.status = 'pending';
          console.warn(`[Job Queue] ⚠️  Job failed (attempt ${nextJob.attempts}/${nextJob.maxAttempts}): ${nextJob.id}`);
        }

        await storage.set(this.STORAGE_KEY, queue);
        throw error;
      }
    } catch (error) {
      console.error('[Job Queue] ❌ Error processing job:', error);
      return null;
    }
  }

  /**
   * Execute a job based on its type
   */
  private static async executeJob(job: Job): Promise<any> {
    switch (job.type) {
      case 'analyze_incident':
        return await this.analyzeIncident(job.payload);

      case 'generate_report':
        return await this.generateReport(job.payload);

      case 'detect_patterns':
        return await this.detectPatterns(job.payload);

      case 'cleanup_old_data':
        return await this.cleanupOldData(job.payload);

      case 'sync_external_api':
        return await this.syncExternalAPI(job.payload);

      case 'send_notification':
        return await this.sendNotification(job.payload);

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Job handlers
   */
  private static async analyzeIncident(payload: Record<string, any>): Promise<any> {
    // Placeholder for incident analysis
    console.warn(`[Job Queue] Analyzing incident: ${payload.issueKey}`);
    return { analyzed: true, issueKey: payload.issueKey };
  }

  private static async generateReport(payload: Record<string, any>): Promise<any> {
    // Placeholder for report generation
    console.warn(`[Job Queue] Generating report: ${payload.reportId}`);
    return { generated: true, reportId: payload.reportId };
  }

  private static async detectPatterns(_payload: Record<string, any>): Promise<any> {
    // Placeholder for pattern detection
    console.warn('[Job Queue] Detecting patterns');
    return { patternsDetected: 0 };
  }

  private static async cleanupOldData(payload: Record<string, any>): Promise<any> {
    // Placeholder for data cleanup
    const daysOld = payload.daysOld || 90;
    console.warn(`[Job Queue] Cleaning up data older than ${daysOld} days`);
    return { cleaned: true, daysOld };
  }

  private static async syncExternalAPI(payload: Record<string, any>): Promise<any> {
    // Placeholder for external API sync
    console.warn(`[Job Queue] Syncing external API: ${payload.apiName}`);
    return { synced: true, apiName: payload.apiName };
  }

  private static async sendNotification(payload: Record<string, any>): Promise<any> {
    // Placeholder for notification sending
    console.warn(`[Job Queue] Sending notification to: ${payload.recipient}`);
    return { sent: true, recipient: payload.recipient };
  }

  /**
   * Get job status
   */
  static async getJob(jobId: string): Promise<Job | null> {
    const queue: Job[] = (await storage.get(this.STORAGE_KEY)) || [];
    return queue.find((j) => j.id === jobId) || null;
  }

  /**
   * Get all jobs
   */
  static async getAllJobs(filter?: { status?: JobStatus; type?: JobType }): Promise<Job[]> {
    let queue: Job[] = (await storage.get(this.STORAGE_KEY)) || [];

    if (filter) {
      if (filter.status) {
        queue = queue.filter((j) => j.status === filter.status);
      }
      if (filter.type) {
        queue = queue.filter((j) => j.type === filter.type);
      }
    }

    return queue;
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    try {
      const queue: Job[] = (await storage.get(this.STORAGE_KEY)) || [];
      const job = queue.find((j) => j.id === jobId);

      if (!job) {
        return false;
      }

      if (job.status === 'running') {
        console.warn(`[Job Queue] ⚠️  Cannot cancel running job: ${jobId}`);
        return false;
      }

      job.status = 'cancelled';
      job.completedAt = new Date().toISOString();

      await storage.set(this.STORAGE_KEY, queue);

      console.warn(`[Job Queue] 🚫 Cancelled job: ${jobId}`);
      return true;
    } catch (error) {
      console.error('[Job Queue] ❌ Failed to cancel job:', error);
      return false;
    }
  }

  /**
   * Clear completed/failed jobs older than X days
   */
  static async cleanupCompletedJobs(daysOld: number = 7): Promise<number> {
    try {
      const queue: Job[] = (await storage.get(this.STORAGE_KEY)) || [];
      const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

      const initialCount = queue.length;

      const filtered = queue.filter((j) => {
        if (j.status === 'pending' || j.status === 'running') {
          return true; // Keep pending/running jobs
        }

        const completedTime = new Date(j.completedAt || j.createdAt).getTime();
        return completedTime > cutoffTime;
      });

      await storage.set(this.STORAGE_KEY, filtered);

      const removed = initialCount - filtered.length;
      console.warn(`[Job Queue] 🧹 Cleaned up ${removed} old jobs`);

      return removed;
    } catch (error) {
      console.error('[Job Queue] ❌ Failed to cleanup jobs:', error);
      return 0;
    }
  }

  /**
   * Sort jobs by priority
   */
  private static sortByPriority(jobs: Job[]): Job[] {
    const priorityOrder: Record<JobPriority, number> = {
      critical: 4,
      high: 3,
      normal: 2,
      low: 1,
    };

    return jobs.sort((a, b) => {
      // First sort by status (pending first)
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;

      // Then by priority
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get queue statistics
   */
  static async getStats(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const queue: Job[] = (await storage.get(this.STORAGE_KEY)) || [];

    return {
      total: queue.length,
      pending: queue.filter((j) => j.status === 'pending').length,
      running: queue.filter((j) => j.status === 'running').length,
      completed: queue.filter((j) => j.status === 'completed').length,
      failed: queue.filter((j) => j.status === 'failed').length,
      cancelled: queue.filter((j) => j.status === 'cancelled').length,
    };
  }
}

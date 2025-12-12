import { storage } from '@forge/api';

interface ErrorRecord {
  timestamp: string;
  errorType: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * Error Tracker
 * Centralized error logging and monitoring
 */
export class ErrorTracker {
  static async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    try {
      const record: ErrorRecord = {
        timestamp: new Date().toISOString(),
        errorType: error.name,
        message: error.message,
        stack: error.stack,
        context,
      };

      const errors: ErrorRecord[] = (await storage.get('error-logs')) || [];
      errors.push(record);

      // Keep last 500 errors
      const trimmed = errors.slice(-500);
      await storage.set('error-logs', trimmed);

      console.error('[Error Tracker]', error.message);
    } catch (e) {
      console.error('[Error Tracker] Failed to log error:', e);
    }
  }

  static async getErrorStats(): Promise<{ total: number; last24h: number; topErrors: string[] }> {
    const errors: ErrorRecord[] = (await storage.get('error-logs')) || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = errors.filter(e => new Date(e.timestamp).getTime() > cutoff);

    return {
      total: errors.length,
      last24h: recent.length,
      topErrors: [...new Set(errors.map(e => e.errorType))].slice(0, 5),
    };
  }
}

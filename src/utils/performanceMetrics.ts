import { storage } from '@forge/api';

interface PerformanceRecord {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
}

/**
 * Performance Metrics
 * Track operation response times and performance
 */
export class PerformanceMetrics {
  static async track(operation: string, duration: number, success: boolean): Promise<void> {
    try {
      const record: PerformanceRecord = {
        operation,
        duration,
        timestamp: new Date().toISOString(),
        success,
      };

      const records: PerformanceRecord[] = (await storage.get('perf-metrics')) || [];
      records.push(record);

      // Keep last 1000 records
      await storage.set('perf-metrics', records.slice(-1000));
    } catch (error) {
      console.error('[Performance] Failed to track metric:', error);
    }
  }

  static async getStats(): Promise<{ avgDuration: number; p95: number; p99: number }> {
    const records: PerformanceRecord[] = (await storage.get('perf-metrics')) || [];
    const durations = records.map(r => r.duration).sort((a, b) => a - b);

    return {
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / (durations.length || 1),
      p95: durations[Math.floor(durations.length * 0.95)] || 0,
      p99: durations[Math.floor(durations.length * 0.99)] || 0,
    };
  }
}

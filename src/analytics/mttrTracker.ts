import { storage } from '@forge/api';

/**
 * MTTR Record
 * Tracks mean time to resolution for incidents
 */
interface MTTRRecord {
  issueKey: string;
  createdAt: string;
  resolvedAt?: string;
  mttr?: number; // minutes
  priority: string;
  status: 'open' | 'resolved';
  autoAnalyzed: boolean;
}

interface MTTRStats {
  averageMTTR: number; // minutes
  medianMTTR: number;
  totalIncidents: number;
  resolvedIncidents: number;
  openIncidents: number;
  mttrByPriority: Record<string, number>;
  weeklyTrend: { week: string; avgMTTR: number }[];
}

/**
 * MTTR Tracker (KPI Monitoring)
 * Tracks and analyzes Mean Time To Resolution
 * Essential for SLA compliance and team performance monitoring
 */
export class MTTRTracker {
  private static readonly STORAGE_KEY = 'mttr-records';

  /**
   * Track incident creation
   */
  static async trackIncidentCreated(issueKey: string, priority: string, autoAnalyzed: boolean): Promise<void> {
    try {
      const record: MTTRRecord = {
        issueKey,
        createdAt: new Date().toISOString(),
        priority,
        status: 'open',
        autoAnalyzed,
      };

      const records: MTTRRecord[] = (await storage.get(this.STORAGE_KEY)) || [];
      records.push(record);
      await storage.set(this.STORAGE_KEY, records);

      console.warn(`[MTTR Tracker] 📊 Tracking ${issueKey} (${priority})`);
    } catch (error) {
      console.error('[MTTR Tracker] ❌ Error tracking incident:', error);
    }
  }

  /**
   * Mark incident as resolved and calculate MTTR
   */
  static async trackIncidentResolved(issueKey: string): Promise<number> {
    try {
      const records: MTTRRecord[] = (await storage.get(this.STORAGE_KEY)) || [];
      const record = records.find((r) => r.issueKey === issueKey);

      if (!record) {
        console.warn(`[MTTR Tracker] ⚠️  Record not found for ${issueKey}`);
        return 0;
      }

      const resolvedAt = new Date().toISOString();
      const createdTime = new Date(record.createdAt).getTime();
      const resolvedTime = new Date(resolvedAt).getTime();
      const mttr = Math.round((resolvedTime - createdTime) / (1000 * 60)); // minutes

      record.resolvedAt = resolvedAt;
      record.mttr = mttr;
      record.status = 'resolved';

      await storage.set(this.STORAGE_KEY, records);

      console.warn(`[MTTR Tracker] ✅ ${issueKey} resolved in ${mttr} minutes`);
      return mttr;
    } catch (error) {
      console.error('[MTTR Tracker] ❌ Error tracking resolution:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive MTTR statistics
   */
  static async getStats(): Promise<MTTRStats> {
    try {
      const records: MTTRRecord[] = (await storage.get(this.STORAGE_KEY)) || [];

      const resolvedRecords = records.filter((r) => r.status === 'resolved' && r.mttr !== undefined);
      const openRecords = records.filter((r) => r.status === 'open');

      if (resolvedRecords.length === 0) {
        return {
          averageMTTR: 0,
          medianMTTR: 0,
          totalIncidents: records.length,
          resolvedIncidents: 0,
          openIncidents: openRecords.length,
          mttrByPriority: {},
          weeklyTrend: [],
        };
      }

      // Calculate average MTTR
      const totalMTTR = resolvedRecords.reduce((sum, r) => sum + (r.mttr || 0), 0);
      const averageMTTR = Math.round(totalMTTR / resolvedRecords.length);

      // Calculate median MTTR
      const sortedMTTRs = resolvedRecords.map((r) => r.mttr || 0).sort((a, b) => a - b);
      const medianMTTR = sortedMTTRs[Math.floor(sortedMTTRs.length / 2)] || 0;

      // Calculate MTTR by priority
      const mttrByPriority: Record<string, number> = {};
      const priorityGroups = new Map<string, number[]>();

      resolvedRecords.forEach((r) => {
        if (!priorityGroups.has(r.priority)) {
          priorityGroups.set(r.priority, []);
        }
        priorityGroups.get(r.priority)!.push(r.mttr || 0);
      });

      priorityGroups.forEach((mttrs, priority) => {
        mttrByPriority[priority] = Math.round(mttrs.reduce((sum, m) => sum + m, 0) / mttrs.length);
      });

      // Calculate weekly trend (last 4 weeks)
      const weeklyTrend = this.calculateWeeklyTrend(resolvedRecords);

      return {
        averageMTTR,
        medianMTTR,
        totalIncidents: records.length,
        resolvedIncidents: resolvedRecords.length,
        openIncidents: openRecords.length,
        mttrByPriority,
        weeklyTrend,
      };
    } catch (error) {
      console.error('[MTTR Tracker] ❌ Error calculating stats:', error);
      return {
        averageMTTR: 0,
        medianMTTR: 0,
        totalIncidents: 0,
        resolvedIncidents: 0,
        openIncidents: 0,
        mttrByPriority: {},
        weeklyTrend: [],
      };
    }
  }

  /**
   * Calculate weekly MTTR trend
   */
  private static calculateWeeklyTrend(records: MTTRRecord[]): { week: string; avgMTTR: number }[] {
    const weeklyData = new Map<string, number[]>();

    records.forEach((r) => {
      if (!r.resolvedAt || r.mttr === undefined) return;

      try {
        const weekStart = this.getWeekStart(new Date(r.resolvedAt));
        const weekKey = weekStart.toISOString().split('T')[0] || '';

        if (weekKey && !weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, []);
        }
        if (weekKey) {
          weeklyData.get(weekKey)!.push(r.mttr);
        }
      } catch (err) {
        // Skip invalid dates
      }
    });

    const trend: { week: string; avgMTTR: number }[] = [];
    weeklyData.forEach((mttrs, week) => {
      const avgMTTR = Math.round(mttrs.reduce((sum, m) => sum + m, 0) / mttrs.length);
      trend.push({ week, avgMTTR });
    });

    return trend.sort((a, b) => a.week.localeCompare(b.week)).slice(-4); // Last 4 weeks
  }

  /**
   * Get start of week (Monday) for a date
   */
  private static getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const result = new Date(date);
    result.setDate(diff);
    return result;
  }

  /**
   * Get SLA compliance rate (assuming 4-hour SLA for High priority)
   */
  static async getSLACompliance(): Promise<{ complianceRate: number; violations: number }> {
    try {
      const records: MTTRRecord[] = (await storage.get(this.STORAGE_KEY)) || [];
      const highPriorityResolved = records.filter(
        (r) => r.status === 'resolved' && r.mttr !== undefined && (r.priority === 'Highest' || r.priority === 'High')
      );

      if (highPriorityResolved.length === 0) {
        return { complianceRate: 100, violations: 0 };
      }

      const slaThreshold = 240; // 4 hours = 240 minutes
      const violations = highPriorityResolved.filter((r) => (r.mttr || 0) > slaThreshold).length;
      const complianceRate = ((highPriorityResolved.length - violations) / highPriorityResolved.length) * 100;

      return {
        complianceRate: Math.round(complianceRate),
        violations,
      };
    } catch (error) {
      console.error('[MTTR Tracker] ❌ Error calculating SLA compliance:', error);
      return { complianceRate: 100, violations: 0 };
    }
  }
}

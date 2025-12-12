import { storage } from '@forge/api';

/**
 * Usage Event Type
 */
export type UsageEventType =
  | 'incident_analyzed'
  | 'pattern_detected'
  | 'report_generated'
  | 'data_exported'
  | 'search_performed'
  | 'workflow_executed'
  | 'health_check'
  | 'security_scan'
  | 'gdpr_request'
  | 'job_queued';

/**
 * Usage Event
 */
export interface UsageEvent {
  id: string;
  eventType: UsageEventType;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
  duration?: number; // milliseconds
  success: boolean;
}

/**
 * Usage Statistics
 */
export interface UsageStats {
  totalEvents: number;
  eventsByType: Record<UsageEventType, number>;
  uniqueUsers: number;
  topUsers: { userId: string; eventCount: number }[];
  topFeatures: { feature: UsageEventType; count: number }[];
  peakHours: { hour: number; count: number }[];
  dailyActivity: { date: string; count: number }[];
  averageDuration: number;
  successRate: number;
}

/**
 * Feature Adoption
 */
export interface FeatureAdoption {
  feature: UsageEventType;
  totalUsage: number;
  uniqueUsers: number;
  adoptionRate: number; // percentage
  avgUsagePerUser: number;
  trend: 'growing' | 'stable' | 'declining';
}

/**
 * Tenant Usage
 */
export interface TenantUsage {
  tenantId: string;
  totalEvents: number;
  storageUsed: number; // bytes
  apiCalls: number;
  quotaUsed: number; // percentage
  topFeatures: string[];
}

/**
 * Usage Analytics
 * Track and analyze platform usage patterns
 */
export class UsageAnalytics {
  private static readonly STORAGE_KEY = 'usage-events';
  private static readonly MAX_EVENTS = 10000; // Keep last 10k events

  /**
   * Track a usage event
   */
  static async trackEvent(
    eventType: UsageEventType,
    userId: string,
    metadata?: Record<string, any>,
    duration?: number,
    success: boolean = true
  ): Promise<void> {
    try {
      const event: UsageEvent = {
        id: `usage-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        eventType,
        userId,
        timestamp: new Date().toISOString(),
        metadata,
        duration,
        success,
      };

      const events: UsageEvent[] = (await storage.get(this.STORAGE_KEY)) || [];
      events.push(event);

      // Keep only last 10k events
      const trimmed = events.slice(-this.MAX_EVENTS);
      await storage.set(this.STORAGE_KEY, trimmed);
    } catch (error) {
      console.error('[Usage Analytics] ❌ Failed to track event:', error);
    }
  }

  /**
   * Get usage statistics
   */
  static async getStats(
    dateRange?: { from: string; to: string }
  ): Promise<UsageStats> {
    try {
      let events: UsageEvent[] = (await storage.get(this.STORAGE_KEY)) || [];

      // Apply date filter
      if (dateRange) {
        const fromTime = new Date(dateRange.from).getTime();
        const toTime = new Date(dateRange.to).getTime();
        events = events.filter((e) => {
          const timestamp = new Date(e.timestamp).getTime();
          return timestamp >= fromTime && timestamp <= toTime;
        });
      }

      // Total events
      const totalEvents = events.length;

      // Events by type
      const eventsByType: Record<string, number> = {};
      events.forEach((e) => {
        eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
      });

      // Unique users
      const uniqueUsers = new Set(events.map((e) => e.userId)).size;

      // Top users
      const userCounts = new Map<string, number>();
      events.forEach((e) => {
        userCounts.set(e.userId, (userCounts.get(e.userId) || 0) + 1);
      });
      const topUsers = Array.from(userCounts.entries())
        .map(([userId, eventCount]) => ({ userId, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      // Top features
      const topFeatures = Object.entries(eventsByType)
        .map(([feature, count]) => ({ feature: feature as UsageEventType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Peak hours
      const hourCounts = new Map<number, number>();
      events.forEach((e) => {
        const hour = new Date(e.timestamp).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });
      const peakHours = Array.from(hourCounts.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily activity (last 30 days)
      const dailyActivity = this.calculateDailyActivity(events, 30);

      // Average duration
      const eventsWithDuration = events.filter((e) => e.duration !== undefined);
      const averageDuration =
        eventsWithDuration.length > 0
          ? eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) /
            eventsWithDuration.length
          : 0;

      // Success rate
      const successRate = totalEvents > 0
        ? (events.filter((e) => e.success).length / totalEvents) * 100
        : 100;

      return {
        totalEvents,
        eventsByType: eventsByType as Record<UsageEventType, number>,
        uniqueUsers,
        topUsers,
        topFeatures,
        peakHours,
        dailyActivity,
        averageDuration: Math.round(averageDuration),
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error) {
      console.error('[Usage Analytics] ❌ Failed to get stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {} as Record<UsageEventType, number>,
        uniqueUsers: 0,
        topUsers: [],
        topFeatures: [],
        peakHours: [],
        dailyActivity: [],
        averageDuration: 0,
        successRate: 100,
      };
    }
  }

  /**
   * Get feature adoption metrics
   */
  static async getFeatureAdoption(): Promise<FeatureAdoption[]> {
    try {
      const events: UsageEvent[] = (await storage.get(this.STORAGE_KEY)) || [];
      const last30Days = this.filterLast30Days(events);
      const previous30Days = this.filterPrevious30Days(events);

      const featureTypes: UsageEventType[] = [
        'incident_analyzed',
        'pattern_detected',
        'report_generated',
        'data_exported',
        'search_performed',
        'workflow_executed',
        'health_check',
        'security_scan',
        'gdpr_request',
        'job_queued',
      ];

      const adoption: FeatureAdoption[] = [];

      for (const feature of featureTypes) {
        const currentEvents = last30Days.filter((e) => e.eventType === feature);
        const previousEvents = previous30Days.filter((e) => e.eventType === feature);

        const totalUsage = currentEvents.length;
        const uniqueUsers = new Set(currentEvents.map((e) => e.userId)).size;
        const totalUsers = new Set(last30Days.map((e) => e.userId)).size;

        const adoptionRate = totalUsers > 0 ? (uniqueUsers / totalUsers) * 100 : 0;
        const avgUsagePerUser = uniqueUsers > 0 ? totalUsage / uniqueUsers : 0;

        // Calculate trend
        let trend: 'growing' | 'stable' | 'declining' = 'stable';
        if (previousEvents.length > 0) {
          const growth = ((totalUsage - previousEvents.length) / previousEvents.length) * 100;
          if (growth > 10) trend = 'growing';
          else if (growth < -10) trend = 'declining';
        } else if (totalUsage > 0) {
          trend = 'growing';
        }

        adoption.push({
          feature,
          totalUsage,
          uniqueUsers,
          adoptionRate: Math.round(adoptionRate * 100) / 100,
          avgUsagePerUser: Math.round(avgUsagePerUser * 100) / 100,
          trend,
        });
      }

      return adoption.sort((a, b) => b.totalUsage - a.totalUsage);
    } catch (error) {
      console.error('[Usage Analytics] ❌ Failed to get feature adoption:', error);
      return [];
    }
  }

  /**
   * Get tenant usage
   */
  static async getTenantUsage(tenantId: string): Promise<TenantUsage> {
    try {
      const events: UsageEvent[] = (await storage.get(this.STORAGE_KEY)) || [];
      const tenantEvents = events.filter((e) => e.metadata?.tenantId === tenantId);

      const totalEvents = tenantEvents.length;

      // Estimate storage usage (rough calculation)
      const storageKeys = [
        'incident-metrics',
        'mttr-records',
        'audit-logs',
        'detected-patterns',
      ];
      let storageUsed = 0;
      for (const key of storageKeys) {
        const data = await storage.get(key);
        if (data) {
          storageUsed += JSON.stringify(data).length;
        }
      }

      // API calls (all events are essentially API calls)
      const apiCalls = totalEvents;

      // Top features for this tenant
      const featureCounts = new Map<string, number>();
      tenantEvents.forEach((e) => {
        featureCounts.set(e.eventType, (featureCounts.get(e.eventType) || 0) + 1);
      });
      const topFeatures = Array.from(featureCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([feature]) => feature);

      // Get tenant quota
      const tenantConfig: any = await storage.get(`tenant-${tenantId}-config`);
      const maxIncidents = tenantConfig?.quotas?.maxIncidents || 1000;
      const quotaUsed = maxIncidents > 0 ? (totalEvents / maxIncidents) * 100 : 0;

      return {
        tenantId,
        totalEvents,
        storageUsed,
        apiCalls,
        quotaUsed: Math.round(quotaUsed * 100) / 100,
        topFeatures,
      };
    } catch (error) {
      console.error('[Usage Analytics] ❌ Failed to get tenant usage:', error);
      return {
        tenantId,
        totalEvents: 0,
        storageUsed: 0,
        apiCalls: 0,
        quotaUsed: 0,
        topFeatures: [],
      };
    }
  }

  /**
   * Calculate daily activity
   */
  private static calculateDailyActivity(
    events: UsageEvent[],
    days: number
  ): { date: string; count: number }[] {
    const dailyCounts = new Map<string, number>();

    events.forEach((e) => {
      const date = e.timestamp.split('T')[0] || '';
      if (date) {
        dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
      }
    });

    const activity = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days);

    return activity;
  }

  /**
   * Filter last 30 days
   */
  private static filterLast30Days(events: UsageEvent[]): UsageEvent[] {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return events.filter((e) => new Date(e.timestamp).getTime() > cutoff);
  }

  /**
   * Filter previous 30 days (30-60 days ago)
   */
  private static filterPrevious30Days(events: UsageEvent[]): UsageEvent[] {
    const start = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const end = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return events.filter((e) => {
      const timestamp = new Date(e.timestamp).getTime();
      return timestamp > start && timestamp <= end;
    });
  }

  /**
   * Get usage report
   */
  static async generateUsageReport(
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<{
    period: string;
    stats: UsageStats;
    adoption: FeatureAdoption[];
    summary: string;
  }> {
    const now = new Date();
    let from: Date;

    switch (period) {
      case 'daily':
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const stats = await this.getStats({
      from: from.toISOString(),
      to: now.toISOString(),
    });

    const adoption = await this.getFeatureAdoption();

    const summary = `
Usage Report (${period})
Total Events: ${stats.totalEvents}
Unique Users: ${stats.uniqueUsers}
Success Rate: ${stats.successRate}%
Avg Response Time: ${stats.averageDuration}ms

Top Features:
${stats.topFeatures.map((f) => `- ${f.feature}: ${f.count} uses`).join('\n')}

Top Users:
${stats.topUsers.slice(0, 5).map((u) => `- ${u.userId}: ${u.eventCount} events`).join('\n')}
    `.trim();

    return {
      period,
      stats,
      adoption,
      summary,
    };
  }

  /**
   * Clean up old events
   */
  static async cleanupOldEvents(daysOld: number = 90): Promise<number> {
    try {
      const events: UsageEvent[] = (await storage.get(this.STORAGE_KEY)) || [];
      const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

      const initialCount = events.length;

      const filtered = events.filter((e) => {
        const timestamp = new Date(e.timestamp).getTime();
        return timestamp > cutoffTime;
      });

      await storage.set(this.STORAGE_KEY, filtered);

      const removed = initialCount - filtered.length;
      console.warn(`[Usage Analytics] 🧹 Cleaned up ${removed} old events`);

      return removed;
    } catch (error) {
      console.error('[Usage Analytics] ❌ Failed to cleanup events:', error);
      return 0;
    }
  }
}

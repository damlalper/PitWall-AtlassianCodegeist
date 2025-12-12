import { storage } from '@forge/api';

export interface VelocityMetricsData {
  incidentsPerDay: number;
  avgResolutionTime: number; // minutes
  analysisSuccessRate: number;
  topPerformers: { name: string; resolvedCount: number }[];
  weeklyTrend: { week: string; incidents: number; avgMTTR: number }[];
}

/**
 * Team Velocity Metrics
 * Track team performance and incident handling velocity
 */
export class VelocityMetrics {
  static async calculate(): Promise<VelocityMetricsData> {
    const metrics: any[] = (await storage.get('incident-metrics')) || [];
    const mttrRecords: any[] = (await storage.get('mttr-records')) || [];

    const last30Days = metrics.filter(m => {
      const age = Date.now() - new Date(m.timestamp).getTime();
      return age <= 30 * 24 * 60 * 60 * 1000;
    });

    return {
      incidentsPerDay: last30Days.length / 30,
      avgResolutionTime: mttrRecords.reduce((sum, r) => sum + (r.mttr || 0), 0) / (mttrRecords.length || 1),
      analysisSuccessRate: 95,
      topPerformers: [],
      weeklyTrend: [],
    };
  }
}

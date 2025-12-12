import { storage } from '@forge/api';
import Resolver from '@forge/resolver';
import { MTTRTracker } from '../analytics/mttrTracker';

const resolver = new Resolver();

/**
 * Dashboard Metrics Resolver
 * Provides real-time metrics for dashboard gadget
 */
resolver.define('getDashboardMetrics', async () => {
  try {
    // Get all necessary data
    const incidents: any[] = (await storage.get('incident-metrics')) || [];
    const mttrRecords: any[] = (await storage.get('mttr-records')) || [];
    const patterns: any[] = (await storage.get('detected-patterns')) || [];

    // Calculate metrics
    const totalIncidents = incidents.length;
    const openIncidents = mttrRecords.filter((r) => r.status === 'open').length;
    const resolvedIncidents = mttrRecords.filter((r) => r.status === 'resolved').length;

    // Get MTTR stats
    const mttrStats = await MTTRTracker.getStats();
    const averageMTTR = mttrStats.averageMTTR;

    // Get SLA compliance
    const slaCompliance = await MTTRTracker.getSLACompliance();

    // Count priority incidents
    const criticalIncidents = incidents.filter(
      (i) => i.priority === 'Highest' || i.priority === 'Critical'
    ).length;
    const highPriorityIncidents = incidents.filter((i) => i.priority === 'High').length;

    // Recent patterns (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentPatterns = patterns.filter((p) => {
      const lastSeen = new Date(p.lastSeen || 0).getTime();
      return lastSeen > sevenDaysAgo;
    }).length;

    return {
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      averageMTTR,
      slaCompliance: slaCompliance.complianceRate,
      criticalIncidents,
      highPriorityIncidents,
      recentPatterns,
    };
  } catch (error) {
    console.error('[Dashboard Resolver] ❌ Failed to get metrics:', error);

    // Return default values on error
    return {
      totalIncidents: 0,
      openIncidents: 0,
      resolvedIncidents: 0,
      averageMTTR: 0,
      slaCompliance: 100,
      criticalIncidents: 0,
      highPriorityIncidents: 0,
      recentPatterns: 0,
    };
  }
});

export const dashboardHandler = resolver.getDefinitions();

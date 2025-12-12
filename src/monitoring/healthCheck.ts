import { storage } from '@forge/api';

/**
 * Health Status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Component Health
 */
export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

/**
 * System Health
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  components: ComponentHealth[];
  metrics: {
    totalIncidents: number;
    totalErrors: number;
    cacheHitRate: number;
    avgResponseTime: number;
  };
}

/**
 * Health Check
 * System health monitoring and diagnostics
 */
export class HealthCheck {
  private static readonly VERSION = '2.2.0';
  private static startTime: number = Date.now();

  /**
   * Perform comprehensive health check
   */
  static async check(): Promise<SystemHealth> {
    const startTime = Date.now();

    try {
      // Check all components
      const components = await Promise.all([
        this.checkStorage(),
        this.checkIncidentMetrics(),
        this.checkMTTRTracking(),
        this.checkAuditLogs(),
        this.checkPatternDetection(),
        this.checkCache(),
        this.checkErrorTracking(),
      ]);

      // Calculate overall status
      const overallStatus = this.calculateOverallStatus(components);

      // Gather system metrics
      const metrics = await this.gatherMetrics();

      const health: SystemHealth = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.VERSION,
        components,
        metrics,
      };

      const duration = Date.now() - startTime;
      console.warn(`[Health Check] ✅ Health check completed in ${duration}ms - Status: ${overallStatus}`);

      return health;
    } catch (error) {
      console.error('[Health Check] ❌ Health check failed:', error);

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.VERSION,
        components: [],
        metrics: {
          totalIncidents: 0,
          totalErrors: 0,
          cacheHitRate: 0,
          avgResponseTime: 0,
        },
      };
    }
  }

  /**
   * Check storage connectivity
   */
  private static async checkStorage(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Test read/write
      const testKey = 'health-check-test';
      const testValue = { timestamp: Date.now() };
      await storage.set(testKey, testValue);
      const retrieved = await storage.get(testKey);

      if (!retrieved || retrieved.timestamp !== testValue.timestamp) {
        throw new Error('Storage read/write verification failed');
      }

      const responseTime = Date.now() - startTime;

      return {
        name: 'storage',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        message: 'Storage operational',
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check incident metrics
   */
  private static async checkIncidentMetrics(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const metrics: any[] = (await storage.get('incident-metrics')) || [];
      const responseTime = Date.now() - startTime;

      return {
        name: 'incident_metrics',
        status: 'healthy',
        responseTime,
        message: `${metrics.length} incidents tracked`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'incident_metrics',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check MTTR tracking
   */
  private static async checkMTTRTracking(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const records: any[] = (await storage.get('mttr-records')) || [];
      const responseTime = Date.now() - startTime;

      const openIncidents = records.filter((r) => r.status === 'open').length;
      const resolvedIncidents = records.filter((r) => r.status === 'resolved').length;

      return {
        name: 'mttr_tracking',
        status: 'healthy',
        responseTime,
        message: `${records.length} records (${openIncidents} open, ${resolvedIncidents} resolved)`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'mttr_tracking',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check audit logs
   */
  private static async checkAuditLogs(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const logs: any[] = (await storage.get('audit-logs')) || [];
      const responseTime = Date.now() - startTime;

      const last24h = logs.filter((l) => {
        const age = Date.now() - new Date(l.timestamp || 0).getTime();
        return age <= 24 * 60 * 60 * 1000;
      }).length;

      return {
        name: 'audit_logs',
        status: 'healthy',
        responseTime,
        message: `${logs.length} total logs (${last24h} in last 24h)`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'audit_logs',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check pattern detection
   */
  private static async checkPatternDetection(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const patterns: any[] = (await storage.get('detected-patterns')) || [];
      const responseTime = Date.now() - startTime;

      const highRiskPatterns = patterns.filter((p) => p.riskScore >= 70).length;

      return {
        name: 'pattern_detection',
        status: 'healthy',
        responseTime,
        message: `${patterns.length} patterns detected (${highRiskPatterns} high-risk)`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'pattern_detection',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check cache system
   */
  private static async checkCache(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const cache: any[] = (await storage.get('cache')) || [];
      const responseTime = Date.now() - startTime;

      const now = Date.now();
      const validEntries = cache.filter((e) => e.expiresAt > now).length;
      const expiredEntries = cache.length - validEntries;

      return {
        name: 'cache',
        status: 'healthy',
        responseTime,
        message: `${validEntries} valid entries, ${expiredEntries} expired`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check error tracking
   */
  private static async checkErrorTracking(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const errors: any[] = (await storage.get('error-logs')) || [];
      const responseTime = Date.now() - startTime;

      const last24h = errors.filter((e) => {
        const age = Date.now() - new Date(e.timestamp || 0).getTime();
        return age <= 24 * 60 * 60 * 1000;
      }).length;

      const status: HealthStatus = last24h > 50 ? 'degraded' : 'healthy';

      return {
        name: 'error_tracking',
        status,
        responseTime,
        message: `${errors.length} total errors (${last24h} in last 24h)`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'error_tracking',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate overall system status
   */
  private static calculateOverallStatus(components: ComponentHealth[]): HealthStatus {
    const unhealthyCount = components.filter((c) => c.status === 'unhealthy').length;
    const degradedCount = components.filter((c) => c.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    }
    if (degradedCount > 1) {
      return 'degraded';
    }
    if (degradedCount === 1) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Gather system metrics
   */
  private static async gatherMetrics(): Promise<{
    totalIncidents: number;
    totalErrors: number;
    cacheHitRate: number;
    avgResponseTime: number;
  }> {
    try {
      const incidents: any[] = (await storage.get('incident-metrics')) || [];
      const errors: any[] = (await storage.get('error-logs')) || [];
      const perfMetrics: any[] = (await storage.get('perf-metrics')) || [];
      const cache: any[] = (await storage.get('cache')) || [];

      // Calculate cache hit rate
      const validCache = cache.filter((e) => e.expiresAt > Date.now()).length;
      const cacheHitRate = cache.length > 0 ? (validCache / cache.length) * 100 : 0;

      // Calculate average response time
      const avgResponseTime =
        perfMetrics.length > 0
          ? perfMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / perfMetrics.length
          : 0;

      return {
        totalIncidents: incidents.length,
        totalErrors: errors.length,
        cacheHitRate: Math.round(cacheHitRate),
        avgResponseTime: Math.round(avgResponseTime),
      };
    } catch (error) {
      console.error('[Health Check] ❌ Failed to gather metrics:', error);
      return {
        totalIncidents: 0,
        totalErrors: 0,
        cacheHitRate: 0,
        avgResponseTime: 0,
      };
    }
  }

  /**
   * Get uptime in human-readable format
   */
  static getUptime(): string {
    const uptimeMs = Date.now() - this.startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}

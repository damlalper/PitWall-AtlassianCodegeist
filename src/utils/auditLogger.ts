import { storage } from '@forge/api';

/**
 * Audit Log Entry
 * Enterprise-grade audit logging for compliance and security
 */
interface AuditLogEntry {
  timestamp: string;
  action: string;
  actor: string; // accountId or 'system'
  resource: string; // e.g., 'issue:PROJ-123'
  resourceType: 'incident' | 'analysis' | 'config' | 'webhook' | 'system';
  status: 'success' | 'failure' | 'pending';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  duration?: number; // milliseconds
}

interface AuditLogQuery {
  startDate?: string;
  endDate?: string;
  action?: string;
  actor?: string;
  resourceType?: string;
  status?: string;
  limit?: number;
}

/**
 * Audit Logger (Production-Ready)
 * Comprehensive audit trail for all PitWall actions
 * Supports GDPR/SOC2 compliance requirements
 */
export class AuditLogger {
  private static readonly STORAGE_KEY = 'audit-logs';
  private static readonly MAX_LOGS = 10000; // Keep last 10k entries
  private static readonly RETENTION_DAYS = 90; // 90-day retention

  /**
   * Log an action to the audit trail
   */
  static async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      const logEntry: AuditLogEntry = {
        ...entry,
        timestamp,
      };

      // Get existing logs
      const existingLogs: AuditLogEntry[] = (await storage.get(this.STORAGE_KEY)) || [];

      // Add new entry
      existingLogs.push(logEntry);

      // Clean up old entries (retention policy)
      const cutoffDate = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const filteredLogs = existingLogs
        .filter((log) => new Date(log.timestamp) > cutoffDate)
        .slice(-this.MAX_LOGS); // Keep only last MAX_LOGS entries

      // Store updated logs
      await storage.set(this.STORAGE_KEY, filteredLogs);

      console.warn(`[Audit Log] ${entry.action} | ${entry.actor} | ${entry.resource} | ${entry.status}`);
    } catch (error) {
      console.error('[Audit Log] ❌ Failed to write audit log:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  /**
   * Query audit logs with filters
   */
  static async query(filters: AuditLogQuery = {}): Promise<AuditLogEntry[]> {
    try {
      const allLogs: AuditLogEntry[] = (await storage.get(this.STORAGE_KEY)) || [];

      let filteredLogs = allLogs;

      // Apply filters
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) <= endDate);
      }

      if (filters.action) {
        filteredLogs = filteredLogs.filter((log) => log.action === filters.action);
      }

      if (filters.actor) {
        filteredLogs = filteredLogs.filter((log) => log.actor === filters.actor);
      }

      if (filters.resourceType) {
        filteredLogs = filteredLogs.filter((log) => log.resourceType === filters.resourceType);
      }

      if (filters.status) {
        filteredLogs = filteredLogs.filter((log) => log.status === filters.status);
      }

      // Sort by timestamp descending (most recent first)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply limit
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }

      return filteredLogs;
    } catch (error) {
      console.error('[Audit Log] ❌ Failed to query audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStats(): Promise<{
    totalLogs: number;
    actionCounts: Record<string, number>;
    successRate: number;
    last24hLogs: number;
  }> {
    try {
      const allLogs: AuditLogEntry[] = (await storage.get(this.STORAGE_KEY)) || [];

      const actionCounts: Record<string, number> = {};
      let successCount = 0;
      let last24hCount = 0;

      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      allLogs.forEach((log) => {
        // Count actions
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

        // Count successes
        if (log.status === 'success') {
          successCount++;
        }

        // Count last 24h
        if (new Date(log.timestamp) > cutoff24h) {
          last24hCount++;
        }
      });

      return {
        totalLogs: allLogs.length,
        actionCounts,
        successRate: allLogs.length > 0 ? (successCount / allLogs.length) * 100 : 0,
        last24hLogs: last24hCount,
      };
    } catch (error) {
      console.error('[Audit Log] ❌ Failed to get stats:', error);
      return {
        totalLogs: 0,
        actionCounts: {},
        successRate: 0,
        last24hLogs: 0,
      };
    }
  }

  /**
   * Export audit logs (for compliance/reporting)
   */
  static async exportLogs(filters: AuditLogQuery = {}): Promise<string> {
    try {
      const logs = await this.query(filters);

      // Convert to CSV format
      const headers = ['Timestamp', 'Action', 'Actor', 'Resource', 'Resource Type', 'Status', 'Error', 'Duration (ms)'];
      const rows = logs.map((log) => [
        log.timestamp,
        log.action,
        log.actor,
        log.resource,
        log.resourceType,
        log.status,
        log.error || '',
        log.duration?.toString() || '',
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      return csv;
    } catch (error) {
      console.error('[Audit Log] ❌ Failed to export logs:', error);
      return '';
    }
  }

  /**
   * Clear all audit logs (admin only - use with caution)
   */
  static async clearAllLogs(): Promise<void> {
    try {
      await storage.set(this.STORAGE_KEY, []);
      console.warn('[Audit Log] ⚠️  All audit logs cleared');
    } catch (error) {
      console.error('[Audit Log] ❌ Failed to clear logs:', error);
    }
  }
}

/**
 * Convenience functions for common audit actions
 */

export async function logIncidentAnalysis(
  issueKey: string,
  actor: string,
  status: 'success' | 'failure',
  duration: number,
  error?: string
): Promise<void> {
  await AuditLogger.log({
    action: 'incident_analysis',
    actor,
    resource: `issue:${issueKey}`,
    resourceType: 'analysis',
    status,
    duration,
    error,
    metadata: {
      issueKey,
    },
  });
}

export async function logConfigChange(
  configKey: string,
  actor: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await AuditLogger.log({
    action: 'config_update',
    actor,
    resource: `config:${configKey}`,
    resourceType: 'config',
    status: 'success',
    metadata: {
      configKey,
      oldValue,
      newValue,
    },
  });
}

export async function logWebhookTrigger(
  webhookType: string,
  targetUrl: string,
  status: 'success' | 'failure',
  error?: string
): Promise<void> {
  await AuditLogger.log({
    action: 'webhook_trigger',
    actor: 'system',
    resource: `webhook:${webhookType}`,
    resourceType: 'webhook',
    status,
    error,
    metadata: {
      webhookType,
      targetUrl: targetUrl.substring(0, 50), // Truncate for privacy
    },
  });
}

export async function logIncidentCreated(issueKey: string, priority: string, autoTriggered: boolean): Promise<void> {
  await AuditLogger.log({
    action: 'incident_created',
    actor: autoTriggered ? 'system' : 'user',
    resource: `issue:${issueKey}`,
    resourceType: 'incident',
    status: 'success',
    metadata: {
      issueKey,
      priority,
      autoTriggered,
    },
  });
}

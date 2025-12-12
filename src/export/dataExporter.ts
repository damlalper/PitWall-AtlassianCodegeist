import { storage } from '@forge/api';
import { VelocityMetrics } from '../analytics/velocityMetrics';
import { AuditLogger } from '../utils/auditLogger';

/**
 * Export Format
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Export Type
 */
export type ExportType =
  | 'incidents'
  | 'mttr_records'
  | 'audit_logs'
  | 'patterns'
  | 'velocity_metrics'
  | 'performance_metrics';

/**
 * Export Options
 */
export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  dateRange?: { from: string; to: string };
  filters?: Record<string, any>;
}

/**
 * Export Result
 */
export interface ExportResult {
  filename: string;
  content: string;
  mimeType: string;
  recordCount: number;
  generatedAt: string;
}

/**
 * Data Exporter
 * Export analytics data to CSV/JSON formats
 */
export class DataExporter {
  /**
   * Export data based on options
   */
  static async export(options: ExportOptions): Promise<ExportResult> {
    try {
      let data: any[];
      let filename: string;

      // Fetch data based on type
      switch (options.type) {
        case 'incidents':
          data = await this.getIncidents(options.dateRange, options.filters);
          filename = `incidents_${this.getTimestamp()}`;
          break;
        case 'mttr_records':
          data = await this.getMTTRRecords(options.dateRange);
          filename = `mttr_records_${this.getTimestamp()}`;
          break;
        case 'audit_logs':
          data = await this.getAuditLogs(options.dateRange);
          filename = `audit_logs_${this.getTimestamp()}`;
          break;
        case 'patterns':
          data = await this.getPatterns();
          filename = `patterns_${this.getTimestamp()}`;
          break;
        case 'velocity_metrics':
          data = await this.getVelocityMetrics();
          filename = `velocity_metrics_${this.getTimestamp()}`;
          break;
        case 'performance_metrics':
          data = await this.getPerformanceMetrics(options.dateRange);
          filename = `performance_metrics_${this.getTimestamp()}`;
          break;
        default:
          throw new Error(`Unknown export type: ${options.type}`);
      }

      // Generate content based on format
      let content: string;
      let mimeType: string;

      if (options.format === 'csv') {
        content = this.convertToCSV(data);
        mimeType = 'text/csv';
        filename += '.csv';
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename += '.json';
      }

      // Log export action
      await AuditLogger.log({
        action: 'data_export',
        actor: 'system',
        resource: `export-${options.type}`,
        resourceType: 'system',
        status: 'success',
        metadata: {
          type: options.type,
          format: options.format,
          recordCount: data.length,
        },
      });

      return {
        filename,
        content,
        mimeType,
        recordCount: data.length,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Data Exporter] ❌ Export failed:', error);
      throw error;
    }
  }

  /**
   * Get incidents data
   */
  private static async getIncidents(
    dateRange?: { from: string; to: string },
    filters?: Record<string, any>
  ): Promise<any[]> {
    let incidents: any[] = (await storage.get('incident-metrics')) || [];

    // Apply date range filter
    if (dateRange) {
      const fromTime = new Date(dateRange.from).getTime();
      const toTime = new Date(dateRange.to).getTime();
      incidents = incidents.filter((i) => {
        const timestamp = new Date(i.timestamp || 0).getTime();
        return timestamp >= fromTime && timestamp <= toTime;
      });
    }

    // Apply additional filters
    if (filters) {
      if (filters.priority) {
        incidents = incidents.filter((i) => i.priority === filters.priority);
      }
      if (filters.status) {
        incidents = incidents.filter((i) => i.status === filters.status);
      }
    }

    // Flatten for export
    return incidents.map((i) => ({
      issueKey: i.issueKey || '',
      summary: i.summary || '',
      priority: i.priority || '',
      status: i.status || '',
      labels: (i.labels || []).join(', '),
      confidence: i.confidence || 0,
      riskLevel: i.riskLevel || '',
      assignee: i.assignee || '',
      timestamp: i.timestamp || '',
    }));
  }

  /**
   * Get MTTR records
   */
  private static async getMTTRRecords(dateRange?: { from: string; to: string }): Promise<any[]> {
    let records: any[] = (await storage.get('mttr-records')) || [];

    if (dateRange) {
      const fromTime = new Date(dateRange.from).getTime();
      const toTime = new Date(dateRange.to).getTime();
      records = records.filter((r) => {
        const timestamp = new Date(r.resolvedAt || r.createdAt || 0).getTime();
        return timestamp >= fromTime && timestamp <= toTime;
      });
    }

    return records.map((r) => ({
      issueKey: r.issueKey || '',
      createdAt: r.createdAt || '',
      resolvedAt: r.resolvedAt || '',
      mttr: r.mttr || 0,
      priority: r.priority || '',
      status: r.status || '',
      autoAnalyzed: r.autoAnalyzed || false,
    }));
  }

  /**
   * Get audit logs
   */
  private static async getAuditLogs(dateRange?: { from: string; to: string }): Promise<any[]> {
    let logs: any[] = (await storage.get('audit-logs')) || [];

    if (dateRange) {
      const fromTime = new Date(dateRange.from).getTime();
      const toTime = new Date(dateRange.to).getTime();
      logs = logs.filter((l) => {
        const timestamp = new Date(l.timestamp || 0).getTime();
        return timestamp >= fromTime && timestamp <= toTime;
      });
    }

    return logs.map((l) => ({
      timestamp: l.timestamp || '',
      action: l.action || '',
      actor: l.actor || '',
      resource: l.resource || '',
      details: JSON.stringify(l.details || {}),
      outcome: l.outcome || '',
    }));
  }

  /**
   * Get detected patterns
   */
  private static async getPatterns(): Promise<any[]> {
    const patterns: any[] = (await storage.get('detected-patterns')) || [];

    return patterns.map((p) => ({
      type: p.type || '',
      description: p.description || '',
      occurrences: p.occurrences || 0,
      affectedComponents: (p.affectedComponents || []).join(', '),
      riskScore: p.riskScore || 0,
      recommendation: p.recommendation || '',
      firstSeen: p.firstSeen || '',
      lastSeen: p.lastSeen || '',
    }));
  }

  /**
   * Get velocity metrics
   */
  private static async getVelocityMetrics(): Promise<any[]> {
    const velocity = await VelocityMetrics.calculate();

    return [
      {
        metric: 'incidentsPerDay',
        value: velocity.incidentsPerDay,
      },
      {
        metric: 'avgResolutionTime',
        value: velocity.avgResolutionTime,
      },
      {
        metric: 'analysisSuccessRate',
        value: velocity.analysisSuccessRate,
      },
    ];
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics(dateRange?: { from: string; to: string }): Promise<any[]> {
    let metrics: any[] = (await storage.get('perf-metrics')) || [];

    if (dateRange) {
      const fromTime = new Date(dateRange.from).getTime();
      const toTime = new Date(dateRange.to).getTime();
      metrics = metrics.filter((m) => {
        const timestamp = new Date(m.timestamp || 0).getTime();
        return timestamp >= fromTime && timestamp <= toTime;
      });
    }

    return metrics.map((m) => ({
      operation: m.operation || '',
      duration: m.duration || 0,
      timestamp: m.timestamp || '',
      success: m.success || false,
    }));
  }

  /**
   * Convert data array to CSV format
   */
  private static convertToCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    // Extract headers from first object
    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add header row
    csvRows.push(headers.map((h) => this.escapeCSVValue(h)).join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        return this.escapeCSVValue(value);
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Get timestamp for filename
   */
  private static getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  }

  /**
   * Export multiple types in a single batch
   */
  static async exportBatch(
    types: ExportType[],
    format: ExportFormat,
    dateRange?: { from: string; to: string }
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const type of types) {
      try {
        const result = await this.export({ format, type, dateRange });
        results.push(result);
      } catch (error) {
        console.error(`[Data Exporter] ❌ Failed to export ${type}:`, error);
      }
    }

    return results;
  }
}

import { storage } from '@forge/api';
import { MTTRTracker } from '../analytics/mttrTracker';
import { VelocityMetrics } from '../analytics/velocityMetrics';
import { PatternDetector } from '../analytics/patternDetector';

/**
 * Report Configuration
 */
export interface ReportConfig {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  sections: ReportSection[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

/**
 * Report Section Types
 */
export type ReportSection =
  | 'mttr_summary'
  | 'sla_compliance'
  | 'velocity_metrics'
  | 'pattern_detection'
  | 'top_incidents'
  | 'team_performance'
  | 'error_summary';

/**
 * Generated Report
 */
export interface GeneratedReport {
  id: string;
  configId: string;
  generatedAt: string;
  period: { from: string; to: string };
  summary: string;
  sections: { type: ReportSection; title: string; content: string; data?: any }[];
  recipients: string[];
}

/**
 * Report Scheduler
 * Automated scheduled reports with email delivery
 */
export class ReportScheduler {
  private static readonly STORAGE_KEY = 'report-configs';
  private static readonly REPORTS_KEY = 'generated-reports';

  /**
   * Create a new report configuration
   */
  static async createReport(config: Omit<ReportConfig, 'id' | 'lastRun' | 'nextRun'>): Promise<string> {
    try {
      const id = `report-${Date.now()}`;
      const nextRun = this.calculateNextRun(config.type);

      const newConfig: ReportConfig = {
        ...config,
        id,
        nextRun: nextRun.toISOString(),
      };

      const configs: ReportConfig[] = (await storage.get(this.STORAGE_KEY)) || [];
      configs.push(newConfig);
      await storage.set(this.STORAGE_KEY, configs);

      console.warn(`[Report Scheduler] 📅 Created report: ${config.name} (${config.type})`);
      return id;
    } catch (error) {
      console.error('[Report Scheduler] ❌ Failed to create report:', error);
      throw error;
    }
  }

  /**
   * Generate and send a scheduled report
   */
  static async generateReport(configId: string): Promise<GeneratedReport> {
    try {
      const configs: ReportConfig[] = (await storage.get(this.STORAGE_KEY)) || [];
      const config = configs.find((c) => c.id === configId);

      if (!config) {
        throw new Error(`Report config not found: ${configId}`);
      }

      const period = this.getReportPeriod(config.type);
      const sections = await this.generateSections(config.sections, period);

      const report: GeneratedReport = {
        id: `generated-${Date.now()}`,
        configId,
        generatedAt: new Date().toISOString(),
        period,
        summary: this.generateSummary(sections),
        sections,
        recipients: config.recipients,
      };

      // Store generated report
      const reports: GeneratedReport[] = (await storage.get(this.REPORTS_KEY)) || [];
      reports.push(report);
      await storage.set(this.REPORTS_KEY, reports.slice(-100)); // Keep last 100 reports

      // Update last run and next run
      config.lastRun = new Date().toISOString();
      config.nextRun = this.calculateNextRun(config.type).toISOString();
      await storage.set(this.STORAGE_KEY, configs);

      console.warn(`[Report Scheduler] ✅ Generated report: ${config.name}`);
      return report;
    } catch (error) {
      console.error('[Report Scheduler] ❌ Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Generate report sections based on configuration
   */
  private static async generateSections(
    sectionTypes: ReportSection[],
    period: { from: string; to: string }
  ): Promise<{ type: ReportSection; title: string; content: string; data?: any }[]> {
    const sections = [];

    for (const type of sectionTypes) {
      let section;

      switch (type) {
        case 'mttr_summary':
          section = await this.generateMTTRSection(period);
          break;
        case 'sla_compliance':
          section = await this.generateSLASection();
          break;
        case 'velocity_metrics':
          section = await this.generateVelocitySection();
          break;
        case 'pattern_detection':
          section = await this.generatePatternSection();
          break;
        case 'top_incidents':
          section = await this.generateTopIncidentsSection(period);
          break;
        case 'team_performance':
          section = await this.generateTeamPerformanceSection(period);
          break;
        case 'error_summary':
          section = await this.generateErrorSummarySection(period);
          break;
        default:
          continue;
      }

      if (section) {
        sections.push(section);
      }
    }

    return sections;
  }

  /**
   * Generate MTTR summary section
   */
  private static async generateMTTRSection(_period: { from: string; to: string }): Promise<any> {
    const stats = await MTTRTracker.getStats();

    return {
      type: 'mttr_summary',
      title: 'Mean Time To Resolution (MTTR)',
      content: `
Average MTTR: ${stats.averageMTTR} minutes
Median MTTR: ${stats.medianMTTR} minutes
Total Incidents: ${stats.totalIncidents}
Resolved: ${stats.resolvedIncidents}
Open: ${stats.openIncidents}

MTTR by Priority:
${Object.entries(stats.mttrByPriority)
  .map(([priority, mttr]) => `- ${priority}: ${mttr} minutes`)
  .join('\n')}
      `.trim(),
      data: stats,
    };
  }

  /**
   * Generate SLA compliance section
   */
  private static async generateSLASection(): Promise<any> {
    const sla = await MTTRTracker.getSLACompliance();

    return {
      type: 'sla_compliance',
      title: 'SLA Compliance',
      content: `
Compliance Rate: ${sla.complianceRate}%
Violations: ${sla.violations}
SLA Threshold: 4 hours (240 minutes)

${sla.complianceRate >= 95 ? '✅ Excellent SLA performance!' : sla.complianceRate >= 80 ? '⚠️ SLA performance needs attention' : '❌ Critical SLA violations detected'}
      `.trim(),
      data: sla,
    };
  }

  /**
   * Generate velocity metrics section
   */
  private static async generateVelocitySection(): Promise<any> {
    const velocity = await VelocityMetrics.calculate();

    return {
      type: 'velocity_metrics',
      title: 'Team Velocity Metrics',
      content: `
Incidents per Day: ${velocity.incidentsPerDay.toFixed(2)}
Average Resolution Time: ${velocity.avgResolutionTime.toFixed(0)} minutes
Analysis Success Rate: ${velocity.analysisSuccessRate}%
      `.trim(),
      data: velocity,
    };
  }

  /**
   * Generate pattern detection section
   */
  private static async generatePatternSection(): Promise<any> {
    const patterns = await PatternDetector.detectPatterns();
    const highRiskPatterns = patterns.patterns.filter((p) => p.riskScore >= 70);

    return {
      type: 'pattern_detection',
      title: 'Detected Patterns & Trends',
      content: `
Total Patterns Detected: ${patterns.patterns.length}
High-Risk Patterns: ${highRiskPatterns.length}

Top 3 High-Risk Patterns:
${highRiskPatterns
  .slice(0, 3)
  .map((p) => `- [${p.patternType}] ${p.description} (Risk: ${p.riskScore}/100)`)
  .join('\n')}
      `.trim(),
      data: patterns,
    };
  }

  /**
   * Generate top incidents section
   */
  private static async generateTopIncidentsSection(period: { from: string; to: string }): Promise<any> {
    const metrics: any[] = (await storage.get('incident-metrics')) || [];
    const fromTime = new Date(period.from).getTime();
    const toTime = new Date(period.to).getTime();

    const periodMetrics = metrics.filter((m) => {
      const timestamp = new Date(m.timestamp || 0).getTime();
      return timestamp >= fromTime && timestamp <= toTime;
    });

    const topIncidents = periodMetrics
      .sort((a, b) => {
        const aPriority = this.getPriorityValue(a.priority);
        const bPriority = this.getPriorityValue(b.priority);
        return bPriority - aPriority;
      })
      .slice(0, 5);

    return {
      type: 'top_incidents',
      title: 'Top Incidents',
      content: `
Total Incidents in Period: ${periodMetrics.length}

Top 5 Incidents:
${topIncidents.map((m) => `- ${m.issueKey || 'Unknown'}: ${m.summary || 'No summary'} (${m.priority})`).join('\n')}
      `.trim(),
      data: { total: periodMetrics.length, incidents: topIncidents },
    };
  }

  /**
   * Generate team performance section
   */
  private static async generateTeamPerformanceSection(period: { from: string; to: string }): Promise<any> {
    const mttrRecords: any[] = (await storage.get('mttr-records')) || [];
    const fromTime = new Date(period.from).getTime();
    const toTime = new Date(period.to).getTime();

    const periodRecords = mttrRecords.filter((r) => {
      const timestamp = new Date(r.resolvedAt || r.createdAt || 0).getTime();
      return timestamp >= fromTime && timestamp <= toTime;
    });

    const resolvedCount = periodRecords.filter((r) => r.status === 'resolved').length;
    const avgMTTR =
      periodRecords
        .filter((r) => r.mttr !== undefined)
        .reduce((sum, r) => sum + r.mttr, 0) / (resolvedCount || 1);

    return {
      type: 'team_performance',
      title: 'Team Performance',
      content: `
Incidents Handled: ${periodRecords.length}
Incidents Resolved: ${resolvedCount}
Average Resolution Time: ${avgMTTR.toFixed(0)} minutes
      `.trim(),
      data: { handled: periodRecords.length, resolved: resolvedCount, avgMTTR },
    };
  }

  /**
   * Generate error summary section
   */
  private static async generateErrorSummarySection(period: { from: string; to: string }): Promise<any> {
    const errors: any[] = (await storage.get('error-logs')) || [];
    const fromTime = new Date(period.from).getTime();
    const toTime = new Date(period.to).getTime();

    const periodErrors = errors.filter((e) => {
      const timestamp = new Date(e.timestamp || 0).getTime();
      return timestamp >= fromTime && timestamp <= toTime;
    });

    const errorTypes = [...new Set(periodErrors.map((e) => e.errorType))];

    return {
      type: 'error_summary',
      title: 'Error Summary',
      content: `
Total Errors in Period: ${periodErrors.length}
Unique Error Types: ${errorTypes.length}

Top Error Types:
${errorTypes.slice(0, 5).map((type) => `- ${type}`).join('\n')}
      `.trim(),
      data: { total: periodErrors.length, types: errorTypes },
    };
  }

  /**
   * Generate overall summary
   */
  private static generateSummary(sections: any[]): string {
    const sectionTitles = sections.map((s) => s.title).join(', ');
    return `Report generated with ${sections.length} sections: ${sectionTitles}`;
  }

  /**
   * Calculate next run time based on report type
   */
  private static calculateNextRun(type: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const next = new Date(now);

    switch (type) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0); // 9 AM next day
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        next.setHours(9, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(9, 0, 0, 0);
        break;
    }

    return next;
  }

  /**
   * Get report period (from/to dates)
   */
  private static getReportPeriod(type: 'daily' | 'weekly' | 'monthly'): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString();
    const from = new Date(now);

    switch (type) {
      case 'daily':
        from.setDate(from.getDate() - 1);
        break;
      case 'weekly':
        from.setDate(from.getDate() - 7);
        break;
      case 'monthly':
        from.setMonth(from.getMonth() - 1);
        break;
    }

    return { from: from.toISOString(), to };
  }

  /**
   * Get priority value for sorting
   */
  private static getPriorityValue(priority: string): number {
    const priorityMap: Record<string, number> = {
      Highest: 5,
      High: 4,
      Medium: 3,
      Low: 2,
      Lowest: 1,
    };
    return priorityMap[priority] || 3;
  }

  /**
   * Get all report configurations
   */
  static async getConfigs(): Promise<ReportConfig[]> {
    return (await storage.get(this.STORAGE_KEY)) || [];
  }

  /**
   * Get generated reports
   */
  static async getGeneratedReports(limit: number = 10): Promise<GeneratedReport[]> {
    const reports: GeneratedReport[] = (await storage.get(this.REPORTS_KEY)) || [];
    return reports.slice(-limit).reverse();
  }
}

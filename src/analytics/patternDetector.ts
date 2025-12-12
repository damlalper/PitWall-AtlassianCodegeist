import { storage } from '@forge/api';
import { UsageAnalytics } from './usageAnalytics';

/**
 * Incident Pattern
 * Detected patterns in incident data
 */
interface IncidentPattern {
  patternId: string;
  patternType:
    | 'recurring_error'
    | 'time_based'
    | 'component_hotspot'
    | 'cascading_failure'
    | 'deployment_correlation';
  description: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  affectedComponents: string[];
  riskScore: number; // 0-100
  recommendation: string;
  relatedIncidents: string[]; // Issue keys
}

interface PatternDetectionResult {
  patterns: IncidentPattern[];
  totalIncidents: number;
  analysisDate: string;
}

/**
 * Pattern Detector (Advanced Analytics)
 * Detects recurring patterns in incident data using ML-like algorithms
 * Helps identify systemic issues and prevent future incidents
 */
export class PatternDetector {
  private static readonly STORAGE_KEY = 'incident-metrics';
  private static readonly PATTERNS_KEY = 'detected-patterns';

  /**
   * Analyze all incidents and detect patterns
   */
  static async detectPatterns(): Promise<PatternDetectionResult> {
    try {
      const incidents: any[] = (await storage.get(this.STORAGE_KEY)) || [];

      if (incidents.length < 3) {
        return {
          patterns: [],
          totalIncidents: incidents.length,
          analysisDate: new Date().toISOString(),
        };
      }

      const patterns: IncidentPattern[] = [];

      // Pattern 1: Recurring errors (same root cause)
      const recurringPatterns = this.detectRecurringErrors(incidents);
      patterns.push(...recurringPatterns);

      // Pattern 2: Time-based patterns (specific hours/days)
      const timePatterns = this.detectTimeBasedPatterns(incidents);
      patterns.push(...timePatterns);

      // Pattern 3: Component hotspots (same component failing repeatedly)
      const componentPatterns = this.detectComponentHotspots(incidents);
      patterns.push(...componentPatterns);

      // Pattern 4: Cascading failures (incidents within minutes of each other)
      const cascadingPatterns = this.detectCascadingFailures(incidents);
      patterns.push(...cascadingPatterns);

      // Pattern 5: Deployment correlation (incidents after deployments)
      const deploymentPatterns = this.detectDeploymentCorrelations(incidents);
      patterns.push(...deploymentPatterns);

      // Store detected patterns
      await storage.set(this.PATTERNS_KEY, patterns);

      // Track usage analytics
      await UsageAnalytics.trackEvent('pattern_detected', 'system', {
        patternCount: patterns.length,
        highRiskPatterns: patterns.filter(p => p.riskScore >= 70).length,
        totalIncidents: incidents.length,
      });

      return {
        patterns: patterns.sort((a, b) => b.riskScore - a.riskScore), // Sort by risk
        totalIncidents: incidents.length,
        analysisDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Pattern Detector] ❌ Error detecting patterns:', error);

      // Track failed analytics
      await UsageAnalytics.trackEvent('pattern_detected', 'system', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, undefined, false);

      return {
        patterns: [],
        totalIncidents: 0,
        analysisDate: new Date().toISOString(),
      };
    }
  }

  /**
   * Detect recurring errors (same root cause appearing multiple times)
   */
  private static detectRecurringErrors(incidents: any[]): IncidentPattern[] {
    const patterns: IncidentPattern[] = [];
    const errorGroups = new Map<string, any[]>();

    // Group incidents by recommended action
    incidents.forEach((incident) => {
      const action = incident.recommendedAction || 'Unknown';
      if (!errorGroups.has(action)) {
        errorGroups.set(action, []);
      }
      errorGroups.get(action)!.push(incident);
    });

    // Find groups with 3+ occurrences
    errorGroups.forEach((group, action) => {
      if (group.length >= 3) {
        const sortedGroup = group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        patterns.push({
          patternId: `recurring_${action.toLowerCase()}`,
          patternType: 'recurring_error',
          description: `Recurring ${action} incidents detected`,
          occurrences: group.length,
          firstSeen: sortedGroup[0].timestamp,
          lastSeen: sortedGroup[sortedGroup.length - 1].timestamp,
          affectedComponents: [...new Set(group.map((i) => i.issueKey))],
          riskScore: Math.min(40 + group.length * 10, 95),
          recommendation: `Investigate root cause for ${action} action pattern. Consider implementing permanent fix.`,
          relatedIncidents: group.map((i) => i.issueKey),
        });
      }
    });

    return patterns;
  }

  /**
   * Detect time-based patterns (incidents at specific times)
   */
  private static detectTimeBasedPatterns(incidents: any[]): IncidentPattern[] {
    const patterns: IncidentPattern[] = [];
    const hourCounts = new Map<number, any[]>();

    // Group by hour of day
    incidents.forEach((incident) => {
      const hour = new Date(incident.timestamp).getHours();
      if (!hourCounts.has(hour)) {
        hourCounts.set(hour, []);
      }
      hourCounts.get(hour)!.push(incident);
    });

    // Find hours with unusually high incident count
    const avgIncidentsPerHour = incidents.length / 24;
    const threshold = avgIncidentsPerHour * 2; // 2x average

    hourCounts.forEach((group, hour) => {
      if (group.length >= threshold && group.length >= 3) {
        patterns.push({
          patternId: `timebased_hour_${hour}`,
          patternType: 'time_based',
          description: `High incident rate during hour ${hour}:00-${hour + 1}:00`,
          occurrences: group.length,
          firstSeen: group[0].timestamp,
          lastSeen: group[group.length - 1].timestamp,
          affectedComponents: [...new Set(group.map((i) => i.issueKey))],
          riskScore: Math.min(30 + group.length * 5, 80),
          recommendation: `Investigate system load and scheduled jobs during hour ${hour}:00. Consider load balancing.`,
          relatedIncidents: group.map((i) => i.issueKey),
        });
      }
    });

    return patterns;
  }

  /**
   * Detect component hotspots (same component failing repeatedly)
   */
  private static detectComponentHotspots(incidents: any[]): IncidentPattern[] {
    const patterns: IncidentPattern[] = [];
    const priorityGroups = new Map<string, any[]>();

    // Group by priority (as proxy for component since we don't have direct component data)
    incidents.forEach((incident) => {
      const priority = incident.priority || 'Unknown';
      if (!priorityGroups.has(priority)) {
        priorityGroups.set(priority, []);
      }
      priorityGroups.get(priority)!.push(incident);
    });

    // Find priorities with high incident count
    priorityGroups.forEach((group, priority) => {
      if (group.length >= 5 && (priority === 'Highest' || priority === 'High')) {
        patterns.push({
          patternId: `hotspot_${priority.toLowerCase()}`,
          patternType: 'component_hotspot',
          description: `${priority} priority incidents clustered`,
          occurrences: group.length,
          firstSeen: group[0].timestamp,
          lastSeen: group[group.length - 1].timestamp,
          affectedComponents: [...new Set(group.map((i) => i.issueKey))],
          riskScore: Math.min(50 + group.length * 8, 100),
          recommendation: `Critical component experiencing frequent failures. Prioritize architectural review and refactoring.`,
          relatedIncidents: group.map((i) => i.issueKey),
        });
      }
    });

    return patterns;
  }

  /**
   * Detect cascading failures (multiple incidents within short time window)
   */
  private static detectCascadingFailures(incidents: any[]): IncidentPattern[] {
    const patterns: IncidentPattern[] = [];
    const sortedIncidents = incidents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const cascadeWindow = 15 * 60 * 1000; // 15 minutes
    let cascadeGroup: any[] = [];

    for (let i = 0; i < sortedIncidents.length; i++) {
      if (cascadeGroup.length === 0) {
        cascadeGroup.push(sortedIncidents[i]);
        continue;
      }

      const lastIncident = cascadeGroup[cascadeGroup.length - 1];
      const timeDiff = new Date(sortedIncidents[i].timestamp).getTime() - new Date(lastIncident.timestamp).getTime();

      if (timeDiff <= cascadeWindow) {
        cascadeGroup.push(sortedIncidents[i]);
      } else {
        // Check if current group forms a pattern
        if (cascadeGroup.length >= 3) {
          patterns.push({
            patternId: `cascade_${cascadeGroup[0].timestamp}`,
            patternType: 'cascading_failure',
            description: `${cascadeGroup.length} incidents within 15 minutes`,
            occurrences: cascadeGroup.length,
            firstSeen: cascadeGroup[0].timestamp,
            lastSeen: cascadeGroup[cascadeGroup.length - 1].timestamp,
            affectedComponents: [...new Set(cascadeGroup.map((i) => i.issueKey))],
            riskScore: Math.min(60 + cascadeGroup.length * 10, 100),
            recommendation: `Cascading failure detected. Investigate system dependencies and implement circuit breakers.`,
            relatedIncidents: cascadeGroup.map((i) => i.issueKey),
          });
        }
        cascadeGroup = [sortedIncidents[i]];
      }
    }

    // Check last group
    if (cascadeGroup.length >= 3) {
      patterns.push({
        patternId: `cascade_${cascadeGroup[0].timestamp}`,
        patternType: 'cascading_failure',
        description: `${cascadeGroup.length} incidents within 15 minutes`,
        occurrences: cascadeGroup.length,
        firstSeen: cascadeGroup[0].timestamp,
        lastSeen: cascadeGroup[cascadeGroup.length - 1].timestamp,
        affectedComponents: [...new Set(cascadeGroup.map((i) => i.issueKey))],
        riskScore: Math.min(60 + cascadeGroup.length * 10, 100),
        recommendation: `Cascading failure detected. Investigate system dependencies and implement circuit breakers.`,
        relatedIncidents: cascadeGroup.map((i) => i.issueKey),
      });
    }

    return patterns;
  }

  /**
   * Detect deployment correlation (incidents spike after commits)
   */
  private static detectDeploymentCorrelations(incidents: any[]): IncidentPattern[] {
    const patterns: IncidentPattern[] = [];

    // Look for incidents with high suspect commit counts
    const incidentsWithCommits = incidents.filter((i) => (i.suspectCommits || 0) >= 2);

    if (incidentsWithCommits.length >= 3) {
      patterns.push({
        patternId: `deployment_correlation`,
        patternType: 'deployment_correlation',
        description: `${incidentsWithCommits.length} incidents correlated with recent deployments`,
        occurrences: incidentsWithCommits.length,
        firstSeen: incidentsWithCommits[0].timestamp,
        lastSeen: incidentsWithCommits[incidentsWithCommits.length - 1].timestamp,
        affectedComponents: [...new Set(incidentsWithCommits.map((i) => i.issueKey))],
        riskScore: Math.min(45 + incidentsWithCommits.length * 7, 90),
        recommendation: `High correlation with deployments. Strengthen CI/CD pipeline, add canary deployments, improve test coverage.`,
        relatedIncidents: incidentsWithCommits.map((i) => i.issueKey),
      });
    }

    return patterns;
  }

  /**
   * Get previously detected patterns
   */
  static async getPatterns(): Promise<IncidentPattern[]> {
    try {
      return (await storage.get(this.PATTERNS_KEY)) || [];
    } catch (error) {
      console.error('[Pattern Detector] ❌ Error getting patterns:', error);
      return [];
    }
  }
}

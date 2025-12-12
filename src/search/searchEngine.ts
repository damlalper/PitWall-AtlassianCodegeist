import { storage } from '@forge/api';

/**
 * Search Filters
 */
export interface SearchFilters {
  dateRange?: { from: string; to: string };
  priorities?: string[];
  statuses?: string[];
  labels?: string[];
  minConfidence?: number;
  maxConfidence?: number;
  riskLevels?: string[];
  assignees?: string[];
  textQuery?: string;
}

/**
 * Search Options
 */
export interface SearchOptions {
  sortBy?: 'createdAt' | 'priority' | 'confidence' | 'riskLevel';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Search Result
 */
export interface SearchResult {
  issueKey: string;
  summary: string;
  priority: string;
  status: string;
  labels: string[];
  createdAt: string;
  confidence: number;
  riskLevel: string;
  assignee?: string;
  analysisSnippet?: string;
}

/**
 * Paginated Search Results
 */
export interface PaginatedSearchResults {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Advanced Search Engine
 * Full-text search and filtering for incidents
 */
export class SearchEngine {
  private static readonly DEFAULT_PAGE_SIZE = 20;

  /**
   * Search incidents with advanced filtering
   */
  static async search(
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<PaginatedSearchResults> {
    try {
      const metrics: any[] = (await storage.get('incident-metrics')) || [];

      // Apply filters
      let filtered = this.applyFilters(metrics, filters);

      // Apply text search
      if (filters.textQuery) {
        filtered = this.applyTextSearch(filtered, filters.textQuery);
      }

      // Sort results
      const sorted = this.sortResults(filtered, options.sortBy || 'createdAt', options.sortOrder || 'desc');

      // Pagination
      const limit = options.limit || this.DEFAULT_PAGE_SIZE;
      const offset = options.offset || 0;
      const page = Math.floor(offset / limit) + 1;

      const paginated = sorted.slice(offset, offset + limit);
      const results: SearchResult[] = paginated.map((m) => ({
        issueKey: m.issueKey || 'Unknown',
        summary: m.summary || '',
        priority: m.priority || 'Medium',
        status: m.status || 'Open',
        labels: m.labels || [],
        createdAt: m.timestamp || new Date().toISOString(),
        confidence: m.confidence || 0,
        riskLevel: m.riskLevel || 'MEDIUM',
        assignee: m.assignee,
        analysisSnippet: this.createSnippet(m.analysis || '', 150),
      }));

      return {
        results,
        total: sorted.length,
        page,
        pageSize: limit,
        hasMore: offset + limit < sorted.length,
      };
    } catch (error) {
      console.error('[Search Engine] ❌ Search failed:', error);
      return {
        results: [],
        total: 0,
        page: 1,
        pageSize: options.limit || this.DEFAULT_PAGE_SIZE,
        hasMore: false,
      };
    }
  }

  /**
   * Apply all filters to incident metrics
   */
  private static applyFilters(metrics: any[], filters: SearchFilters): any[] {
    let filtered = metrics;

    // Date range filter
    if (filters.dateRange) {
      const fromTime = new Date(filters.dateRange.from).getTime();
      const toTime = new Date(filters.dateRange.to).getTime();
      filtered = filtered.filter((m) => {
        const timestamp = new Date(m.timestamp || 0).getTime();
        return timestamp >= fromTime && timestamp <= toTime;
      });
    }

    // Priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter((m) => filters.priorities!.includes(m.priority));
    }

    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter((m) => filters.statuses!.includes(m.status));
    }

    // Labels filter (any match)
    if (filters.labels && filters.labels.length > 0) {
      filtered = filtered.filter((m) => {
        const incidentLabels = m.labels || [];
        return filters.labels!.some((label) => incidentLabels.includes(label));
      });
    }

    // Confidence range filter
    if (filters.minConfidence !== undefined) {
      filtered = filtered.filter((m) => (m.confidence || 0) >= filters.minConfidence!);
    }
    if (filters.maxConfidence !== undefined) {
      filtered = filtered.filter((m) => (m.confidence || 0) <= filters.maxConfidence!);
    }

    // Risk level filter
    if (filters.riskLevels && filters.riskLevels.length > 0) {
      filtered = filtered.filter((m) => filters.riskLevels!.includes(m.riskLevel));
    }

    // Assignee filter
    if (filters.assignees && filters.assignees.length > 0) {
      filtered = filtered.filter((m) => filters.assignees!.includes(m.assignee));
    }

    return filtered;
  }

  /**
   * Apply full-text search across summary and analysis
   */
  private static applyTextSearch(metrics: any[], query: string): any[] {
    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(/\s+/).filter((k) => k.length > 2);

    return metrics.filter((m) => {
      const searchableText = [
        m.summary || '',
        m.analysis || '',
        m.issueKey || '',
        ...(m.labels || []),
      ].join(' ').toLowerCase();

      // Match if any keyword is found
      return keywords.some((keyword) => searchableText.includes(keyword));
    });
  }

  /**
   * Sort results by specified field
   */
  private static sortResults(metrics: any[], sortBy: string, sortOrder: string): any[] {
    const sorted = [...metrics].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.timestamp || 0).getTime();
          bValue = new Date(b.timestamp || 0).getTime();
          break;
        case 'priority':
          aValue = this.getPriorityValue(a.priority);
          bValue = this.getPriorityValue(b.priority);
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case 'riskLevel':
          aValue = this.getRiskValue(a.riskLevel);
          bValue = this.getRiskValue(b.riskLevel);
          break;
        default:
          aValue = a.timestamp || '';
          bValue = b.timestamp || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }

  /**
   * Get numeric value for priority sorting
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
   * Get numeric value for risk level sorting
   */
  private static getRiskValue(riskLevel: string): number {
    const riskMap: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };
    return riskMap[riskLevel] || 2;
  }

  /**
   * Create text snippet with ellipsis
   */
  private static createSnippet(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Get search facets for building filter UI
   */
  static async getFacets(): Promise<{
    priorities: string[];
    statuses: string[];
    labels: string[];
    riskLevels: string[];
    assignees: string[];
  }> {
    try {
      const metrics: any[] = (await storage.get('incident-metrics')) || [];

      const priorities = [...new Set(metrics.map((m) => m.priority))].filter(Boolean);
      const statuses = [...new Set(metrics.map((m) => m.status))].filter(Boolean);
      const labels = [...new Set(metrics.flatMap((m) => m.labels || []))].filter(Boolean);
      const riskLevels = [...new Set(metrics.map((m) => m.riskLevel))].filter(Boolean);
      const assignees = [...new Set(metrics.map((m) => m.assignee))].filter(Boolean);

      return {
        priorities: priorities.sort(),
        statuses: statuses.sort(),
        labels: labels.sort(),
        riskLevels: riskLevels.sort(),
        assignees: assignees.sort(),
      };
    } catch (error) {
      console.error('[Search Engine] ❌ Failed to get facets:', error);
      return {
        priorities: [],
        statuses: [],
        labels: [],
        riskLevels: [],
        assignees: [],
      };
    }
  }
}

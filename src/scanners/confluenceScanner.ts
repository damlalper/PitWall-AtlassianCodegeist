// Reserved for production Confluence API calls
// import api, { route } from '@forge/api';

interface RunbookPage {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  steps: string[];
  relevanceScore: number;
}

interface ConfluenceScanResult {
  runbooks: RunbookPage[];
  searchQuery: string;
  totalFound: number;
}

/**
 * Confluence Runbook Finder
 * Searches Confluence for relevant troubleshooting documentation
 */
export async function findRelatedRunbooks(keywords: string[]): Promise<ConfluenceScanResult> {
  console.warn('[Confluence Scanner] 📚 Searching for runbooks...');

  const searchQuery = keywords.join(' OR ');

  try {

    // For hackathon demo: Return simulated data
    // In production: api.asUser().requestConfluence(route`/wiki/rest/api/search?cql=...`)
    const simulatedRunbooks: RunbookPage[] = [
      {
        id: 'conf-001',
        title: 'Database Timeout Troubleshooting Guide',
        url: 'https://company.atlassian.net/wiki/spaces/RUNBOOK/pages/123456',
        excerpt: 'Steps to diagnose and fix database connection pool timeout issues...',
        steps: [
          'Check connection pool size in config',
          'Monitor active connections',
          'Review recent schema changes',
          'Verify network latency to DB',
          'Consider increasing timeout threshold',
        ],
        relevanceScore: 95,
      },
      {
        id: 'conf-002',
        title: 'Payment Service Incident Playbook',
        url: 'https://company.atlassian.net/wiki/spaces/RUNBOOK/pages/789012',
        excerpt: 'Standard operating procedure for payment-related incidents...',
        steps: [
          'Verify payment gateway status',
          'Check API rate limits',
          'Review transaction logs',
          'Rollback if needed',
        ],
        relevanceScore: 85,
      },
      {
        id: 'conf-003',
        title: 'API Rate Limiting Configuration',
        url: 'https://company.atlassian.net/wiki/spaces/DOCS/pages/345678',
        excerpt: 'How to configure and troubleshoot API rate limiters...',
        steps: ['Review rate limit settings', 'Check Redis cache', 'Monitor API metrics'],
        relevanceScore: 70,
      },
    ];

    // Filter and rank by relevance
    const relevantRunbooks = simulatedRunbooks
      .filter((rb) => {
        const searchText = `${rb.title} ${rb.excerpt}`.toLowerCase();
        return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Top 3 most relevant

    console.warn(
      `[Confluence Scanner] ✅ Found ${relevantRunbooks.length} relevant runbooks out of ${simulatedRunbooks.length}`
    );

    return {
      runbooks: relevantRunbooks.length > 0 ? relevantRunbooks : simulatedRunbooks.slice(0, 2),
      searchQuery,
      totalFound: simulatedRunbooks.length,
    };
  } catch (error) {
    console.error('[Confluence Scanner] ❌ Error searching runbooks:', error);

    return {
      runbooks: [],
      searchQuery: searchQuery,
      totalFound: 0,
    };
  }
}

/**
 * Generate action steps summary from runbook
 */
export function summarizeRunbook(runbook: RunbookPage): string {
  const steps = runbook.steps.slice(0, 5).map((step, i) => `   ${i + 1}. ${step}`);
  return steps.join('\n');
}

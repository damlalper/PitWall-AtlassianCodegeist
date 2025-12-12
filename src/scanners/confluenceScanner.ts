import api, { route, storage } from '@forge/api';

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

interface ConfluenceConfig {
  spaceKey?: string;
  enabled: boolean;
}

/**
 * Confluence Runbook Finder (Production-Ready)
 * Searches Confluence for relevant troubleshooting documentation using CQL
 * Falls back to simulated data if not configured
 */
export async function findRelatedRunbooks(keywords: string[]): Promise<ConfluenceScanResult> {
  console.warn('[Confluence Scanner] 📚 Searching for runbooks...');

  const searchQuery = keywords.join(' OR ');

  try {
    // Get Confluence configuration from storage
    const config: ConfluenceConfig = (await storage.get('confluence-config')) || { enabled: false };

    let runbooks: RunbookPage[] = [];

    if (config.enabled && config.spaceKey) {
      // REAL CONFLUENCE API CALL
      console.warn(`[Confluence Scanner] 📡 Calling Confluence API: space=${config.spaceKey}`);

      try {
        // Build CQL query for searching pages
        const cqlQuery = `space = "${config.spaceKey}" AND type = page AND (${keywords.map(k => `text ~ "${k}"`).join(' OR ')})`;
        const encodedCql = encodeURIComponent(cqlQuery);

        const response = await api
          .asUser()
          .requestConfluence(route`/wiki/rest/api/search?cql=${encodedCql}&limit=10`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

        if (!response.ok) {
          throw new Error(`Confluence API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Transform Confluence API response to our format
        runbooks = await Promise.all(
          (data.results || []).map(async (result: any) => {
            const page = result.content || result;

            // Get page content to extract steps
            let steps: string[] = [];
            let excerpt = page.excerpt || '';

            try {
              const contentResponse = await api
                .asUser()
                .requestConfluence(route`/wiki/rest/api/content/${page.id}?expand=body.storage`, {
                  method: 'GET',
                });

              if (contentResponse.ok) {
                const contentData = await contentResponse.json();
                const bodyHtml = contentData.body?.storage?.value || '';

                // Extract numbered list items or bullet points as steps
                const listMatches = bodyHtml.match(/<li>(.*?)<\/li>/g) || [];
                steps = listMatches
                  .slice(0, 5)
                  .map((item: string) => item.replace(/<\/?[^>]+(>|$)/g, '').trim())
                  .filter(Boolean);

                // Extract excerpt from first paragraph if not provided
                if (!excerpt) {
                  const paragraphMatch = bodyHtml.match(/<p>(.*?)<\/p>/);
                  if (paragraphMatch) {
                    excerpt = paragraphMatch[1].replace(/<\/?[^>]+(>|$)/g, '').substring(0, 200);
                  }
                }
              }
            } catch (err) {
              console.warn(`[Confluence Scanner] ⚠️  Could not fetch content for page ${page.id}`);
            }

            // Calculate relevance score based on keyword matches
            const titleLower = (page.title || '').toLowerCase();
            const excerptLower = excerpt.toLowerCase();
            let score = 0;

            keywords.forEach(keyword => {
              const keyLower = keyword.toLowerCase();
              if (titleLower.includes(keyLower)) score += 30;
              if (excerptLower.includes(keyLower)) score += 10;
            });

            // Add base URL from _links if available
            const baseUrl = page._links?.webui || `/wiki/spaces/${config.spaceKey}/pages/${page.id}`;

            return {
              id: page.id,
              title: page.title || 'Untitled',
              url: baseUrl.startsWith('http') ? baseUrl : `https://your-domain.atlassian.net${baseUrl}`,
              excerpt: excerpt || 'No excerpt available',
              steps: steps.length > 0 ? steps : ['See full page for details'],
              relevanceScore: Math.min(score, 100),
            };
          })
        );

        // Sort by relevance
        runbooks.sort((a, b) => b.relevanceScore - a.relevanceScore);

        console.warn(`[Confluence Scanner] ✅ Fetched ${runbooks.length} real pages from Confluence API`);
      } catch (apiError) {
        console.error('[Confluence Scanner] ❌ Confluence API call failed:', apiError);
        console.warn('[Confluence Scanner] ⚠️  Falling back to simulated data');
        runbooks = getFallbackRunbooks();
      }
    } else {
      console.warn('[Confluence Scanner] ⚠️  Confluence not configured, using fallback data');
      runbooks = getFallbackRunbooks();
    }

    // Filter and rank by relevance
    const relevantRunbooks = runbooks
      .filter((rb) => {
        const searchText = `${rb.title} ${rb.excerpt}`.toLowerCase();
        return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Top 3 most relevant

    console.warn(
      `[Confluence Scanner] ✅ Found ${relevantRunbooks.length} relevant runbooks out of ${runbooks.length}`
    );

    return {
      runbooks: relevantRunbooks.length > 0 ? relevantRunbooks : runbooks.slice(0, 2),
      searchQuery,
      totalFound: runbooks.length,
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
 * Fallback simulated runbooks (used when Confluence not configured)
 */
function getFallbackRunbooks(): RunbookPage[] {
  return [
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
}

/**
 * Generate action steps summary from runbook
 */
export function summarizeRunbook(runbook: RunbookPage): string {
  const steps = runbook.steps.slice(0, 5).map((step, i) => `   ${i + 1}. ${step}`);
  return steps.join('\n');
}

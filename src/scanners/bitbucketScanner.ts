// import api from '@forge/api'; // Reserved for production Bitbucket API calls

interface CommitData {
  hash: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
  files: string[];
}

interface BitbucketScanResult {
  suspects: CommitData[];
  totalCommits: number;
  timeRange: string;
}

/**
 * Bitbucket Telemetry Scanner
 * Scans recent commits and matches them with incident keywords
 */
export async function scanBitbucketCommits(
  _workspace: string,
  _repoSlug: string,
  issueKeywords: string[]
): Promise<BitbucketScanResult> {
  console.warn('[Bitbucket Scanner] 🔍 Starting telemetry scan...');

  try {
    // Calculate time range (last 24 hours)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const timeRange = `Last 24 hours (since ${since})`;

    // For hackathon demo: Return simulated data
    // In production, this would call: api.fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/commits`)
    const simulatedCommits: CommitData[] = [
      {
        hash: 'a1b2c3d',
        message: 'Fix: Database connection pool timeout',
        author: {
          name: 'Ali Yilmaz',
          email: 'ali@example.com',
        },
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        files: ['src/db/connection.ts', 'src/db/pool.ts'],
      },
      {
        hash: 'e4f5g6h',
        message: 'Update: API rate limiting logic',
        author: {
          name: 'Ayse Kara',
          email: 'ayse@example.com',
        },
        date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        files: ['src/api/middleware/rateLimiter.ts'],
      },
      {
        hash: 'i7j8k9l',
        message: 'Refactor: Payment service timeout configuration',
        author: {
          name: 'Mehmet Demir',
          email: 'mehmet@example.com',
        },
        date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        files: ['src/services/payment.ts', 'config/timeout.json'],
      },
    ];

    // Match commits with issue keywords
    const suspects = simulatedCommits.filter((commit) => {
      const searchText = `${commit.message} ${commit.files.join(' ')}`.toLowerCase();
      return issueKeywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
    });

    console.warn(`[Bitbucket Scanner] ✅ Found ${suspects.length} suspect commits out of ${simulatedCommits.length}`);

    return {
      suspects: suspects.length > 0 ? suspects : simulatedCommits.slice(0, 2), // Show recent commits if no match
      totalCommits: simulatedCommits.length,
      timeRange,
    };
  } catch (error) {
    console.error('[Bitbucket Scanner] ❌ Error scanning commits:', error);

    return {
      suspects: [],
      totalCommits: 0,
      timeRange: 'Error',
    };
  }
}

/**
 * Extract keywords from issue summary for matching
 */
export function extractKeywords(summary: string): string[] {
  // Remove common words and extract meaningful keywords
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const words = summary
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.includes(word));

  return words;
}

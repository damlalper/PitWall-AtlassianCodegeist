import api, { route, storage } from '@forge/api';
import { scanBitbucketCommits, extractKeywords } from '../scanners/bitbucketScanner';
import { findRelatedRunbooks } from '../scanners/confluenceScanner';
import { analyzeWithAtlassianAI } from '../ai/atlassianAI';

interface AnalysisPayload {
  issueKey?: string;
}

interface CommitInfo {
  message: string;
  author: string;
  files: string[];
  timestamp: string;
}

/**
 * Incident Analyzer - Cross-Product AI Context Engine
 * Core logic for the Rovo Agent action
 *
 * This is the "Race Engineer" AI - analyzing incidents like F1 telemetry
 * Integrates Jira + Bitbucket + Confluence data
 */
export async function handler(payload: unknown): Promise<{ analysis: string }> {
  try {
    console.warn('[PitWall Analyzer] 🤖 Race Engineer analyzing incident...');
    console.warn('[PitWall Analyzer] 🔄 Cross-Product AI Context Engine activated');

    const typedPayload = payload as AnalysisPayload;
    const issueKey = typedPayload?.issueKey;

    let issueData = null;
    let recentCommits: CommitInfo[] = [];

    // STEP 1: Fetch Jira issue details
    if (issueKey) {
      try {
        const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
        issueData = await response.json();
        console.warn(`[PitWall] ✅ Jira data fetched: ${issueKey}`);
      } catch (error) {
        console.error('[PitWall] Failed to fetch issue:', error);
      }
    }

    // STEP 2: Extract keywords from issue summary
    const summary = issueData?.fields?.summary || 'unknown issue';
    const keywords = extractKeywords(summary);
    console.warn(`[PitWall] 🔍 Keywords extracted: ${keywords.join(', ')}`);

    // STEP 3: Scan Bitbucket for suspect commits
    const bitbucketScan = await scanBitbucketCommits('demo-workspace', 'demo-repo', keywords);
    console.warn(`[PitWall] 📊 Bitbucket scan: ${bitbucketScan.suspects.length} suspects found`);

    // STEP 4: Find related Confluence runbooks
    const confluenceScan = await findRelatedRunbooks(keywords);
    console.warn(`[PitWall] 📚 Confluence scan: ${confluenceScan.runbooks.length} runbooks found`);

    // STEP 5: AI-powered root cause analysis with Atlassian Intelligence
    recentCommits = bitbucketScan.suspects.map((commit) => ({
      message: commit.message,
      author: commit.author.name,
      files: commit.files,
      timestamp: commit.date,
    }));

    console.warn('[PitWall] 🤖 Calling Atlassian Intelligence API...');

    // Use real Atlassian AI for analysis
    const aiAnalysis = await analyzeWithAtlassianAI({
      issueKey: issueKey || 'Unknown',
      issueSummary: summary,
      issueDescription: issueData?.fields?.description || '',
      priority: issueData?.fields?.priority?.name || 'Unknown',
      suspectCommits: recentCommits.map((c) => ({
        message: c.message,
        author: c.author,
        files: c.files,
      })),
      runbooks: confluenceScan.runbooks.map((r) => ({
        title: r.title,
        excerpt: r.excerpt,
      })),
    });

    console.warn(`[PitWall] 🎯 AI Confidence: ${aiAnalysis.confidenceLevel}%`);
    console.warn(`[PitWall] 💡 Recommended Action: ${aiAnalysis.recommendedAction}`);

    const rootCause = detectRootCause(issueData, recentCommits);
    const strategy = recommendStrategy(rootCause);
    const confidence = aiAnalysis.confidenceLevel; // Use AI confidence

    // STEP 6: Store metrics in Forge Storage
    await storeIncidentMetrics(issueKey || 'Unknown', {
      timestamp: new Date().toISOString(),
      priority: issueData?.fields?.priority?.name || 'Unknown',
      aiConfidence: confidence,
      suspectCommits: bitbucketScan.suspects.length,
      runbooksFound: confluenceScan.runbooks.length,
      recommendedAction: aiAnalysis.recommendedAction,
    });

    const analysis = `
🏎️ PitWall Race Engineer - Cross-Product AI Context Engine
═══════════════════════════════════════════════════════════

📊 JIRA INCIDENT SUMMARY:
   Issue: ${issueKey || 'N/A'}
   Priority: ${issueData?.fields?.priority?.name || 'Unknown'}
   Reporter: ${issueData?.fields?.reporter?.displayName || 'Unknown'}
   Created: ${issueData?.fields?.created ? new Date(issueData.fields.created).toLocaleString() : 'N/A'}
   Summary: ${summary}

🤖 ATLASSIAN INTELLIGENCE ANALYSIS:
   AI Confidence: ${confidence}%
   Root Cause Hypothesis: ${aiAnalysis.rootCauseHypothesis}
   Recommended Action: ${aiAnalysis.recommendedAction}
   AI Reasoning: ${aiAnalysis.reasoning.substring(0, 200)}...

🔍 PATTERN-BASED VALIDATION:
   Detected Pattern: ${rootCause.description}
   Affected Component: ${rootCause.component}
   Risk Level: ${rootCause.riskLevel}

🧪 BITBUCKET TELEMETRY (Suspected Commits):
   Time Range: ${bitbucketScan.timeRange}
   Total Commits Scanned: ${bitbucketScan.totalCommits}
   Suspects Found: ${bitbucketScan.suspects.length}
${bitbucketScan.suspects.map((c, i) => `
   [${i + 1}] ${c.message}
       Author: ${c.author.name}
       Hash: ${c.hash}
       Files: ${c.files.join(', ')}
       Time: ${new Date(c.date).toLocaleString()}`).join('\n') || '   No suspicious commits detected'}

📚 CONFLUENCE RUNBOOKS (Related Documentation):
   Search Query: "${confluenceScan.searchQuery}"
   Runbooks Found: ${confluenceScan.runbooks.length}
${confluenceScan.runbooks.map((rb, i) => `
   [${i + 1}] ${rb.title} (${rb.relevanceScore}% match)
       Link: ${rb.url}
       Quick Steps:
${rb.steps.slice(0, 3).map((step, j) => `       ${j + 1}. ${step}`).join('\n')}`).join('\n') || '   No relevant runbooks found'}

🛠️  RECOMMENDED PIT STOP STRATEGY:
   ${strategy.action}
${strategy.steps.map((step, i) => `   ${i + 1}. ${step}`).join('\n')}

⏱️  ESTIMATED MTTR: ${strategy.estimatedTime}
🏁 STATUS: Cross-product analysis complete - ready for action

───────────────────────────────────────────────────────────
⚡ Powered by PitWall Race Engineer | Williams Racing Edition
🔗 Data Sources: Jira + Bitbucket + Confluence
    `.trim();

    console.warn('[PitWall Analyzer] ✅ Analysis complete');

    // STEP 7: Add automatic comment to Jira issue
    if (issueKey) {
      await addJiraComment(issueKey, analysis, aiAnalysis.recommendedAction);
    }

    return {
      analysis,
    };
  } catch (error) {
    console.error('[PitWall Analyzer] ❌ Error during analysis:', error);

    // Graceful degradation
    return {
      analysis: `
🏎️ PitWall Race Engineer - Emergency Mode

⚠️  Telemetry system encountered an error
🔧 Switching to manual analysis mode
📞 Contact your Race Engineer for detailed investigation

Error: ${error instanceof Error ? error.message : 'Unknown error'}

Status: System operational, awaiting manual input
      `.trim(),
    };
  }
}

/**
 * AI-powered root cause detection
 */
function detectRootCause(issueData: any, commits: CommitInfo[]): {
  description: string;
  component: string;
  riskLevel: string;
} {
  const priority = issueData?.fields?.priority?.name || 'Unknown';
  const summary = issueData?.fields?.summary || '';

  // Pattern matching for common issues
  if (summary.toLowerCase().includes('timeout') || summary.toLowerCase().includes('slow')) {
    return {
      description: 'Performance degradation detected in database layer',
      component: 'Database Connection Pool',
      riskLevel: 'HIGH',
    };
  }

  if (summary.toLowerCase().includes('500') || summary.toLowerCase().includes('error')) {
    return {
      description: 'API error rate spike detected after recent deployment',
      component: 'API Gateway / Rate Limiter',
      riskLevel: 'CRITICAL',
    };
  }

  if (priority === 'Highest' || priority === 'High') {
    return {
      description: 'Critical incident requiring immediate investigation',
      component: 'Multiple systems',
      riskLevel: 'CRITICAL',
    };
  }

  return {
    description: 'Standard incident - investigating code changes',
    component: commits.length > 0 && commits[0]?.files?.[0] ? commits[0].files[0] : 'Unknown',
    riskLevel: 'MEDIUM',
  };
}

/**
 * Recommend pit stop strategy (like F1 tire strategy)
 */
function recommendStrategy(rootCause: { riskLevel: string }): {
  action: string;
  steps: string[];
  estimatedTime: string;
} {
  if (rootCause.riskLevel === 'CRITICAL') {
    return {
      action: '🔴 EMERGENCY PIT STOP - Immediate rollback required',
      steps: [
        'Roll back to last stable version immediately',
        'Enable circuit breaker on affected service',
        'Notify on-call team and stakeholders',
        'Investigate root cause in isolated environment',
      ],
      estimatedTime: '< 5 minutes',
    };
  }

  if (rootCause.riskLevel === 'HIGH') {
    return {
      action: '🟡 PLANNED PIT STOP - Deploy hotfix',
      steps: [
        'Deploy hotfix to staging environment',
        'Run smoke tests on critical paths',
        'Gradual rollout with monitoring',
        'Keep rollback plan ready',
      ],
      estimatedTime: '< 15 minutes',
    };
  }

  return {
    action: '🟢 ROUTINE MAINTENANCE - Monitor and patch',
    steps: [
      'Continue monitoring system metrics',
      'Schedule fix in next sprint',
      'Document incident for postmortem',
      'Update runbook with findings',
    ],
    estimatedTime: '< 30 minutes',
  };
}

/**
 * Add automated comment to Jira issue with analysis results
 */
async function addJiraComment(
  issueKey: string,
  analysis: string,
  recommendedAction: string
): Promise<void> {
  try {
    console.warn(`[PitWall Jira] 💬 Adding comment to ${issueKey}...`);

    const actionEmoji =
      recommendedAction === 'ROLLBACK'
        ? '🔴'
        : recommendedAction === 'HOTFIX'
          ? '🟡'
          : recommendedAction === 'MONITOR'
            ? '🟢'
            : '🔵';

    const comment = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `${actionEmoji} PitWall Analysis Complete`,
                marks: [{ type: 'strong' }],
              },
            ],
          },
          {
            type: 'codeBlock',
            attrs: { language: 'text' },
            content: [
              {
                type: 'text',
                text: analysis,
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `Recommended Action: ${recommendedAction}`,
                marks: [{ type: 'strong' }],
              },
            ],
          },
        ],
      },
    };

    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });

    console.warn(`[PitWall Jira] ✅ Comment added to ${issueKey}`);
  } catch (error) {
    console.error('[PitWall Jira] ❌ Error adding comment:', error);
  }
}

/**
 * Store incident metrics in Forge Storage
 */
async function storeIncidentMetrics(
  issueKey: string,
  metrics: {
    timestamp: string;
    priority: string;
    aiConfidence: number;
    suspectCommits: number;
    runbooksFound: number;
    recommendedAction: string;
  }
): Promise<void> {
  try {
    console.warn('[PitWall Storage] 💾 Storing incident metrics...');

    // Get existing metrics
    const existingMetrics = (await storage.get('incident-metrics')) || [];

    // Add new metric
    const updatedMetrics = [
      ...existingMetrics,
      {
        issueKey,
        ...metrics,
      },
    ];

    // Keep only last 100 incidents
    const trimmedMetrics = updatedMetrics.slice(-100);

    // Store updated metrics
    await storage.set('incident-metrics', trimmedMetrics);

    // Calculate and store aggregate statistics
    const totalIncidents = trimmedMetrics.length;
    const avgConfidence =
      trimmedMetrics.reduce((sum: number, m: any) => sum + (m.aiConfidence || 0), 0) / totalIncidents;

    await storage.set('incident-stats', {
      totalIncidents,
      avgConfidence: Math.round(avgConfidence),
      lastUpdated: new Date().toISOString(),
    });

    console.warn(`[PitWall Storage] ✅ Stored metrics for ${issueKey}`);
  } catch (error) {
    console.error('[PitWall Storage] ❌ Error storing metrics:', error);
  }
}

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
      await addJiraComment(issueKey, analysis, aiAnalysis.recommendedAction, rootCause.riskLevel);
    }

    // STEP 8: Auto-label and update issue fields
    if (issueKey) {
      await autoLabelAndUpdateIssue(issueKey, {
        aiConfidence: confidence,
        rootCause: rootCause.description,
        recommendedAction: aiAnalysis.recommendedAction,
        riskLevel: rootCause.riskLevel,
        estimatedMTTR: strategy.estimatedTime,
      });
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
 * Mentions team lead on high-risk incidents (CRITICAL/HIGH)
 */
async function addJiraComment(
  issueKey: string,
  analysis: string,
  recommendedAction: string,
  riskLevel: string
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

    // Get team lead accountId for high-risk mentions
    let teamLeadAccountId: string | null = null;
    const shouldMention = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';

    if (shouldMention) {
      try {
        // Get issue to find project lead or reporter
        const issueResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
        const issueData = await issueResponse.json();

        // Try to get project lead first, fallback to reporter
        const projectKey = issueData.fields.project.key;
        const projectResponse = await api
          .asUser()
          .requestJira(route`/rest/api/3/project/${projectKey}`, { method: 'GET' });
        const projectData = await projectResponse.json();

        teamLeadAccountId = projectData.lead?.accountId || issueData.fields.reporter?.accountId;
        console.warn(`[PitWall Jira] 👤 Team lead found: ${teamLeadAccountId}`);
      } catch (error) {
        console.error('[PitWall Jira] ⚠️  Could not fetch team lead for mention:', error);
      }
    }

    // Build comment content with optional mention
    const commentContent: any[] = [];

    // Add mention paragraph for high-risk incidents
    if (shouldMention && teamLeadAccountId) {
      commentContent.push({
        type: 'paragraph',
        content: [
          {
            type: 'mention',
            attrs: {
              id: teamLeadAccountId,
            },
          },
          {
            type: 'text',
            text: ` ${actionEmoji} URGENT: PitWall detected a ${riskLevel} risk incident requiring immediate attention!`,
          },
        ],
      });
    }

    // Add main analysis header
    commentContent.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `${actionEmoji} PitWall Analysis Complete`,
          marks: [{ type: 'strong' }],
        },
      ],
    });

    // Add analysis code block
    commentContent.push({
      type: 'codeBlock',
      attrs: { language: 'text' },
      content: [
        {
          type: 'text',
          text: analysis,
        },
      ],
    });

    // Add recommended action
    commentContent.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `Recommended Action: ${recommendedAction}`,
          marks: [{ type: 'strong' }],
        },
      ],
    });

    const comment = {
      body: {
        type: 'doc',
        version: 1,
        content: commentContent,
      },
    };

    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });

    console.warn(`[PitWall Jira] ✅ Comment added to ${issueKey}${shouldMention ? ' with @mention' : ''}`);
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

/**
 * Auto-label and update Jira issue with AI analysis results
 * Professional Jira apps always add labels and custom fields
 */
async function autoLabelAndUpdateIssue(
  issueKey: string,
  metadata: {
    aiConfidence: number;
    rootCause: string;
    recommendedAction: string;
    riskLevel: string;
    estimatedMTTR: string;
  }
): Promise<void> {
  try {
    console.warn(`[PitWall Jira] 🏷️  Auto-labeling ${issueKey}...`);

    // Get current labels
    const issueResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
    const issueData = await issueResponse.json();
    const currentLabels = issueData.fields.labels || [];

    // Build smart labels based on analysis
    const newLabels = [
      'ai-analyzed', // Always add this
      `confidence-${metadata.aiConfidence >= 80 ? 'high' : metadata.aiConfidence >= 60 ? 'medium' : 'low'}`,
      `action-${metadata.recommendedAction.toLowerCase()}`,
      `risk-${metadata.riskLevel.toLowerCase()}`,
    ];

    // Merge with existing labels (no duplicates)
    const mergedLabels = [...new Set([...currentLabels, ...newLabels])];

    // Update issue with labels and description
    const updatePayload = {
      fields: {
        labels: mergedLabels,
      },
      update: {
        // Add AI analysis metadata to description
        description: [
          {
            add: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'panel',
                  attrs: { panelType: 'info' },
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: '🏎️ PitWall AI Analysis',
                          marks: [{ type: 'strong' }],
                        },
                      ],
                    },
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: `AI Confidence: ${metadata.aiConfidence}% | ` },
                        { type: 'text', text: `Risk: ${metadata.riskLevel} | ` },
                        { type: 'text', text: `MTTR: ${metadata.estimatedMTTR}` },
                      ],
                    },
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: `Root Cause: ${metadata.rootCause}` },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    };

    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    console.warn(`[PitWall Jira] ✅ Labels added: ${newLabels.join(', ')}`);

    // If CRITICAL risk, bump priority if possible
    if (metadata.riskLevel === 'CRITICAL') {
      await adjustPriority(issueKey, 'Highest');
    }
  } catch (error) {
    console.error('[PitWall Jira] ❌ Error auto-labeling:', error);
  }
}

/**
 * Adjust issue priority based on risk level
 */
async function adjustPriority(issueKey: string, priorityName: string): Promise<void> {
  try {
    console.warn(`[PitWall Jira] ⚡ Adjusting priority to ${priorityName}...`);

    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          priority: { name: priorityName },
        },
      }),
    });

    console.warn(`[PitWall Jira] ✅ Priority adjusted to ${priorityName}`);
  } catch (error) {
    console.error('[PitWall Jira] ⚠️  Could not adjust priority:', error);
    // Not critical - many projects have different priority schemes
  }
}

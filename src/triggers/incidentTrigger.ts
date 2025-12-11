import { z } from 'zod';
import { JiraIssueEventSchema } from '../shared/types/incident.types';
import { handler as analyzeIncident } from '../analyzers/incidentAnalyzer';
import api, { route } from '@forge/api';

/**
 * Enhanced Incident Trigger Handler
 * Auto-detects P1/P2 incidents and triggers immediate analysis
 *
 * Smart detection criteria:
 * - Priority: Highest, High
 * - Keywords: error, crash, down, timeout, outage, 500, critical
 * - Issue type: Bug, Incident
 */
export async function handler(event: unknown): Promise<void> {
  try {
    console.warn('[PitWall Trigger] 🏎️ Incident detected! Race Engineer activating...');

    // Validate event payload
    const parsedEvent = JiraIssueEventSchema.parse(event);
    const { issue } = parsedEvent;

    console.warn(`[PitWall Trigger] Issue: ${issue.key}`);
    console.warn(`[PitWall Trigger] Summary: ${issue.fields.summary}`);
    console.warn(`[PitWall Trigger] Priority: ${issue.fields.priority?.name || 'Unknown'}`);
    console.warn(`[PitWall Trigger] Type: ${issue.fields.issuetype?.name || 'Unknown'}`);

    // Smart detection logic
    const shouldAutoAnalyze = isHighPriorityIncident(issue);

    if (shouldAutoAnalyze) {
      console.warn('[PitWall Trigger] 🚨 AUTO-TRIGGER ACTIVATED - Starting immediate analysis...');

      // Add @mention notification for high-risk incidents
      await notifyTeam(issue.key, issue.fields.priority?.name || 'High');

      // Trigger automatic analysis (async - don't wait)
      analyzeIncident({ issueKey: issue.key })
        .then(() => {
          console.warn(`[PitWall Trigger] ✅ Auto-analysis completed for ${issue.key}`);
        })
        .catch((error) => {
          console.error(`[PitWall Trigger] ❌ Auto-analysis failed for ${issue.key}:`, error);
        });

      console.warn('[PitWall Trigger] 🏁 Auto-analysis queued (running async)');
    } else {
      console.warn('[PitWall Trigger] ℹ️  Low priority - manual analysis only');
    }

    console.warn('[PitWall Trigger] 🏁 Trigger handler completed successfully');
  } catch (error) {
    console.error('[PitWall Trigger] ❌ Error in incident trigger:', error);

    // Graceful degradation - don't break Jira
    if (error instanceof z.ZodError) {
      console.error('[PitWall Trigger] Invalid event payload:', error.errors);
    }
  }
}

/**
 * Smart detection: Check if issue qualifies for auto-analysis
 */
function isHighPriorityIncident(issue: any): boolean {
  const priority = issue.fields.priority?.name || '';
  const summary = (issue.fields.summary || '').toLowerCase();
  const issueType = (issue.fields.issuetype?.name || '').toLowerCase();

  // 1. Priority check
  const isHighPriority = priority === 'Highest' || priority === 'High';

  // 2. Keyword detection
  const criticalKeywords = ['error', 'crash', 'down', 'timeout', 'outage', '500', 'critical', 'urgent', 'broken', 'fail'];
  const hasKeyword = criticalKeywords.some((keyword) => summary.includes(keyword));

  // 3. Issue type check
  const isCriticalType = issueType === 'bug' || issueType === 'incident';

  // Auto-trigger if: (High Priority) OR (Keyword + Bug/Incident)
  return isHighPriority || (hasKeyword && isCriticalType);
}

/**
 * Notify team with @mention for high-risk incidents
 * Adds comment with team mention immediately
 */
async function notifyTeam(issueKey: string, priority: string): Promise<void> {
  try {
    console.warn(`[PitWall Trigger] 📢 Notifying team for ${issueKey}...`);

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
                text: '🚨 ',
                marks: [{ type: 'strong' }],
              },
              {
                type: 'text',
                text: `PitWall Auto-Detected ${priority} Priority Incident`,
                marks: [{ type: 'strong' }],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '⚡ Race Engineer is analyzing this incident automatically. Analysis will be posted shortly.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '📊 Scanning: Bitbucket commits, Confluence runbooks, Atlassian Intelligence',
              },
            ],
          },
        ],
      },
    };

    await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });

    console.warn(`[PitWall Trigger] ✅ Team notified for ${issueKey}`);
  } catch (error) {
    console.error('[PitWall Trigger] ⚠️  Could not notify team:', error);
    // Non-critical - continue
  }
}

import ForgeUI, {
  render,
  Fragment,
  Text,
  Strong,
  StatusLozenge,
  Button,
  useState,
  useProductContext,
  SectionMessage,
} from '@forge/ui';
import { handler as analyzeIncident } from '../analyzers/incidentAnalyzer';
import api, { storage, route } from '@forge/api';

/**
 * Interactive Panel Handler
 * Professional Jira Issue Panel with real-time metrics
 */

const App = () => {
  const context = useProductContext();
  const issueKey = (context?.platformContext as any)?.issueKey;

  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalIncidents: number; avgConfidence: number }>({
    totalIncidents: 0,
    avgConfidence: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);

  // Load incident stats and recent analyses from storage on mount
  useState(async () => {
    try {
      const incidentStats = await storage.get('incident-stats');
      if (incidentStats) {
        setStats(incidentStats);
      }

      // Load recent analyses (last 5)
      const allMetrics = (await storage.get('incident-metrics')) || [];
      const recent = allMetrics.slice(-5).reverse(); // Last 5, most recent first
      setRecentAnalyses(recent);
    } catch (err) {
      console.error('[PitWall Panel] Error loading stats:', err);
    }
  });

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      console.warn(`[PitWall Panel] 🏎️ Starting analysis for ${issueKey}...`);

      const result = await analyzeIncident({ issueKey });

      setLastAnalysis(result.analysis);
      console.warn('[PitWall Panel] ✅ Analysis complete');
    } catch (err) {
      console.error('[PitWall Panel] ❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRollback = async () => {
    setActionInProgress('rollback');
    setActionResult(null);
    setError(null);

    try {
      console.warn(`[PitWall Panel] 🔴 Initiating rollback for ${issueKey}...`);

      // Add rollback label
      const issueResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
      const issueData = await issueResponse.json();
      const currentLabels = issueData.fields.labels || [];

      await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            labels: [...currentLabels, 'rollback-required', 'action-urgent'],
          },
        }),
      });

      // Add rollback comment
      await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'panel',
                attrs: { panelType: 'warning' },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: '🔴 ROLLBACK INITIATED',
                        marks: [{ type: 'strong' }],
                      },
                    ],
                  },
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'PitWall detected critical risk. Rollback procedure recommended.',
                      },
                    ],
                  },
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Next Steps:',
                        marks: [{ type: 'strong' }],
                      },
                    ],
                  },
                  {
                    type: 'orderedList',
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Identify last stable commit' }],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Execute git revert or rollback deployment' }],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Monitor system stability' }],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Update this ticket with rollback results' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
      });

      setActionResult('✅ Rollback procedure initiated. Check comments for details.');
      console.warn('[PitWall Panel] ✅ Rollback action complete');
    } catch (err) {
      console.error('[PitWall Panel] ❌ Rollback action failed:', err);
      setError(err instanceof Error ? err.message : 'Rollback action failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleHotfix = async () => {
    setActionInProgress('hotfix');
    setActionResult(null);
    setError(null);

    try {
      console.warn(`[PitWall Panel] 🟡 Preparing hotfix for ${issueKey}...`);

      // Add hotfix label
      const issueResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
      const issueData = await issueResponse.json();
      const currentLabels = issueData.fields.labels || [];

      await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            labels: [...currentLabels, 'hotfix-candidate', 'action-required'],
          },
        }),
      });

      // Add hotfix comment
      await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'panel',
                attrs: { panelType: 'note' },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: '🟡 HOTFIX RECOMMENDED',
                        marks: [{ type: 'strong' }],
                      },
                    ],
                  },
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'PitWall recommends a targeted hotfix for this issue.',
                      },
                    ],
                  },
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Hotfix Workflow:',
                        marks: [{ type: 'strong' }],
                      },
                    ],
                  },
                  {
                    type: 'orderedList',
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Create hotfix branch from production' }],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Implement minimal fix for root cause' }],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Fast-track code review and testing' }],
                          },
                        ],
                      },
                      {
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Deploy to production with monitoring' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }),
      });

      setActionResult('✅ Hotfix workflow initiated. Check comments for details.');
      console.warn('[PitWall Panel] ✅ Hotfix action complete');
    } catch (err) {
      console.error('[PitWall Panel] ❌ Hotfix action failed:', err);
      setError(err instanceof Error ? err.message : 'Hotfix action failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const currentIssue: string = issueKey || 'N/A';

  return (
    <Fragment>
      {/* Header */}
      <Text>
        <Strong>🏎️ PitWall Race Engineer</Strong>
      </Text>
      <Text>Your AI-powered incident analysis system</Text>
      <Text>───────────────────────────────────────</Text>

      {/* Status Section */}
      <SectionMessage title="System Status" appearance="info">
        <Text>Status: <StatusLozenge text="Online" appearance="success" /></Text>
        <Text>📡 Telemetry: Ready</Text>
        <Text>🤖 AI Engine: Active (Atlassian Intelligence)</Text>
        <Text>⏱️ MTTR Target: &lt; 5 minutes</Text>
      </SectionMessage>

      {/* Team Metrics */}
      <Text>
        <Strong>Team Performance Metrics</Strong>
      </Text>
      <Text>{`Total Incidents Analyzed: ${stats.totalIncidents}`}</Text>
      <Text>{`Average AI Confidence: ${stats.avgConfidence}%`}</Text>
      <Text>{`Current Issue: ${currentIssue}`}</Text>
      <Text>───────────────────────────────────────</Text>

      {/* Action Button */}
      <Button
        text={analyzing ? "🔄 Analyzing..." : "🚀 Run PitWall Analysis"}
        onClick={runAnalysis}
        disabled={analyzing || !issueKey}
        appearance="primary"
      />

      {/* Quick Actions Section */}
      <Text>───────────────────────────────────────</Text>
      <Text>
        <Strong>Quick Actions</Strong>
      </Text>
      <Text>Emergency response actions for critical incidents</Text>

      <Button
        text={actionInProgress === 'rollback' ? "🔄 Processing..." : "🔴 Initiate Rollback"}
        onClick={handleRollback}
        disabled={actionInProgress !== null || !issueKey}
        appearance="danger"
      />

      <Button
        text={actionInProgress === 'hotfix' ? "🔄 Processing..." : "🟡 Prepare Hotfix"}
        onClick={handleHotfix}
        disabled={actionInProgress !== null || !issueKey}
        appearance="warning"
      />

      {/* Action Result Display */}
      {actionResult ? (
        <SectionMessage title="Action Complete" appearance="confirmation">
          <Text>{actionResult}</Text>
        </SectionMessage>
      ) : null}

      {/* Error Display */}
      {error ? (
        <SectionMessage title="Error" appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      {/* Analysis Results */}
      {lastAnalysis ? (
        <SectionMessage title="Analysis Complete" appearance="confirmation">
          <Text>{lastAnalysis.substring(0, 500)}...</Text>
          <Text>
            <Strong>Full analysis added to issue comments</Strong>
          </Text>
        </SectionMessage>
      ) : null}

      {/* Recent Analyses Timeline */}
      <Text>───────────────────────────────────────</Text>
      <Text>
        <Strong>Recent Incident Timeline</Strong>
      </Text>
      <Text>Last 5 analyzed incidents across all projects</Text>

      {recentAnalyses && recentAnalyses.length > 0 ? (
        <Fragment>
          {recentAnalyses.map((incident: any, index: number) => {
            const timestamp = new Date(incident.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const confidenceBadge =
              incident.aiConfidence >= 80 ? 'success' : incident.aiConfidence >= 60 ? 'moved' : 'removed';

            const riskColor =
              incident.priority === 'Highest' || incident.priority === 'High' ? 'removed' : 'moved';

            return (
              <Fragment key={index}>
                <Text>
                  <Strong>{`${index + 1}. ${incident.issueKey || 'N/A'}`}</Strong>
                  {' • '}
                  {timestamp}
                </Text>
                <Text>
                  {'   Priority: '}
                  <StatusLozenge text={incident.priority || 'Unknown'} appearance={riskColor} />
                  {'   AI: '}
                  <StatusLozenge text={`${incident.aiConfidence}%`} appearance={confidenceBadge} />
                </Text>
                <Text>{`   Action: ${incident.recommendedAction || 'N/A'}`}</Text>
                <Text>{`   Suspects: ${incident.suspectCommits || 0} commits | Runbooks: ${incident.runbooksFound || 0}`}</Text>
                {index < recentAnalyses.length - 1 ? <Text>{'   ↓'}</Text> : null}
              </Fragment>
            );
          })}
        </Fragment>
      ) : (
        <Text>No recent analyses available. Run your first analysis above!</Text>
      )}

      {/* Footer */}
      <Text>───────────────────────────────────────</Text>
      <Text>
        <Strong>Williams Racing Edition</Strong> • Powered by Atlassian Forge
      </Text>
      <Text>Cross-Product AI Context Engine: Jira + Bitbucket + Confluence</Text>
    </Fragment>
  );
};

export const handler = render(<App />);

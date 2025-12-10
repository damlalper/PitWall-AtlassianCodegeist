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
import { storage } from '@forge/api';

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
  const [stats, setStats] = useState<{ totalIncidents: number; avgConfidence: number }>({
    totalIncidents: 0,
    avgConfidence: 0,
  });

  // Load incident stats from storage on mount
  useState(async () => {
    try {
      const incidentStats = await storage.get('incident-stats');
      if (incidentStats) {
        setStats(incidentStats);
      }
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

      {/* Error Display */}
      {error ? (
        <SectionMessage title="Analysis Error" appearance="error">
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
